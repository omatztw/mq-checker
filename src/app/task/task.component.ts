import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Line } from '../models/line';
import { LineInfo, SdtScore, Task } from '../models/models';
import { getLogDate, isNativeFileSystemSupported, parseLine, splitLines } from '../util/util';

@Component({
  selector: 'app-task',
  templateUrl: './task.component.html',
  styleUrls: ['./task.component.scss']
})
export class TaskComponent implements OnInit, OnDestroy {

  @ViewChild('fileInput') fileInput: ElementRef;

  file: File | null = null;
  lines: string[];
  form: FormGroup;
  sdtRelatedLineInfos: LineInfo[];
  showSettings = true;
  showDetail = false;
  sdtScore: SdtScore;
  parsedLines: Line[];
  tasks: Task[] = [];
  fileHandle: any;
  timer: number;
  reader: FileReader;
  supported = isNativeFileSystemSupported();

  constructor() { }

  ngOnInit(): void {
    this.tasks.push(new Task());
    this.loadTasks();
    this.loadShowSettings();

    this.reader = new FileReader();
    this.reader.onload = e => {
      this.readLine(e.target.result.toString());
      this.parsedLines = this.lines.map(l => parseLine(l)).filter(l => l !== undefined);
      this.fillDate();
      this.fileInput.nativeElement.value = null;
    };

  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  addItem(): void {
    this.showSettings = true;
    this.tasks.push(new Task());
  }

  removeItem(index: number): void {
    this.tasks.splice(index, 1);
    this.saveTasks();
  }

  onClickFileInputButton(): void {
    this.fileInput.nativeElement.click();
  }

  onShowDetail(task: Task): void {
    task.showDetail = !task.showDetail;
  }

  async onClick(e: any): Promise<void> {

    const options = {
      types: [
        {
          description: 'TW ChatLog',
          accept: {
            'text/html': ['.html'],
          },
        },
      ],
    };
    [this.fileHandle] = await (window as any).showOpenFilePicker(options);
    if (this.timer) {
      this.clearTimer();
    }
    this.file = await this.fileHandle.getFile();
    this.readText();
    if (this.isToday(this.file)) {
      this.timer = setInterval(async () => {
        this.file = await this.fileHandle.getFile();
        if (!this.isToday(this.file)) {
          this.clearTimer();
        }
        this.readText();
      }, 30000);
    }
  }

  private isToday(file: File): boolean {
    const cDate = getLogDate(file);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return cDate.getTime() === today.getTime();
  }

  private readText(): void {
    if (!this.file){
      return;
    }
    this.reader.readAsText(this.file, 'shift-jis');
  }

  private clearTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.timer = undefined;
  }

  onChangeFileInput(): void {
    const files: { [key: string]: File } = this.fileInput.nativeElement.files;
    this.file = files[0];
    this.readText();
  }

  get date(): Date {
    return getLogDate(this.file);
  }

  // get tweetText(): string {
  //   let text = '';
  //   if (this.date) {
  //     text += `${this.date.toLocaleDateString()} `;
  //   }
  //   if (this.sdtScore && this.summary) {
  //     const total = calcTotal(this.summary.map(s => s.count));
  //     text += `クラブ [${this.sdtScore.clubName}]の争奪戦記録%0A`;
  //     text += `${total}MAP ${this.sdtScore.score}Mで${this.sdtScore.region}地域 ${this.sdtScore.rank}位でした！%0A%0A`;
  //   }

  //   text += `%23争奪チェッカー ${window.location.href}`;
  //   return text;
  // }

  private readLine(str: string): void {
    const lines = splitLines(str);
    this.lines = lines;
  }

  onChange(fillDate: boolean): void {
    if (fillDate) {
      this.fillDate();
    }
    this.saveTasks();
    this.saveShowSettings();

  }

  private fillDate(): void {
    this.tasks.filter(t => !!t.content).forEach(task => {
      task.details = this.parsedLines.filter(l => {
        const regexp = new RegExp(task.content);
        return regexp.test(l.message);
      }).map(l => {
        return {
          time: l.time,
          message: l.message
        };
      });
    });
  }

  private saveTasks(): void {
    localStorage.setItem('tasks', JSON.stringify(this.tasks.map(t => {
      const task = new Task();
      task.title = t.title;
      task.content = t.content;
      return task;
    })));
  }

  private saveShowSettings(): void {
    localStorage.setItem('taskShowSettings', JSON.stringify(this.showSettings));
  }

  private loadShowSettings(): void {
    const stored = JSON.parse(localStorage.getItem('taskShowSettings'));
    if (stored !== null) {
      this.showSettings = stored;
    }
  }

  private loadTasks(): void {
    const stored = JSON.parse(localStorage.getItem('tasks'));
    if (stored) {
      this.tasks = stored.map(t => {
        const task = new Task();
        task.title = t.title;
        task.content = t.content;
        return task;
      });
    }
  }

}



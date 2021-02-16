import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Line } from '../models/line';
import { LineInfo, SdtScore, Task } from '../models/models';
import { getLogDate, parseLine, splitLines } from '../util/util';

@Component({
  selector: 'app-task',
  templateUrl: './task.component.html',
  styleUrls: ['./task.component.scss']
})
export class TaskComponent implements OnInit {

  @ViewChild('fileInput') fileInput: { nativeElement: { click: () => void; files: { [key: string]: File; }; }; };

  file: File | null = null;
  lines: string[];
  form: FormGroup;
  sdtRelatedLineInfos: LineInfo[];
  showSettings = true;
  sdtScore: SdtScore;
  parsedLines: Line[];
  tasks: Task[] = [];

  constructor() { }

  ngOnInit(): void {
    this.tasks.push(new Task());
    this.loadTasks();
    this.loadShowSettings();
  }

  addItem(): void {
      this.tasks.push(new Task());
  }

  removeItem(index: number): void {
    this.tasks.splice(index, 1);
    this.saveTasks();
  }

  onClickFileInputButton(): void {
    this.fileInput.nativeElement.click();
  }

  onChangeFileInput(): void {
    const files: { [key: string]: File } = this.fileInput.nativeElement.files;
    this.file = files[0];
    const reader = new FileReader();
    reader.onload = e => {
      this.readLine(e.target.result.toString());
      this.parsedLines = this.lines.map(l => parseLine(l)).filter(l => l !== undefined);
      this.fillDate();
    };
    reader.readAsText(this.file, 'shift-jis');
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
      task.times = this.parsedLines.filter(l => {
        const regexp = new RegExp(task.content);
        return regexp.test(l.message);
      }).map(l => l.time);
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



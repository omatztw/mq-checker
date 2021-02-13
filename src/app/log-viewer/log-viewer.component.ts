import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { Line } from '../models/line';
import { fetchDateFromLine, getLogDate, isNativeFileSystemSupported, parseChar, splitLines } from '../util/util';
import { ChatType } from '../models/models';
import { Charactor } from '../models/char';
import { MatTableDataSource } from '@angular/material/table';


@Component({
  selector: 'app-log-viewer',
  templateUrl: './log-viewer.component.html',
  styleUrls: ['./log-viewer.component.scss']
})
export class LogViewerComponent implements OnInit, OnDestroy {

  timer: number;
  // reader: FileReader;
  lineEmitter = new Subject<Line>();
  history: Line[] = [];
  subscription: Subscription;
  dirHandle: any;
  currentChar: Charactor;
  dataSource: MatTableDataSource<Line> = new MatTableDataSource();
  isOpenOption = false;
  calclating = false;
  includesText = '';

  supported = isNativeFileSystemSupported();

  get includes(): string[] {
    return splitLines(this.includesText).filter(s => !!s);
  }

  displayedColumns = ['date', 'time', 'login', 'name', 'message'];

  chatTypeSelections = [
    {
      name: 'クラブ',
      colors: [ChatType.Club],
      display: true
    },
    {
      name: 'チーム',
      colors: [ChatType.Team],
      display: true
    },
    {
      name: '一般',
      colors: [ChatType.General, ChatType.GeneralOwn],
      display: false
    },
    {
      name: 'システム',
      colors: [ChatType.System, ChatType.Management],
      display: false
    },
    {
      name: '耳打ち',
      colors: [ChatType.Dm],
      display: true
    },
    {
      name: '叫び',
      colors: [ChatType.Shout],
      display: true
    },
    {
      name: 'GM',
      colors: [ChatType.Gm],
      display: true
    }
  ];

  get filteringColors(): ChatType[] {
    // [].concat: to flatten nested array.
    return [].concat(...this.chatTypeSelections.filter(chatInfo => chatInfo.display).map(chatInfo => chatInfo.colors));
  }

  get filteredData(): MatTableDataSource<Line> {
    // return this.history;
    this.dataSource.data = this.history.filter(h => {
      if (this.includes.some(inc => {
        const regexp = new RegExp(inc);
        return regexp.test(h.message);
      })){
        return true;
      }
      if (this.filteringColors.some(c => c === h.color)) {
        return true;
      }
      return false;
    });
    return this.dataSource;
  }

  updateData(): void {
    this.dataSource = new MatTableDataSource(this.history.filter(l => this.filteringColors.some(c => c === l.color)));
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue;
  }

  constructor() { }

  ngOnInit(): void {
    // this.reader = new FileReader();

    // this.reader.onload = (e) => {
    //   const lines = splitLines(e.target.result.toString());
    //   lines.forEach(l => {
    //     const line = this.parseLine(l);
    //     if (line) {
    //       this.lineEmitter.next(line);
    //       if (line.message.includes('&nbsp')) {
    //         this.history[0].message += line.message.replace(/&nbsp/g, '').trim();
    //       } else {
    //         this.history = [line, ...this.history];
    //       }
    //       this.history = this.history.slice(0, 1000);
    //       this.dataSource.data = this.history;
    //     }
    //   });
    // };
    // this.subscription = this.lineEmitter.subscribe(l => {
    //   if (l.message.includes('&nbsp')) {
    //     this.history[0].message += l.message.replace(/&nbsp/g, '').trim();
    //   } else {
    //     this.history = [l, ...this.history];
    //   }
    //   this.history = this.history.slice(0, 1000);
    //   this.dataSource.data = this.history;
    // });
    this.loadChatSelections();
  }

  loadString(s: string): void {
    this.calclating = true;
    const lines = splitLines(s);
    lines.forEach(l => {
      const line = this.parseLine(l);
      if (line) {
        this.lineEmitter.next(line);
        if (line.message.includes('&nbsp')) {
          this.history[0].message += line.message.replace(/&nbsp/g, '').trim();
        } else {
          this.history = [line, ...this.history];
        }
        this.history = this.history.slice(0, 1000);
        this.dataSource.data = this.history;
      }
    });
    this.calclating = false;
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  loadChatSelections(): void {
    const stored = JSON.parse(localStorage.getItem('chatSelections'));
    if (stored) {
      this.chatTypeSelections.forEach(c => {
        if (stored.some(s => s.name === c.name)) {
          c.display = stored.find(s => s.name === c.name).display;
        }
      });
    }
  }

  saveChatSelections(): void {
    localStorage.setItem('chatSelections', JSON.stringify(this.chatTypeSelections));
  }

  onCheckSelection(): void {
    this.saveChatSelections();
  }

  toggleShowOption(): void {
    this.isOpenOption = !this.isOpenOption;
  }


  async onClick(e: any): Promise<void> {
    this.dirHandle = await (window as any).showDirectoryPicker();
    let curPos = 0;
    this.timer = setInterval(async () => {
        for await (const entry of this.dirHandle.values()) {
            if (entry.kind === 'directory' && entry.name === 'ChatLog') {
              for await (const chatLog of entry.values()) {
                  const cDate = getLogDate(await chatLog.getFile());
                  if (!cDate){
                    continue;
                  }
                  const now = new Date();
                  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                  if (cDate.getTime() === today.getTime()) {
                    const file: File = await chatLog.getFile();
                    const fileSize = file.size;
                    if (curPos === 0) {
                          curPos = fileSize;
                      }else if (curPos > fileSize) {
                          curPos = 0; // 日付が変わった場合を想定
                      }
                    if (curPos === fileSize) {
                          continue;
                      }
                    if (this.calclating) {
                      continue;
                    }
                    const blob: Blob = file.slice(curPos, fileSize);
                    await this.fetchCurrentChar();
                    let text: ArrayBuffer;

                    try {
                      text = await blob.arrayBuffer();
                    } catch (err) {
                      // 読み込みできなかった場合は次のターンに回す
                      continue;
                    }
                    curPos = fileSize;
                    const td = new TextDecoder('Shift_JIS');
                    const shiftJisText = td.decode(text);
                    this.loadString(shiftJisText);
                    // this.reader.readAsText(blob, 'shift-jis');
                  }
              }
          }
        }
    }, 3000);
  }

  async fetchCurrentChar(): Promise<void> {
    const files = [];
    for await (const entry of this.dirHandle.values()) {
      if (entry.name.includes('profile')) {
          files.push(await entry.getFile());
      }
    }
    files.sort((a, b) => b.lastModified - a.lastModified);
    const char = parseChar(files[0].name, files[0].lastModified);
    this.currentChar = char;
  }



  private parseLine(line: string): Line {
    const lineInfo = new Line();
    const match = line.match(/(\[ *\d+時 *\d+分 *\d+秒 *\]).+color="(#[0-9a-f]+)">(.+)<\/font>/);
    if (match) {
      const content = match[3];
      const chat = content.match(/([^:]+) : (.+)/);
      if (chat && match[2] !== ChatType.System && match[2] !== ChatType.Management) {
        lineInfo.name = chat[1];
        lineInfo.message = chat[2];
      } else {
        lineInfo.message = content;
      }
      lineInfo.time = fetchDateFromLine(match[1], new Date());
      lineInfo.color = match[2];
      lineInfo.currentChar = this.currentChar.name;
      return lineInfo;
    }
    return;
  }

}

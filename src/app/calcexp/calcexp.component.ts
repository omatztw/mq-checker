import { Component, OnDestroy, OnInit } from '@angular/core';
import { ExpLine } from '../models/line';
import {
  fetchDateFromLine,
  getLogDate,
  isNativeFileSystemSupported,
  splitLines,
} from '../util/util';

@Component({
  selector: 'app-calcexp',
  templateUrl: './calcexp.component.html',
  styleUrls: ['./calcexp.component.scss'],
})
export class CalcexpComponent implements OnInit, OnDestroy {
  timer: number;
  startTime: Date;
  currentTime: Date;
  totalExp: number = 0;

  // history: Line[] = [];
  dirHandle: any;
  calclating = false;

  supported = isNativeFileSystemSupported();

  get duration(): number {
    if (!this.currentTime || !this.startTime) {
      return 0;
    }

    return (
      Math.round(this.currentTime.getTime() / 1000) -
      Math.round(this.startTime.getTime() / 1000)
    );
  }

  get durationStr(): string {
    if (!this.currentTime || !this.startTime) {
      return '';
    }
    const d = Math.floor(this.duration / (60 * 60 * 24));
    const h = Math.floor(this.duration / (60 * 60)) % 24;
    const m = Math.floor(this.duration / 60) % 60;
    const s = this.duration % 60;

    // 時間、分、秒を2桁の左0埋め
    const hName = `00${h}`.slice(-2);
    const mName = `00${m}`.slice(-2);
    const sName = `00${s}`.slice(-2);

    return `${d}日 ${hName}時 ${mName}分 ${sName}秒`;
  }

  get expRate(): number {
    if (this.duration <= 0) {
      return 0;
    }
    return Math.round(this.totalExp / this.duration);
  }

  constructor() {}

  ngOnInit(): void {}

  loadString(s: string): void {
    this.calclating = true;
    const lines = splitLines(s);
    lines
      .map(this.parseLine.bind(this))
      .filter((l) => !!l)
      .forEach((l: ExpLine) => {
        // const line = this.parseLine(l);
        if (l) {
          if (!this.startTime) {
            this.startTime = l.time;
          }
          this.currentTime = l.time;
          this.totalExp += l.exp;
        }
      });
    this.calclating = false;
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  clearTime(): void {
    this.currentTime = null;
    this.startTime = null;
    this.totalExp = 0;
  }

  async onClick(e: any): Promise<void> {
    this.dirHandle = await (window as any).showDirectoryPicker();
    let curPos = 0;
    this.timer = setInterval(async () => {
      for await (const entry of this.dirHandle.values()) {
        if (entry.kind === 'directory' && entry.name === 'ChatLog') {
          for await (const chatLog of entry.values()) {
            const cDate = getLogDate(await chatLog.getFile());
            if (!cDate) {
              continue;
            }
            const now = new Date();
            const today = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate()
            );
            if (cDate.getTime() === today.getTime()) {
              const file: File = await chatLog.getFile();
              const fileSize = file.size;
              if (curPos === 0) {
                curPos = fileSize;
              } else if (curPos > fileSize) {
                curPos = 0; // 日付が変わった場合を想定
              }
              if (curPos === fileSize) {
                continue;
              }
              if (this.calclating) {
                continue;
              }
              const blob: Blob = file.slice(curPos, fileSize);
              let text: ArrayBuffer;

              try {
                text = await blob.arrayBuffer();
              } catch (err) {
                // 読み込みできなかった場合は次のターンに回す
                console.error(err);
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

  private parseLine(line: string): ExpLine {
    const lineInfo = new ExpLine();
    const match = line.match(
      /(\[ *\d+時 *\d+分 *\d+秒 *\]).+color="#ff64ff">経験値が (\d+) 上がりました。<\/font>/
    );
    if (match) {
      lineInfo.time = fetchDateFromLine(match[1], new Date());
      const exp: number = Number(match[2]);
      lineInfo.exp = exp;
      return lineInfo;
    }
    return;
  }
}

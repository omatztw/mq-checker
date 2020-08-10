import { Component, ViewChild } from '@angular/core';
import {LineType, LineInfo, MAP_INFO} from '../models/models';
import { toMinutes, totalTime, getLogDate, fetchDateFromLine } from '../util';

@Component({
  selector: 'app-uploader',
  templateUrl: './uploader.component.html',
  styleUrls: ['./uploader.component.scss']
})
export class UploaderComponent {

  @ViewChild('fileInput') fileInput: { nativeElement: { click: () => void; files: { [key: string]: File; }; }; };

  file: File | null = null;
  lines: string[];
  meiqRelatedLineInfos: LineInfo[];

  onClickFileInputButton(): void {
    this.fileInput.nativeElement.click();
  }

  onChangeFileInput(): void {
    const files: { [key: string]: File } = this.fileInput.nativeElement.files;
    this.file = files[0];
    const reader = new FileReader();
    reader.onload = e => {
      this.readLine(e.target.result.toString());
      this.fetchData();
      this.completeLineInfo();
      this.removeDuplicate();
    };
    reader.readAsText(this.file, 'shift-jis');
  }

  get date(): Date {
    return getLogDate(this.file);
  }

  get tweetText(): string {
    let text = '';
    if (this.date) {
      text += `${this.date.toLocaleDateString()}%0A`;
    }
    if (this.meiqRelatedLineInfos) {
      this.meiqRelatedLineInfos.forEach(
        info => {
          const duration = toMinutes(info.duration);
          text += `${duration}  ${info.title}%0A`;
        }
      );
      text += `-------------%0A`;
      text += `${toMinutes(totalTime(this.meiqRelatedLineInfos))}%0A%0A`;
    }
    text += `%23迷宮チェッカー ${window.location.href}`;
    return text;
  }

  private readLine(str: string): void {
    const lines = this.splitLines(str);
    this.lines = lines;
  }

  private splitLines(str: string): string[] {
    return str.split(/\r\n|\n|\r/);
  }

  private fetchData(): void {
     this.meiqRelatedLineInfos = this.lines
     .filter(line => MAP_INFO.some(m => line.includes(m.key)))
    .map(line => {
        const match = MAP_INFO.find(m => line.includes(m.key));
        const lineInfo = new LineInfo();
        lineInfo.title = match.value;
        lineInfo.type = match.type;
        lineInfo.startTime = fetchDateFromLine(line, this.date);
        return lineInfo;
      });
  }

  private completeLineInfo(): void {
    this.meiqRelatedLineInfos.reduce((p, c) => {
      if (c.type === LineType.line) {
        p.endTime = c.startTime;
      }
      return c;
    });
    this.meiqRelatedLineInfos = this.meiqRelatedLineInfos
                                .filter(i => !!i.endTime)
                                .filter(i => i.type !== LineType.offline);
  }

  private removeDuplicate(): void {
    this.meiqRelatedLineInfos.reduce((p, c, i, arr) => {
      if (p && p.title === c.title) {
        this.meiqRelatedLineInfos.splice(i - 1, 1);
      }
      return c;
    }, undefined);
  }

}



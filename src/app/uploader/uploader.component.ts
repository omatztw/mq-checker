import { Component, ViewChild } from '@angular/core';
import {LineType, LineInfo, MAP_INFO} from '../models/models';
import { toMinutes, totalTime } from '../util';

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
      this.meiqRelatedLineInfos = this.meiqRelatedLineInfos.filter(i => !!i.endTime);
    };
    reader.readAsText(this.file, 'shift-jis');
  }

  get date(): Date {
    if (this.file) {
      const dateRe = this.file.name.match(/TWChatLog_(\d\d\d\d)_(\d\d)_(\d\d).html/);
      if (dateRe) {
        const year = parseInt(dateRe[1], 10);
        const month = parseInt(dateRe[2], 10);
        const day = parseInt(dateRe[3], 10);
        return new Date(year, month - 1, day);
      }
    }
    return undefined;
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
        lineInfo.startTime = this.fetchDate(line);
        return lineInfo;
      });
  }

  private fetchDate(line: string): Date {
    const result = line.match(/\[ *(\d+)時 *(\d+)分 *(\d+)秒 *\]/);
    if (result) {
      const hour = parseInt(result[1], 10);
      const minutes = parseInt(result[2], 10);
      const seconds = parseInt(result[3], 10);
      if (this.date) {
        const date = new Date(this.date.getTime());
        date.setHours(hour);
        date.setMinutes(minutes);
        date.setSeconds(seconds);
        return date;
      }
      return new Date(2020, 5, 9, hour, minutes, seconds);
    }
    return null;
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

}



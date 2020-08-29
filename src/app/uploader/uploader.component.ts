import { Component, ViewChild, OnInit } from '@angular/core';
import {LineType, LineInfo, MAP_INFO} from '../models/models';
import { toMinutes, totalTime, getLogDate, fetchDateFromLine, calcTotal } from '../util';
import { CalendarData } from 'ng-calendar-heatmap';

@Component({
  selector: 'app-uploader',
  templateUrl: './uploader.component.html',
  styleUrls: ['./uploader.component.scss']
})
export class UploaderComponent implements OnInit {

  @ViewChild('fileInput') fileInput: { nativeElement: { click: () => void; files: { [key: string]: File; }; }; };

  file: File | null = null;
  lines: string[];
  meiqRelatedLineInfos: LineInfo[];
  calendarData: CalendarData[] = [];

  private _date: Date;

  ngOnInit(): void {
    this.reloadCalendarData();
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
      this.fetchData();
      this.completeLineInfo();
      this.removeDuplicate();
      this.mergeData();
    };
    reader.readAsText(this.file, 'shift-jis');
  }

  get date(): Date {
    if (this.file) {
      this._date = getLogDate(this.file);
    }
    return this._date;
  }

  set date(date: Date) {
    this._date = date;
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

  public dateSelected(event: Date): void {
    this.loadData(event);
  }

  public clearHistory(): void {
    const res = confirm('履歴が全て削除されます。');
    if (!res) {
      return;
    }
    localStorage.removeItem('mqData');
    this.reloadCalendarData();
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

  private mergeData(): void {
    if (!this.meiqRelatedLineInfos.length) {
      return;
    }
    const mqData = {
      [this.date.toLocaleDateString()]: {
        total: totalTime(this.meiqRelatedLineInfos),
        details: this.meiqRelatedLineInfos
      }
    };
    const currentData = Object.assign({}, JSON.parse(localStorage.getItem('mqData')));
    localStorage.setItem('mqData', JSON.stringify(Object.assign(currentData, mqData)));
    this.reloadCalendarData();
  }

  private loadData(date: Date): void {
    this.meiqRelatedLineInfos = null;
    this.file = null;
    const currentData = Object.assign({}, JSON.parse(localStorage.getItem('mqData')));
    this.date = date;
    if (this.date && currentData[date.toLocaleDateString()]) {
      this.meiqRelatedLineInfos = currentData[date.toLocaleDateString()].details.map(d => {
        const info = new LineInfo();
        info.title = d.title;
        info.type = d.type;
        info.startTime = new Date(d.startTime);
        info.endTime = new Date(d.endTime);
        return info;
      });
    }
  }

  private reloadCalendarData(): void {
    const currentData = JSON.parse(localStorage.getItem('mqData'));
    if (!currentData) {
      this.calendarData = [{
        date: new Date(),
        count: 0
      }];
    } else {
      this.calendarData = Object.keys(currentData).map(k => {
          return {
            date: new Date(k),
            count: Math.floor(currentData[k].total / 5)
          };
        });
    }
  }

}



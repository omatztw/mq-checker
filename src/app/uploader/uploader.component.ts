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
  @ViewChild('fileImport') fileImport: { nativeElement: { click: () => void; files: { [key: string]: File; }; }; };

  file: File | null = null;
  lines: string[];
  meiqRelatedLineInfos: LineInfo[];
  calendarData: CalendarData[] = [];

  private _date: Date;
  private importCount = 0;
  importing = false;

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

  onClickFileImportButton(): void {
    this.fileImport.nativeElement.click();
  }

  onChangeFileImport(): void {
    const files: { [key: string]: File } = this.fileImport.nativeElement.files;
    this.importCount = 0;
    this.importing = true;
    Object.keys(files).forEach(k => {
      const reader = new FileReader();
      reader.onload = e => {
        this.importCount++;
        if (this.importCount === Object.keys(files).length) {
          this.importing = false;
        }
        const lines = this.splitLines(e.target.result.toString());
        const date = getLogDate(files[k]);
        const lineInfos = this.objectLines(lines, date);
        const completeLineInfos = this.filterLineInfo(lineInfos);
        this.removeDuplicateLines(completeLineInfos);
        this.saveLineData(completeLineInfos, date);
        if (!this.importing) {
          this.reloadCalendarData();
        }
      };
      reader.readAsText(files[k], 'shift-jis');
    });
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
     this.meiqRelatedLineInfos = this.objectLines(this.lines, this.date);
  }

  private objectLines(lines: string[], date: Date): LineInfo[] {
    return lines
     .filter(line => MAP_INFO.some(m => line.includes(m.key)))
    .map(line => {
        const match = MAP_INFO.find(m => line.includes(m.key));
        const lineInfo = new LineInfo();
        lineInfo.title = match.value;
        lineInfo.type = match.type;
        lineInfo.startTime = fetchDateFromLine(line, date);
        return lineInfo;
      });
  }

  private completeLineInfo(): void {
    this.meiqRelatedLineInfos = this.filterLineInfo(this.meiqRelatedLineInfos);
  }

  private filterLineInfo(infos: LineInfo[]): LineInfo[] {
    if (!infos.length) {
      return infos;
    }
    infos.reduce((p, c) => {
      if (c.type === LineType.line) {
        p.endTime = c.startTime;
      }
      return c;
    });
    return infos
    .filter(i => !!i.endTime)
    .filter(i => i.type !== LineType.offline);
  }

  private removeDuplicate(): void {
    this.removeDuplicateLines(this.meiqRelatedLineInfos);
  }

  private removeDuplicateLines(infos: LineInfo[]): LineInfo[] {
    infos.reduce((p, c, i, arr) => {
      if (p && p.title === c.title) {
        infos.splice(i - 1, 1);
      }
      return c;
    }, undefined);
    return infos;
  }

  private mergeData(): void {
    this.saveLineData(this.meiqRelatedLineInfos, this.date);
    this.reloadCalendarData();
  }

  private saveLineData(infos: LineInfo[], date: Date): void {
    if (!infos.length) {
      return;
    }
    const mqData = {
      [date.toLocaleDateString()]: {
        total: totalTime(infos),
        details: infos
      }
    };
    const currentData = Object.assign({}, JSON.parse(localStorage.getItem('mqData')));
    localStorage.setItem('mqData', JSON.stringify(Object.assign(currentData, mqData)));
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
          if (!currentData[k].details.some((d: LineInfo) => d.title === 'ルミナス')) {
            // クリアしていなければカウントは無し
            return {
              date: new Date(k),
              count: 0
            };
          }
          return {
            date: new Date(k),
            count: Math.max(1, Math.floor((1860 - currentData[k].total) / 60))
          };
        });
    }
  }

}



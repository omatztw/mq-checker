import { Component, ViewChild, OnInit } from '@angular/core';
import { LineType, LineInfo, MAP_INFO } from '../models/models';
import {
  toMinutes,
  totalTime,
  getLogDate,
  fetchDateFromLine,
  calcTotal,
} from '../util';
import { CalendarData } from 'ng-calendar-heatmap';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-uploader',
  templateUrl: './uploader.component.html',
  styleUrls: ['./uploader.component.scss'],
})
export class UploaderComponent implements OnInit {
  @ViewChild('fileInput') fileInput: {
    nativeElement: { click: () => void; files: { [key: string]: File } };
  };
  @ViewChild('fileImport') fileImport: {
    nativeElement: { click: () => void; files: { [key: string]: File } };
  };

  file: File | null = null;
  lines: string[];
  meiqRelatedLineInfos: LineInfo[];
  meiqInfoList: LineInfo[][] = [];
  calendarData: CalendarData[] = [];
  $importing: Subject<boolean> = new Subject();

  private _date: Date;
  private importCount = 0;
  importing = false;

  ngOnInit(): void {
    this.reloadCalendarData();
    this.$importing.pipe(debounceTime(500)).subscribe(
      (next) => {
        this.reloadCalendarData();
        this.importing = false;
      },
      () => console.log('complete')
    );
  }

  onClickFileInputButton(): void {
    this.fileInput.nativeElement.click();
  }

  onChangeFileInput(): void {
    const files: { [key: string]: File } = this.fileInput.nativeElement.files;
    this.file = files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      this.readLine(e.target.result.toString());
      this.fetchData();
      this.completeLineInfo();
      this.removeDuplicate();
      // this.removeClear();
      this.mergeData();
      this.loadData(this.date);
    };
    reader.readAsText(this.file, 'shift-jis');
  }

  onClickFileImportButton(): void {
    this.fileImport.nativeElement.files = null;
    this.fileImport.nativeElement.click();
  }

  onChangeFileImport(): void {
    const files: { [key: string]: File } = this.fileImport.nativeElement.files;
    this.importCount = 0;

    Object.keys(files).forEach((k) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.importing = true;
        const lines = this.splitLines(e.target.result.toString());
        const date = getLogDate(files[k]);
        const lineInfos = this.objectLines(lines, date);
        let completeLineInfos = this.filterLineInfo(lineInfos);
        this.removeDuplicateLines(completeLineInfos);
        // completeLineInfos = this.removeClearLines(completeLineInfos);
        this.saveLineData(completeLineInfos, date);
        this.$importing.next(true);
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

  public tweetText(meiqInfo: LineInfo[]): string {
    let text = '';
    if (this.date) {
      text += `${this.date.toLocaleDateString()}%0A`;
    }
    if (meiqInfo) {
      meiqInfo.forEach((info) => {
        const duration = toMinutes(info.duration);
        text += `${duration}  ${info.title}%0A`;
      });
      text += `-------------%0A`;
      text += `${toMinutes(totalTime(meiqInfo))}%0A%0A`;
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
      .filter((line) => MAP_INFO.some((m) => line.includes(m.key)))
      .map((line) => {
        const match = MAP_INFO.find((m) => line.includes(m.key));
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
      .filter((i) => i.title === 'クリア' || !!i.endTime)
      .filter((i) => i.type !== LineType.offline);
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

  private removeClear(): void {
    this.meiqRelatedLineInfos = this.removeClearLines(
      this.meiqRelatedLineInfos
    );
  }

  private removeClearLines(infos: LineInfo[]): LineInfo[] {
    return infos.filter((info) => info.title !== 'クリア');
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
        details: infos,
      },
    };
    const currentData = Object.assign(
      {},
      JSON.parse(localStorage.getItem('mqData'))
    );
    localStorage.setItem(
      'mqData',
      JSON.stringify(Object.assign(currentData, mqData))
    );
  }

  private loadData(date: Date): void {
    this.meiqRelatedLineInfos = null;
    this.meiqInfoList = [];
    this.file = null;
    const currentData = Object.assign(
      {},
      JSON.parse(localStorage.getItem('mqData'))
    );
    this.date = date;
    if (this.date && currentData[date.toLocaleDateString()]) {
      this.meiqRelatedLineInfos = currentData[
        date.toLocaleDateString()
      ].details.map((d) => {
        const info = new LineInfo();
        info.title = d.title;
        info.type = d.type;
        info.startTime = new Date(d.startTime);
        info.endTime = new Date(d.endTime);
        return info;
      });
      while (this.meiqRelatedLineInfos.length !== 0) {
        this.meiqInfoList.push(this.toList(this.meiqRelatedLineInfos));
      }
    }
  }

  private toList(infos: LineInfo[]): LineInfo[] {
    let ret: LineInfo[];
    const length = infos.length;
    infos.some((info, index) => {
      if (info.title === 'クリア') {
        ret = infos.splice(0, index + 1);
        ret.pop();
        return true;
      }
      if (index === length - 1) {
        ret = infos.splice(0, index + 1);
        return true;
      }
      if (
        infos.findIndex((v) => v.title === info.title) !== index &&
        info.title !== 'ルミ前哨' &&
        info.title !== 'ルミナス'
      ) {
        ret = infos.splice(0, index);
        return true;
      }
    });
    return ret;
  }

  private reloadCalendarData(): void {
    const currentData = JSON.parse(localStorage.getItem('mqData'));
    if (!currentData) {
      this.calendarData = [
        {
          date: new Date(),
          count: 0,
        },
      ];
    } else {
      this.calendarData = Object.keys(currentData).map((k) => {
        if (
          !currentData[k].details.some((d: LineInfo) => d.title === 'ルミナス')
        ) {
          // クリアしていなければカウントは無し
          return {
            date: new Date(k),
            count: 0,
          };
        }
        const dataList = [];
        const todayData = JSON.parse(JSON.stringify(currentData[k].details));
        while (todayData.length !== 0) {
          dataList.push(this.toList(todayData));
        }
        const fastest = Math.min(
          ...dataList
            .filter((data) => data.some((d) => d.title === 'ルミナス'))
            .map((data) => {
              const lineInfos = data.map((d: LineInfo) => {
                const lineInfo = new LineInfo();
                lineInfo.type = d.type;
                lineInfo.title = d.title;
                lineInfo.startTime = new Date(d.startTime);
                lineInfo.endTime = new Date(d.endTime);
                return lineInfo;
              });
              return totalTime(lineInfos);
            })
        );
        return {
          date: new Date(k),
          count: Math.max(1, Math.floor((1860 - fastest) / 60)),
        };
      });
    }
  }
}

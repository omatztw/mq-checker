import { Component, ViewChild } from '@angular/core';
import {LineType, LineInfo, SDT_MAP_INFO, SdtSummary, SdtScore} from '../models/models';
import { toMinutes, totalTime, getLogDate, fetchDateFromLine, calcTotal, formatDate, splitLines } from '../util/util';

@Component({
  selector: 'app-sdt',
  templateUrl: './sdt.component.html',
  styleUrls: ['./sdt.component.scss']
})
export class SdtComponent {

  @ViewChild('fileInput') fileInput: { nativeElement: { click: () => void; files: { [key: string]: File; }; }; };

  file: File | null = null;
  lines: string[];
  sdtRelatedLineInfos: LineInfo[];
  detailEnabled = false;
  sdtScore: SdtScore;

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
      this.fetchScore();
    };
    reader.readAsText(this.file, 'shift-jis');
  }

  toggleShowDetail(): void {
    this.detailEnabled = !this.detailEnabled;
  }

  downloadCsv(): void {
    const filename = `sdt_${formatDate(this.date, 'YYYYMMDD')}.csv`;
    let data = '';
    this.sdtRelatedLineInfos.map(
      info => data += `${info.startTime.toLocaleTimeString()},${info.title},${info.duration}.${info.score}\n`
    );
    const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
    const blob = new Blob([bom, data], { type: 'text/csv' });
    if (window.navigator.msSaveBlob) { // IE
      window.navigator.msSaveBlob(blob, filename);
    } else { // その他ブラウザ
        // BlobからオブジェクトURLを作成する
        const url = (window.URL || window.webkitURL).createObjectURL(blob);
        // ダウンロード用にリンクを作成する
        const download = document.createElement('a');
        // リンク先に上記で生成したURLを指定する
        download.href = url;
        // download属性にファイル名を指定する
        download.download = filename;
        // 作成したリンクをクリックしてダウンロードを実行する
        download.click();
        // createObjectURLで作成したオブジェクトURLを開放する
        (window.URL || window.webkitURL).revokeObjectURL(url);
    }

  }

  get date(): Date {
    return getLogDate(this.file);
  }

  get summary(): SdtSummary[] {
    const mapList = SDT_MAP_INFO.filter(i => i.type === LineType.line).map(i => i.value);
    if (!this.sdtRelatedLineInfos || !this.sdtRelatedLineInfos.length) {
      return null;
    }
    return mapList.map(m => {
      const currentMapInfo = this.sdtRelatedLineInfos.filter(i => i.title === m);
      const summary = new SdtSummary();
      summary.title = m;
      summary.count = currentMapInfo.length;
      if (summary.count) {
        summary.min = Math.min(...currentMapInfo.map(cinfo => cinfo.duration));
        summary.max = Math.max(...currentMapInfo.map(cinfo => cinfo.duration));
        summary.subScore = currentMapInfo.reduce((p, c) => p + c.score, 0);
        summary.ave = parseFloat((totalTime(currentMapInfo) / currentMapInfo.length).toFixed(2));
      }
      return summary;
    });
  }

  get tweetText(): string {
    let text = '';
    if (this.date) {
      text += `${this.date.toLocaleDateString()} `;
    }
    if (this.sdtScore && this.summary) {
      const total = calcTotal(this.summary.map(s => s.count));
      text += `クラブ [${this.sdtScore.clubName}]の争奪戦記録%0A`;
      text += `${total}MAP ${this.sdtScore.score}Mで${this.sdtScore.region}地域 ${this.sdtScore.rank}位でした！%0A%0A`;
    }

    text += `%23争奪チェッカー ${window.location.href}`;
    return text;
  }

  private readLine(str: string): void {
    const lines = splitLines(str);
    this.lines = lines;
  }

  private fetchScore(): void {
    this.sdtScore = null;
    const scoreLine = this.lines.find(line => line.includes('位として記録されました。'));
    if (scoreLine) {
      this.sdtScore = new SdtScore();
      const scoreRe = scoreLine.match(/"#ff64ff">(.+)クラブの記録は(\d+)M で(.+)地域 (\d+)位として記録されました。/);
      this.sdtScore.clubName = scoreRe[1];
      this.sdtScore.score = parseInt(scoreRe[2], 10);
      this.sdtScore.region = scoreRe[3];
      this.sdtScore.rank = parseInt(scoreRe[4], 10);
    }
  }

  private fetchData(): void {
     this.sdtRelatedLineInfos = this.lines
     .filter(line => SDT_MAP_INFO.some(m => line.includes(m.key)))
    .map(line => {
        const match = SDT_MAP_INFO.find(m => line.includes(m.key));
        const lineInfo = new LineInfo();
        lineInfo.title = match.value;
        lineInfo.type = match.type;
        if(match.score) {
          lineInfo.score = match.score;
        }
        lineInfo.startTime = fetchDateFromLine(line, this.date);
        return lineInfo;
      });
  }

  private completeLineInfo(): void {
    this.sdtRelatedLineInfos.reduce((p, c) => {
      if (c.type === LineType.line) {
        p.endTime = c.startTime;
      }
      return c;
    });
    this.sdtRelatedLineInfos = this.sdtRelatedLineInfos
                                .filter(i => !!i.endTime)
                                .filter(i => i.type !== LineType.offline);
  }

}



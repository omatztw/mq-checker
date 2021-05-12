import { Component, OnInit, Input } from '@angular/core';
import { calcClearBonus, calcTotal, totalTime } from '../util/util';
import { LineInfo } from '../models/models';

@Component({
  selector: 'app-sdt-table',
  templateUrl: './sdt-table.component.html',
  styleUrls: ['./sdt-table.component.scss']
})
export class SdtTableComponent implements OnInit {

  @Input() sdtRelatedLineInfos: LineInfo[];
  displayedColumns = ['startTime', 'title', 'duration', 'score', 'bonus'];

  calcClearBonus = calcClearBonus;

  constructor() { }

  ngOnInit(): void {
  }

  getTotal(): number {
    return totalTime(this.sdtRelatedLineInfos);
  }

  getTotalScore(): number {
    return calcTotal(this.sdtRelatedLineInfos.map(s => s.score));
  }

  getTotalBonus(): number {
    return  calcTotal(this.sdtRelatedLineInfos.map(s => calcClearBonus(s.duration)));

  }

}

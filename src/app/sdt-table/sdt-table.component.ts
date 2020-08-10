import { Component, OnInit, Input } from '@angular/core';
import { totalTime } from '../util';
import { LineInfo } from '../models/models';

@Component({
  selector: 'app-sdt-table',
  templateUrl: './sdt-table.component.html',
  styleUrls: ['./sdt-table.component.scss']
})
export class SdtTableComponent implements OnInit {

  @Input() sdtRelatedLineInfos: LineInfo[];
  displayedColumns = ['startTime', 'title', 'duration'];

  constructor() { }

  ngOnInit(): void {
  }

  getTotal(): number {
    return totalTime(this.sdtRelatedLineInfos);
  }

}

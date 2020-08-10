import { Component, OnInit, Input } from '@angular/core';
import { LineInfo, SdtSummary } from '../models/models';
import { totalTime, calcTotal } from '../util';

@Component({
  selector: 'app-std-summary-table',
  templateUrl: './std-summary-table.component.html',
  styleUrls: ['./std-summary-table.component.scss']
})
export class StdSummaryTableComponent implements OnInit {

  @Input() sdtSummary: SdtSummary[];
  displayedColumns = ['title', 'count', 'min', 'max', 'ave'];

  constructor() { }

  ngOnInit(): void {
  }

  get totalCount(): number {
    if (this.sdtSummary) {
      return calcTotal(this.sdtSummary.map(s => s.count));
    }
    return 0;
  }

}

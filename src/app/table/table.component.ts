import { Component, OnInit, Input } from '@angular/core';
import { totalTime } from '../util/util';

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss']
})
export class TableComponent implements OnInit {

  @Input() meiqRelatedLineInfos;
  displayedColumns = ['title', 'duration'];

  constructor() { }

  ngOnInit(): void {
  }

  getTotal(): number {
    return totalTime(this.meiqRelatedLineInfos);
  }

}

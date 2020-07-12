import { Component, OnInit, Input } from '@angular/core';

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
    if(this.meiqRelatedLineInfos) {
      return this.meiqRelatedLineInfos.reduce((p, c) => {
        return p + c.duration;
      }, 0);
    }
    return 0;
  }

}

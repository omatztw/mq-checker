import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CalendarData, CalendarOptions, CalendarWeekStart } from 'ng-calendar-heatmap';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss']
})
export class CalendarComponent implements OnInit {

  @Input() calendarData: CalendarData[] = [];
  @Output() dateSelected = new EventEmitter();
  public calendarOptions: CalendarOptions;

  constructor() { }

  ngOnInit(): void {
    this.calendarOptions = {
      responsive: false,
      onClick: this.selected.bind(this),
      colorRange: ['#D8E6E7', '#218380'],
      tooltipEnabled: false,
      legendEnabled: true,
      max: 360,
      locale: {
        months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
        days: ['日', '月', '火', '水', '木', '金', '土'],
        no: 'No',
        on: 'on',
        less: '早',
        more: '遅'
    }
    };
  }

  selected(data: CalendarData): void {
    this.dateSelected.emit(data.date);
  }

}

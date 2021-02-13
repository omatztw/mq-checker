import { Component, OnDestroy, OnInit } from '@angular/core';
import { interval } from 'rxjs';
import { Charactor } from '../models/char';
import { isNativeFileSystemSupported } from '../util/util';

@Component({
  selector: 'app-login-history',
  templateUrl: './login-history.component.html',
  styleUrls: ['./login-history.component.scss']
})
export class LoginHistoryComponent implements OnInit, OnDestroy {

  history: Charactor[] = [];
  timer: number;
  supported = isNativeFileSystemSupported();
  displayedColumns = ['date', 'time', 'server', 'name'];


  constructor() { }

  ngOnInit(): void {
    this.history = JSON.parse(sessionStorage.getItem('loginHistory'), this.reviver) || [];
  }

  ngOnDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }

  }

  async onClick(e: any): Promise<void> {
    const dirHandle = await (window as any).showDirectoryPicker();
    this.timer = setInterval(async () => {
        const files = [];
        for await (const entry of dirHandle.values()) {
            if (entry.name.includes('profile')) {
                files.push(await entry.getFile());
            }
        }
        files.sort((a, b) => b.lastModified - a.lastModified);
        const char = this.parseChar(files[0].name, files[0].lastModified);
        if (this.history.length === 0 || (this.history[0].server !== char.server || this.history[0].name !== char.name)) {
          this.history = [char, ...this.history];
          sessionStorage.setItem('loginHistory', JSON.stringify(this.history));
        }
    }, 1000);
  }

  private parseChar(fileName: string, fileLastModified: number): Charactor {
   const regex = fileName.match(/(.+)_(.+).profile/);
   const server = regex[1];
   const name = regex[2];
   const time = new Date(fileLastModified);
   return {
     server, name, time
   };
  }

  private reviver(key: string, val: any): any{
      if (typeof(val) === 'string' &&
          val.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)){
          return new Date(Date.parse(val));
      }
      return val;
  }

}

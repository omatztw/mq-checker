import { Content } from '@angular/compiler/src/render3/r3_ast';
import { Component, OnInit } from '@angular/core';
import { Task, WeekTask } from '../models/models';
import {
  getLogDate,
  isNativeFileSystemSupported,
  parseLine,
  splitLines,
} from '../util/util';

@Component({
  selector: 'app-weeklytask',
  templateUrl: './weeklytask.component.html',
  styleUrls: ['./weeklytask.component.scss'],
})
export class WeeklytaskComponent implements OnInit {
  supported = isNativeFileSystemSupported();
  dirHandle: any;
  timer: number;
  calculating: boolean;
  weekTasks = {
    1: new WeekTask(this.generateCrownTask()),
    2: new WeekTask(this.generateCrownTask()),
    3: new WeekTask(this.generateCrownTask()),
    4: new WeekTask(this.generateCrownTask()),
    5: new WeekTask(this.generateCrownTask()),
    6: new WeekTask(this.generateCrownTask()),
    7: new WeekTask(this.generateCrownTask()),
  };

  get taskDisplay() {
    const tasks: { [key: string]: number }[] = [];
    return Object.keys(this.weekTasks).map((k) => {
      return this.weekTasks[k];
    });
  }

  get headerInfo() {
    const tasks = Object.keys(this.weekTasks).map((k) => {
      return this.weekTasks[k];
    });
    const one = tasks
      .filter((t) => !!t.tasks)
      .find((t) => t.tasks.length !== 0);
    if (!one) {
      return [];
    }
    return one.tasks.map((t) => t.title);
  }

  constructor() {}

  ngOnInit(): void {}

  async currentTaskScan() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    for await (const entry of this.dirHandle.values()) {
      if (entry.kind === 'directory' && entry.name === 'ChatLog') {
        for await (const chatLog of entry.values()) {
          const cDate = getLogDate(await chatLog.getFile());
          if (!cDate) {
            continue;
          }
          let day = now.getDay() === 0 ? 7 : now.getDay();
          if (day === 1 && this.weekTasks[7].date) {
            this.reset();
          }
          for (let i = 1; i <= day; i++) {
            const currentDay = new Date(today.getTime());
            currentDay.setDate(today.getDate() - (day - i));
            if (cDate.getTime() === currentDay.getTime()) {
              const weekTask = this.weekTasks[i];
              weekTask.date = new Date(currentDay.getTime());
              const file: File = await chatLog.getFile();
              const fileSize = file.size;

              const blob: Blob = file;
              let text: ArrayBuffer;

              try {
                text = await blob.arrayBuffer();
              } catch (err) {
                // 読み込みできなかった場合は次のターンに回す
                console.error(err);
                continue;
              }
              const td = new TextDecoder('Shift_JIS');
              const shiftJisText = td.decode(text);
              this.loadTask(shiftJisText, i, currentDay);
            }
          }
        }
      }
    }
  }

  async onClick(e: any): Promise<void> {
    this.dirHandle = await (window as any).showDirectoryPicker();
    this.currentTaskScan();
    this.timer = setInterval(async () => {
      for await (const entry of this.dirHandle.values()) {
        if (entry.kind === 'directory' && entry.name === 'ChatLog') {
          for await (const chatLog of entry.values()) {
            const cDate = getLogDate(await chatLog.getFile());
            if (!cDate) {
              continue;
            }
            const now = new Date();
            const today = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate()
            );
            if (cDate.getTime() === today.getTime()) {
              const weekTask = this.weekTasks[today.getDay()];
              weekTask.date = new Date(today.getTime());
              const file: File = await chatLog.getFile();

              const blob: Blob = file;
              let text: ArrayBuffer;

              try {
                text = await blob.arrayBuffer();
              } catch (err) {
                // 読み込みできなかった場合は次のターンに回す
                console.error(err);
                continue;
              }
              const td = new TextDecoder('Shift_JIS');
              const shiftJisText = td.decode(text);
              this.loadTask(shiftJisText, today.getDay(), today);
              // this.reader.readAsText(blob, 'shift-jis');
            }
          }
        }
      }
    }, 3000);
  }

  reset() {
    this.weekTasks = {
      1: new WeekTask(this.generateCrownTask()),
      2: new WeekTask(this.generateCrownTask()),
      3: new WeekTask(this.generateCrownTask()),
      4: new WeekTask(this.generateCrownTask()),
      5: new WeekTask(this.generateCrownTask()),
      6: new WeekTask(this.generateCrownTask()),
      7: new WeekTask(this.generateCrownTask()),
    };
  }

  loadTask(text: string, day: number, date: Date) {
    const lines = splitLines(text);
    const parsedLines = lines.map((l) => parseLine(l, date)).filter((l) => !!l);
    this.weekTasks[day].tasks
      .filter((t) => !!t.content)
      .forEach((task: Task) => {
        task.details = parsedLines
          .filter((l) => {
            const regexp = new RegExp(task.content);
            return regexp.test(l.message);
          })
          .map((l) => {
            return {
              time: l.time,
              message: l.message,
            };
          });
        if (task.imperialWord) {
          const imperialTimes = parsedLines
            .filter((l) => {
              const regexp = new RegExp('ｲﾝﾍﾟﾘｱﾙｸﾗｳﾝｼｰｽﾞﾝﾁｹｯﾄを使用しました。');
              return regexp.test(l.message);
            })
            .map((l) => l.time);
          const imperialTimeWords = imperialTimes.map((t) => {
            return parsedLines.filter((l) => l.time.getTime() === t.getTime());
          });
          const detail = imperialTimeWords
            .filter((ls) => {
              return ls.some((l) => {
                const regexp = new RegExp(task.imperialWord);
                return regexp.test(l.message);
              });
            })
            .filter((ls) => {
              return ls.every((l) => {
                const regexp = new RegExp(task.imperialExclude);
                return !regexp.test(l.message);
              });
            })
            .map((ls) => {
              return {
                time: ls[0].time,
                message: ls[0].message,
              };
            });
          task.details.push(...detail);
        }
      });
  }

  generateCrownTask(): Task[] {
    return [
      new Task('プラバ防衛戦', 'プラバ防衛戦に成功しました'),
      new Task(
        '力の根源',
        'スルトの力の根源ミッションクリア報酬として経験値を獲得しました'
      ),
      new Task('忘却の地下墓所', '\\[地下墓所の勲章\\] を 3個獲得しました'),
      new Task(
        'マーキュリアル洞窟',
        '本日 \\[(セレアナ|セリオン|シルバン|シライロン)\\] ボスの討伐に成功しました。\\(討伐報酬はボスごとに1日1回獲得可能\\)',
        '\\[ビスムト\\] を 1個獲得しました。',
        '本日 \\[ルミナス\\] ボスの討伐に成功しました'
      ),
      new Task(
        'ルミナス',
        '本日 \\[ルミナス\\] ボスの討伐に成功しました。\\(討伐報酬はボスごとに1日1回獲得可能\\)'
      ),
      new Task('プシーキーの迷宮', 'プシーキーの迷宮を全て通過しました'),
      new Task(
        '神鳥の塒(ハード)',
        '今週は神鳥報酬を\\d回獲得しています。報酬は週7回まで獲得できます。'
      ),
      new Task(
        'アビス・深層(ヘル)',
        '\\[アークロン勲章\\] を 15個獲得しました'
      ),
      new Task(
        '地下要塞の次元の隙間',
        '次元の隙間の封印報酬として\\[ アークロン要塞の宝箱 \\]を獲得しました'
      ),
      new Task('補給品奪還', '補給品奪還の成功報酬として、経験の聖水1個'),
      new Task(
        'オルリー防衛戦（ヘル）',
        'オルリー防衛戦ヘル難易度のクリア報酬として10,000,000 SEEDを獲得しました'
      ),
      new Task(
        'ヴェスティージ',
        '\\[アングリービックテディの残留思念\\] アイテムを獲得しました'
      ),
      new Task(
        'エクリプス（ロカゴス）',
        '\\[ロカゴスの持ち物袋\\]を1個獲得しました'
      ),
      new Task(
        'エクリプス（エートス）',
        '\\[エートスの持ち物袋\\]を1個獲得しました'
      ),
      new Task(
        'エクリプス（チェリア）',
        '\\[チェリアの持ち物袋\\]を1個獲得しました'
      ),
      new Task(
        'エクリプス（マティア）',
        '\\[マティアの持ち物袋\\]を1個獲得しました'
      ),
      new Task(
        'エクリプス（ライコス）',
        '\\[ライコスの持ち物袋\\]を1個獲得しました'
      ),
      new Task(
        'エクリプス（ティロロス）',
        '\\[ティロロスボスの持ち物袋\\]を1個獲得しました'
      ),
      new Task(
        'アフェテリア（セリニアコス）',
        '\\[セリニアコスの持ち物袋\\]を1個獲得しました'
      ),
      new Task(
        'アフェテリア（ゴイティア）',
        '\\[ゴイティアの持ち物袋\\]を1個獲得しました'
      ),
      new Task(
        'アフェテリア（キシニク）',
        '\\[キシニクの持ち物袋\\]を1個獲得しました'
      ),
      new Task(
        'シオカンヘイム（ボス）',
        'シオカンヘイム - ボス討伐戦のクリア回数'
      ),
      new Task(
        'シオカンヘイム（オーディン）',
        'シオカンヘイム - オーディン全面戦のクリア回数'
      ),
    ];
  }
}

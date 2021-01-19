import { stringify } from '@angular/compiler/src/util';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-core',
  templateUrl: './core.component.html',
  styleUrls: ['./core.component.scss'],
})
export class CoreComponent implements OnInit {
  constructor() {}

  math = Math;

  fg: FormGroup;
  needMaterial: Material = {
    powder: 0,
    crystal: 0,
  };
  start: number;
  goal: number;
  numCore: number;
  calclating: boolean = false;
  targetProbability: number = 0.84;
  calclating$ = new Subject<boolean>();

  probabilityList = [10, 20, 30, 40, 50, 60, 70, 80, 90];

  phaseList = [
    {
      name: '進化0',
      list: [
        { name: '進化0 強化0 (+1)', value: 0 },
        { name: '進化0 強化1 (+2)', value: 1 },
        { name: '進化0 強化2 (+3)', value: 2 },
        { name: '進化0 強化3 (+4)', value: 3 },
        { name: '進化0 強化4 (+5)', value: 4 },
      ],
    },
    {
      name: '進化1',
      list: [
        { name: '進化1 強化0 (+6)', value: 5 },
        { name: '進化1 強化1 (+7)', value: 6 },
        { name: '進化1 強化2 (+8)', value: 7 },
        { name: '進化1 強化3 (+9)', value: 8 },
        { name: '進化1 強化4 (+10)', value: 9 },
      ],
    },
    {
      name: '進化2',
      list: [
        { name: '進化2 強化0 (+12)', value: 10 },
        { name: '進化2 強化1 (+14)', value: 11 },
        { name: '進化2 強化2 (+16)', value: 12 },
        { name: '進化2 強化3 (+18)', value: 13 },
        { name: '進化2 強化4 (+20)', value: 14 },
      ],
    },
    {
      name: '進化3',
      list: [
        { name: '進化3 強化0 (+23)', value: 15 },
        { name: '進化3 強化1 (+26)', value: 16 },
        { name: '進化3 強化2 (+29)', value: 17 },
        { name: '進化3 強化3 (+32)', value: 18 },
        { name: '進化3 強化4 (+35)', value: 19 },
      ],
    },
    {
      name: '進化4',
      list: [
        { name: '進化4 強化0 (+40)', value: 20 },
        { name: '進化4 強化1 (+45)', value: 21 },
        { name: '進化4 強化2 (+50)', value: 22 },
        { name: '進化4 強化3 (+55)', value: 23 },
        { name: '進化4 強化4 (+60)', value: 24 },
      ],
    },
  ];

  get goalPhaseList(): any[] {
    return this.phaseList.map((l) => {
      return {
        name: l.name,
        list: l.list,
      };
    });
  }

  probability = [
    1.0, // 0. 0-0
    1.0, // 1. 0-1
    0.7, // 2. 0-2
    0.5, // 3. 0-3
    0.2, // 4. 0-4
    0.1, // 5. 1-0
    0.07, // 6. 1-1
    0.07, // 7. 1-2
    0.07, // 8. 1-3
    0.07, // 9. 1-4
    0.05, // 10. 2-0
    0.05, // 11. 2-1
    0.05, // 12. 2-2
    0.05, // 13. 2-3
    0.05, // 14. 2-4
    0.02, // 15. 3-0
    0.02, // 16. 3-1
    0.02, // 17. 3-2
    0.02, // 18. 3-3
    0.02, // 19. 3-4
    0.01, // 20. 4-0
    0.01, // 21. 4-1
    0.01, // 22. 4-2
    0.01, // 23. 4-3
    0.01, // 24. 4-4
  ];

  powder = [
    0,
    10,
    20,
    30,
    40,
    50,
    60,
    70,
    80,
    90,
    100,
    110,
    120,
    130,
    140,
    200,
    210,
    220,
    230,
    240,
    250,
    260,
    270,
    290,
    290,
  ];

  crystal = [
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
  ];

  ngOnInit(): void {
    // this.calclating$.subscribe((b) => (this.calclating = b));
  }

  onCalc(): void {
    this.calclating = true;
    this.needMaterial = {
      powder: 0,
      crystal: 0,
    };
    setTimeout(() => {
      const n = 1000000;
      const stepResult: Material[] = [];
      for (let i = 0; i < n; i++) {
        const result = this.execute(this.start, this.goal, this.numCore);
        stepResult.push(result);
      }
      const stepSumPowder = stepResult.map((d) => d.powder);
      const stepSumCrystal = stepResult.map((d) => d.crystal);
      const powderAve = this.average(stepSumPowder);
      const powderSigma = this.sigma(stepSumPowder);

      const crystalAve = this.average(stepSumCrystal);
      const crystalSigma = this.sigma(stepSumCrystal);

      this.calclating = false;
      this.needMaterial = {
        powder: powderAve + this.targetProbability * powderSigma,
        crystal: crystalAve + this.targetProbability * crystalSigma,
      };
    }, 100);
  }

  execute(start: number, goal: number, numCore: number): Material {
    let powderSum = 0;
    let crystalSum = 0;
    this.calclating = true;
    for (let coreIndex = 0; coreIndex < numCore; coreIndex++) {
      for (let step = start; step < goal; step++) {
        do {
          powderSum += this.powder[step + 1];
          crystalSum += this.crystal[step + 1];
        } while (Math.random() > this.probability[step + 1]);
      }
    }
    this.calclating = false;
    return {
      powder: powderSum,
      crystal: crystalSum,
    };
  }

  average(data: number[]) {
    return data.reduce((previous, current) => previous + current) / data.length;
  }

  sigma(data: number[]): number {
    const average = this.average(data);
    return Math.sqrt(
      data
        .map((current) => {
          let difference = current - average;
          return difference ** 2;
        })
        .reduce((previous, current) => previous + current) / data.length
    );
  }
}

export interface Material {
  powder: number;
  crystal: number;
}

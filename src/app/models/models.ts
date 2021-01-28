export class LineInfo {
  title: string;
  type: LineType;
  startTime: Date;
  endTime: Date;

  get duration(): number {
    if (this.endTime) {
      return (this.endTime.getTime() - this.startTime.getTime()) / 1000;
    }
    return 0;
  }
}

export class SdtSummary {
  title: string;
  count: number;
  min: number;
  max: number;
  ave: number;
}

export class SdtScore {
  clubName: string;
  score: number;
  region: string;
  rank: number;
}

export enum LineType {
  line,
  clear,
  offline,
}

export const MAP_INFO = [
  {
    key: 'プシーキーに捕まらずにマップの果てまで移動してください。',
    value: '走り抜け',
    type: LineType.line,
  },
  {
    key: '混沌に陥ったモンスター2体を退治してください。',
    value: '混沌',
    type: LineType.line,
  },
  {
    key: 'プシーキーたちを退治し、最後の闇のヒュドラを退治してください。',
    value: '闇のヒュドラ',
    type: LineType.line,
  },
  {
    key: '碑石に書かれた謎に合ったカードを順番通りに置いてください。',
    value: '謎解き',
    type: LineType.line,
  },
  {
    key: '闇の屑と同じ色のモンスターを退治してください。',
    value: '同色退治',
    type: LineType.line,
  },
  {
    key: 'プシーキーから獲得したカードを正しいルーン紋様に置いてください。',
    value: 'カード',
    type: LineType.line,
  },
  {
    key: '魔力の障壁を除去してから自然の結晶を破壊してください。',
    value: '結晶',
    type: LineType.line,
  },
  {
    key: '全てのプシーキーを退治してください。',
    value: '全滅',
    type: LineType.line,
  },
  {
    key: 'プシーキーたちの間に隠れている闇の屑を退治してください。',
    value: '闇の屑',
    type: LineType.line,
  },
  {
    key: 'プシーキーを退治して、ルミナスのところに行く道を見つけてください。',
    value: 'ルミ前哨',
    type: LineType.line,
  },
  {
    key: 'シルバンを退治してください。',
    value: 'シルバン',
    type: LineType.line,
  },
  {
    key: 'シライロンを退治してください。',
    value: 'シライロン',
    type: LineType.line,
  },
  {
    key: 'セレアナを退治してください。',
    value: 'セレアナ',
    type: LineType.line,
  },
  {
    key: 'セリオンを退治してください。',
    value: 'セリオン',
    type: LineType.line,
  },
  {
    key: 'ルミナスを退治してください。',
    value: 'ルミナス',
    type: LineType.line,
  },
  {
    key: 'プシーキーの迷宮を全て通過しました！',
    value: 'クリア',
    type: LineType.line,
  },
  {
    key: '全スキルの中ディレイが',
    value: 'オフライン',
    type: LineType.offline,
  },
];

export const SDT_MAP_INFO = [
  {
    key: 'マップの奥にいるボスモンスターを退治してください。',
    value: 'ボス',
    type: LineType.line,
  },
  {
    key: 'になるように数字カードを見つけて中央の装置に投入して下さい。',
    value: 'スロット',
    type: LineType.line,
  },
  {
    key: '一人が複数のレバーを引いてもカウントされます',
    value: 'レバー',
    type: LineType.line,
  },
  {
    key: 'マップ中央のボタンの上に乗せてください。',
    value: '謎の破片',
    type: LineType.line,
  },
  {
    key: '無造作に爆発する地点を避けて中央部にある目的地に到達してください',
    value: '迷路',
    type: LineType.line,
  },
  {
    key: 'マップ中央の碑石の上に乗ってください。',
    value: '碑石',
    type: LineType.line,
  },
  {
    key: '自分に付与された数字と一致する出口を見つけてください。',
    value: '4ヶ所出口',
    type: LineType.line,
  },
  {
    key: '新しい脱出装置が生成されました。脱出装置は一定時間が経つと消えます。',
    value: '脱出装置',
    type: LineType.line,
  },
  { key: '変異したトゲリーナ探し', value: 'トゲリーナ', type: LineType.line },
  {
    key: 'メンバー全員が各部屋の中央に乗ってください。',
    value: '3方向',
    type: LineType.line,
  },
  {
    key: '散らばっている3匹のボスを見つけて全て退治してください。',
    value: '3ボス',
    type: LineType.line,
  },
  {
    key: '見えない幽霊を避けて左下にある目的地に到達してください。',
    value: '幽霊',
    type: LineType.line,
  },
  { key: '[古代ベレシス]の攻撃から', value: 'ベレシス', type: LineType.line },
  { key: 'クラブの記録は', value: 'クリア', type: LineType.clear },
  {
    key: '全スキルの中ディレイが',
    value: 'オフライン',
    type: LineType.offline,
  },
];

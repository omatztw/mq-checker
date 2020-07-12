export class LineInfo {
  title: string;
  type: LineType;
  startTime: Date;
  endTime: Date;

  get duration(): number {
    return (this.endTime.getTime() - this.startTime.getTime())/1000;
  }
}

export enum LineType {
  line,
  clear,
  offline
}

export const MAP_INFO = [
  {key: 'プシーキーに捕まらずにマップの果てまで移動してください。', value: '走り抜け', type: LineType.line },
  {key: 'プシーキーから獲得したカードを正しいルーン紋様に置いてください。', value: 'カード', type: LineType.line },
  {key: '魔力の障壁を除去してから自然の結晶を破壊してください。', value: '結晶', type: LineType.line },
  {key: '全てのプシーキーを退治してください。', value: '全滅', type: LineType.line },
  {key: 'プシーキーたちの間に隠れている闇の屑を退治してください。', value: '闇の屑', type: LineType.line },
  {key: 'プシーキーを退治して、ルミナスのところに行く道を見つけてください。', value: 'ルミ前哨', type: LineType.line },
  {key: 'シルバンを退治してください。', value: 'シルバン', type: LineType.line },
  {key: 'シライロンを退治してください。', value:  'シライロン', type: LineType.line },
  {key: 'セレアナを退治してください。', value: 'セレアナ', type: LineType.line },
  {key: 'セリオンを退治してください。', value: 'セリオン', type: LineType.line },
  {key: 'ルミナスを退治してください。', value: 'ルミナス', type: LineType.line },
  {key: 'プシーキーの迷宮を全て通過しました！', value: 'クリア', type: LineType.line },
  {key: '全スキルの中ディレイが', value: 'オフライン', type: LineType.offline }
];
import { LineInfo } from './models/models';

export const toMinutes = (second: number): string => {
    const minutes = Math.floor(second / 60);
    const seconds = second % 60;
    return `${('00' + minutes).slice(-2)}:${('00' + seconds).slice(-2)}`;
  };

export const totalTime = (infos: LineInfo[]): number => {
  if (infos) {
    return infos.reduce((p, c) => {
      return p + c.duration;
    }, 0);
  }
  return 0;
};

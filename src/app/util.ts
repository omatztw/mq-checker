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

export const calcTotal = (numbers: number[]): number => {
  if (numbers) {
    return numbers.reduce((p, c) => {
      return p + c;
    }, 0);
  }
  return 0;
};

export const getLogDate = (file: File): Date => {
  if (file) {
    const dateRe = file.name.match(/TWChatLog_(\d\d\d\d)_(\d\d)_(\d\d).html/);
    if (dateRe) {
      const year = parseInt(dateRe[1], 10);
      const month = parseInt(dateRe[2], 10);
      const day = parseInt(dateRe[3], 10);
      return new Date(year, month - 1, day);
    }
  }
  return undefined;
};

export const fetchDateFromLine = (line: string, date: Date): Date => {
  const result = line.match(/\[ *(\d+)時 *(\d+)分 *(\d+)秒 *\]/);
  if (result) {
    const hour = parseInt(result[1], 10);
    const minutes = parseInt(result[2], 10);
    const seconds = parseInt(result[3], 10);
    if (date) {
      const datetime = new Date(date.getTime());
      datetime.setHours(hour);
      datetime.setMinutes(minutes);
      datetime.setSeconds(seconds);
      return datetime;
    }
    return new Date(2020, 5, 9, hour, minutes, seconds);
  }
  return null;
};

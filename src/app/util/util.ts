export const fetchDate = (file: File): Date => {
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

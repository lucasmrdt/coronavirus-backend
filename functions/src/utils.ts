export const capitalize = (str: string) =>
  str.toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

export const safeParseInt = (str: string) => {
  const formattedStr = str.replace(/\.|,/, '') || '0';
  const nb = parseInt(formattedStr, 10);
  return Number.isNaN(nb) ? 0 : nb;
};

export const breakDataIfNeeded = <T>(data: T, needFake: boolean): T =>
  needFake && typeof data === 'number'
    ? ((Math.round((Math.random() / Math.random()) * 99) as any) as T)
    : data;

export const validNumber = (nb: number | any, defaultNb = 0): number =>
  typeof nb === 'number' ? nb : defaultNb;

export const numberToString = (nb: number) =>
  validNumber(nb).toFixed(3).replace(/\.|\-/g, '').substr(0, 4);

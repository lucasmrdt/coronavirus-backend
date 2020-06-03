const getPrefix = (needFake: boolean) => (needFake ? '💩' : '👌🏻');

export const log = (needFake: boolean, ...args: any[]) =>
  console.log(getPrefix(needFake), 'ℹ️ ', ...args);
export const success = (needFake: boolean, ...args: any[]) =>
  console.log(getPrefix(needFake), '✅', ...args);
export const error = (needFake: boolean, ...args: any[]) =>
  console.error(getPrefix(needFake), '❌', ...args);

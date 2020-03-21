export const mapToObject = <T>(map: Map<string, T>) => {
  const object: {[key: string]: T} = {};
  map.forEach((value, key) => (object[key] = value));
  return object;
};

export const capitalize = (str: string) =>
  str.toLowerCase().replace(/^\w/, c => c.toUpperCase());

export const safeParseInt = (str: string) => {
  const formattedStr = str.replace(/\.|,/, '') || '0';
  const nb = parseInt(formattedStr, 10);
  return Number.isNaN(nb) ? str : nb;
};

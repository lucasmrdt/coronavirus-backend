import * as Fuse from 'fuse.js';
import {FLAGS, FLAG_REPLACE_REG} from './country.constants';
import {Country, SimpleCountry} from './country.type';

const FUZE_FLAG_OPTION = {
  shouldSort: true,
  includeScore: true,
  threshold: 0.6,
  location: 0,
  distance: 100,
  maxPatternLength: 32,
  minMatchCharLength: 1,
  keys: ['name'],
};

const FUZE_COUNTRY_OPTION = {
  shouldSort: true,
  includeScore: true,
  threshold: 0.6,
  location: 0,
  distance: 100,
  maxPatternLength: 32,
  minMatchCharLength: 1,
  keys: ['name', 'subname'],
};

const FUZE_FLAG = new Fuse(FLAGS, FUZE_FLAG_OPTION);

export const getFlagNameForCountry = (countryName: string | null) => {
  if (!countryName) {
    return null;
  }
  const formattedCountry = countryName.replace(FLAG_REPLACE_REG, '');
  const [flag] = FUZE_FLAG.search(formattedCountry);
  if (!flag) {
    return null;
  }
  const {item, score} = flag as any;
  return score < 0.4 ? item.value : null;
};

export const hasChanged = (a: SimpleCountry, b: SimpleCountry) =>
  a.nbConfirmed !== b.nbConfirmed ||
  a.nbDeaths !== b.nbDeaths ||
  a.nbRecovered !== b.nbRecovered;

export const mergeDataSources = (
  argis: Country[],
  worldometers: SimpleCountry[],
) => {
  const FUZE_COUNTRY = new Fuse(worldometers, FUZE_COUNTRY_OPTION);
  const getKey = (country: SimpleCountry) =>
    `${country.nbConfirmed}-${country.nbDeaths}-${country.nbRecovered}`;

  return argis.map(argisCountry => {
    if (argisCountry.subName && argisCountry.name !== argisCountry.subName) {
      return argisCountry;
    }

    const [worldometersCountry] = FUZE_COUNTRY.search(
      `${argisCountry.name} ${argisCountry.subName}`,
    );
    if (!worldometersCountry) {
      return argisCountry;
    }
    const {item} = worldometersCountry as any;
    console.log({world: item, argis: argisCountry});
    return {
      ...argisCountry,
      nbConfirmed: item.nbConfirmed,
      nbDeaths: item.nbDeaths,
      nbRecovered: item.nbRecovered,
      apiLastUpdate: Date.now(),
    };
  });
};

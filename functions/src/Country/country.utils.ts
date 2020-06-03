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
  location: 0,
  distance: 100,
  maxPatternLength: 32,
  minMatchCharLength: 1,
  keys: ['name', 'historyName'],
};

const FUZE_ABBREVIATION_OPTION = {
  ...FUZE_COUNTRY_OPTION,
  threshold: 0,
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
  a.nbActives !== b.nbActives ||
  a.nbDeaths !== b.nbDeaths ||
  a.nbRecovered !== b.nbRecovered;

export const mergeDataSources = (
  argis: Country[],
  worldometers: SimpleCountry[],
) => {
  const FUZE_COUNTRY = new Fuse(worldometers, FUZE_COUNTRY_OPTION);
  const FUZE_ABBREVIATION = new Fuse(worldometers, FUZE_ABBREVIATION_OPTION);

  return argis.map(argisCountry => {
    if (argisCountry.subName) {
      return argisCountry;
    }

    const abbreviation = argisCountry.name
      .split(/ |-/g)
      .map(piece => piece[0])
      .join('');
    const [worldometersCountryAbbreviation] =
      abbreviation.length > 1 ? FUZE_ABBREVIATION.search(abbreviation) : [];
    const [worldometersCountry] = FUZE_COUNTRY.search(argisCountry.name);
    if (!worldometersCountryAbbreviation && !worldometersCountry) {
      return argisCountry;
    }

    const abbreviationRes = (worldometersCountryAbbreviation || {
      score: Number.MAX_VALUE,
    }) as {
      item: SimpleCountry;
      score: number;
    };
    const countryRes = (worldometersCountry || {score: Number.MAX_VALUE}) as {
      item: SimpleCountry;
      score: number;
    };

    const {item, score} =
      abbreviationRes.score < countryRes.score ? abbreviationRes : countryRes;

    if (score >= 0.4) {
      return argisCountry;
    }
    console.log(JSON.stringify([argisCountry, item]));

    return {
      ...argisCountry,
      nbActives: item.nbActives,
      nbDeaths: item.nbDeaths,
      nbRecovered: item.nbRecovered,
      historyName: item.historyName,
      apiLastUpdate: Date.now(),
    };
  });
};

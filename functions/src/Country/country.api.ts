import fetch from 'node-fetch';
import * as moment from 'moment';
import * as cheerio from 'cheerio';

import {error, log, success} from '@/logger';
import {
  safeParseInt,
  breakDataIfNeeded,
  validNumber,
  numberToString,
} from '@/utils';

import {
  CURRENT_YEAR,
  API_ENDPOINT_ARGCIS,
  WEB_ENDPOINT_WORLDOMETERS,
  WEB_ENDPOINT_WORLDOMETERS_BY_COUNTRY,
  WORLDOMETERS_HISTORY_ACTIVE_CASES_REG,
  WORLDOMETERS_HISTORY_DAILY_RECOVERED_REG,
  WORLDOMETERS_HISTORY_DEATHS_REG,
} from './country.constants';
import {getFlagNameForCountry} from './country.utils';
import {Country, SimpleCountry, HistoryItem} from './country.type';

interface ArgcisAPIResponse {
  features: Array<{
    attributes: {
      Country_Region: string;
      Province_State?: string;
      Last_Update: number;
      Lat: number;
      Long_: number;
      Confirmed: number;
      Deaths: number;
      Recovered: number;
    };
  }>;
}

export const getArgisCountries = async (needFake: boolean) => {
  const getKey = (lat: number, long: number) =>
    [numberToString(lat), numberToString(long)].join('');

  const res = await fetch(API_ENDPOINT_ARGCIS);
  const data: ArgcisAPIResponse = await res.json();
  const countries = data.features.map<Country>(({attributes}) => {
    const key = getKey(attributes.Lat, attributes.Long_);
    const name = attributes.Country_Region.toLowerCase();
    const subName = attributes.Province_State?.toLowerCase();
    return {
      id: key,
      flag: getFlagNameForCountry(name),
      apiLastUpdate: attributes.Last_Update,
      name: name,
      subName: subName === name ? null : subName || null,
      lat: validNumber(attributes.Lat),
      long: validNumber(attributes.Long_),
      nbActives: breakDataIfNeeded(
        attributes.Confirmed - attributes.Recovered - attributes.Deaths,
        needFake,
      ),
      nbDeaths: breakDataIfNeeded(attributes.Deaths, needFake),
      nbRecovered: breakDataIfNeeded(attributes.Recovered, needFake),
      historyName: null,
    };
  });
  const countriesByName = countries.reduce(
    (acc, country) => ({
      ...acc,
      [country.name]: [...(acc[country.name] || []), country],
    }),
    {} as {[key: string]: Country[]},
  );
  const additionalCountries = Object.values(countriesByName)
    .filter((countries) => countries.every((country) => country.subName))
    .map<Country>((countries) => {
      const {
        latTotal,
        longTotal,
        nbActives,
        nbDeaths,
        nbRecovered,
      } = countries.reduce(
        (acc, country) => ({
          latTotal: acc.latTotal + country.lat,
          longTotal: acc.longTotal + country.long,
          nbActives: acc.nbActives + country.nbActives,
          nbDeaths: acc.nbDeaths + country.nbDeaths,
          nbRecovered: acc.nbRecovered + country.nbRecovered,
        }),
        {
          latTotal: 0,
          longTotal: 0,
          nbActives: 0,
          nbDeaths: 0,
          nbRecovered: 0,
        },
      );
      const lat = latTotal / countries.length;
      const long = longTotal / countries.length;
      return {
        ...countries[0],
        subName: null,
        id: getKey(lat, long),
        nbActives: breakDataIfNeeded(nbActives, needFake),
        nbDeaths: breakDataIfNeeded(nbDeaths, needFake),
        nbRecovered: breakDataIfNeeded(nbRecovered, needFake),
        lat,
        long,
      };
    });
  return [...countries, ...additionalCountries];
};

export const getWorldometersCountries = async (needFake: boolean) => {
  const res = await fetch(WEB_ENDPOINT_WORLDOMETERS);
  const html = await res.text();
  const $ = cheerio.load(html);

  return ($('#main_table_countries_today tbody:first-of-type tr')
    .map((_, tr) => {
      const [, nameEl, ...columns] = $(tr).children('td').toArray();

      const historyName =
        $(nameEl)
          .children('a')
          .attr('href')
          ?.replace(/(country)?\//g, '') || null;
      const name = $(nameEl).text();

      const [, , nbDeaths, , nbRecovered, , nbActives] = columns.map((td) =>
        safeParseInt($(td).text().trim()),
      );
      console.log({
        name,
        nbDeaths,
        nbRecovered,
        nbActives,
      });

      return {
        name,
        nbActives: breakDataIfNeeded(nbActives, needFake),
        nbDeaths: breakDataIfNeeded(nbDeaths, needFake),
        nbRecovered: breakDataIfNeeded(nbRecovered, needFake),
        historyName,
      };
    })
    .toArray() as any) as SimpleCountry[];
};

export const getWorldometersHistory = async (
  countryName: string,
  needFake: boolean,
): Promise<{
  deaths: HistoryItem[] | null;
  actives: HistoryItem[] | null;
  recovered: HistoryItem[] | null;
}> => {
  log(needFake, `[${countryName}] fetching history`);

  let res;
  try {
    res = await fetch(WEB_ENDPOINT_WORLDOMETERS_BY_COUNTRY(countryName));
  } catch {
    error(needFake, `[${countryName}] fetching history failed`);
    return {
      actives: null,
      deaths: null,
      recovered: null,
    };
  }
  const html = await res.text();

  const extractHistoryFromRegexp = (reg: RegExp): HistoryItem[] | null => {
    try {
      const matches = reg.exec(html)!;
      const [time, data] = matches
        .slice(1)
        .map<any[]>((match) => JSON.parse(match));

      const formattedTime = time.map((t: string) =>
        moment(`${t} ${CURRENT_YEAR}`, 'MMM DD YYYY').toISOString(),
      );

      if (time.length !== data.length) {
        throw new Error(
          `unmatched length of data (time: ${time.length} and data: ${data.length})`,
        );
      }

      return formattedTime.map<HistoryItem>((time, index) => ({
        label: time,
        value: breakDataIfNeeded(data[index] || 0, needFake),
      }));
    } catch (e) {
      error(needFake, `[${countryName}] ${e.message}`);
      return null;
    }
  };

  const activesHistory = extractHistoryFromRegexp(
    WORLDOMETERS_HISTORY_ACTIVE_CASES_REG,
  );

  const deathsHistory = extractHistoryFromRegexp(
    WORLDOMETERS_HISTORY_DEATHS_REG,
  );

  // @xxx website provide only daily data so we have to normalize it
  let recoveredHistory = extractHistoryFromRegexp(
    WORLDOMETERS_HISTORY_DAILY_RECOVERED_REG,
  );
  if (recoveredHistory) {
    recoveredHistory = recoveredHistory.reduce<HistoryItem[]>(
      (acc, item, index) => [
        ...acc,
        {
          label: item.label,
          value: index
            ? acc[index - 1].value + item.value || 0
            : item.value || 0,
        },
      ],
      [],
    );
  }

  success(needFake, `[${countryName}] history fetched`);
  return {
    deaths: deathsHistory,
    actives: activesHistory,
    recovered: recoveredHistory,
  };
};

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import {safeParseInt} from '../utils';
import {
  API_ENDPOINT_ARCGIS,
  WEB_ENDPOINT_WORLDOMETERS,
} from './country.constants';
import {getFlagNameForCountry} from './country.utils';
import {Country, SimpleCountry} from './country.type';

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

const numberToString = (nb: number) =>
  nb
    .toFixed(3)
    .replace(/\.|\-/g, '')
    .substr(0, 4);

export const getArgisCountries = async () => {
  const res = await fetch(API_ENDPOINT_ARCGIS);
  const data: ArgcisAPIResponse = await res.json();
  return new Map<string, Country>(
    data.features.map(({attributes}) => {
      const key = [
        numberToString(attributes.Lat),
        numberToString(attributes.Long_),
      ].join('');
      return [
        key,
        {
          id: key,
          flag: getFlagNameForCountry(attributes.Country_Region),
          apiLastUpdate: attributes.Last_Update,
          name: attributes.Country_Region,
          subName: attributes.Province_State || null,
          lat: attributes.Lat,
          long: attributes.Long_,
          nbConfirmed: attributes.Confirmed,
          nbDeaths: attributes.Deaths,
          nbRecovered: attributes.Recovered,
        },
      ];
    }),
  );
};

export const getWorldometersCountries = async () => {
  const res = await fetch(WEB_ENDPOINT_WORLDOMETERS);
  const html = await res.text();
  const $ = cheerio.load(html);

  return ($('tbody tr')
    .map((_, tr) => {
      const columns = $(tr)
        .children('td')
        .toArray()
        .map(td =>
          safeParseInt(
            $(td)
              .text()
              .trim(),
          ),
        );
      const [name, nbConfirmed, , nbDeaths, , nbRecovered] = columns;
      return {name, nbConfirmed, nbDeaths, nbRecovered};
    })
    .toArray() as any) as SimpleCountry[];
};

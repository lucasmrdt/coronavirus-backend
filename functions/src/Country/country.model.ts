import * as admin from 'firebase-admin';
import {Country} from './country.type';
import {COUNTRY_REF_KEY} from './country.constants';
import {mapToObject} from '../utils';

export const countryRef = admin.database().ref(COUNTRY_REF_KEY);

export const getDBCountries = () =>
  new Promise<Map<string, Country>>((res, rej) =>
    countryRef.once(
      'value',
      snapshot => {
        let value = snapshot.val();

        res(
          new Map(
            (Object.values(value) as Country[]).map((country: Country) => [
              country.id,
              country,
            ]),
          ),
        );
      },
      rej,
    ),
  );

export const getDBCountry = (id: string) =>
  new Promise<Country>((res, rej) =>
    countryRef.child(id).once(
      'value',
      snapshot => {
        const country = snapshot.val();
        if (country) {
          res(country);
        } else {
          rej(new Error(`unfound country for id '${id}'`));
        }
      },
      rej,
    ),
  );

export const updateDBCountry = (country: Country) => {
  return countryRef.child(country.id).update(country);
};

export const updateDBCountries = (countries: Map<string, Country>) => {
  return countryRef.set(mapToObject(countries));
};

export interface SimpleCountry {
  name: string;
  nbConfirmed: number;
  nbDeaths: number;
  nbRecovered: number;
}

export interface Country extends SimpleCountry {
  id: string;
  subName: string | null;
  lat: number;
  long: number;
  apiLastUpdate: number;
  flag: string | null;
}

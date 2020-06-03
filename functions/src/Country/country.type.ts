export interface HistoryItem {
  label: string;
  value: number;
}

export interface CountryHistory {
  id: string;
  country: string;
  flag: string | null;
  actives: HistoryItem[] | null;
  deaths: HistoryItem[] | null;
  recovered: HistoryItem[] | null;
}

export interface SimpleCountry {
  name: string;
  nbActives: number;
  nbDeaths: number;
  nbRecovered: number;
  historyName: string | null;
}

export interface Country extends SimpleCountry {
  id: string;
  subName: string | null;
  lat: number;
  long: number;
  apiLastUpdate: number;
  flag: string | null;
}

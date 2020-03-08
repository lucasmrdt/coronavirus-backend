export interface MedicalCase {
  id: string;
  country: string;
  state: string | null;
  lat: number;
  long: number;
  apiLastUpdate: number;
  nbConfirmed: number;
  nbDeaths: number;
  nbRecovered: number;
}

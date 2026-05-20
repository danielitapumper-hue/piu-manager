import { Chart } from "./piuscores-interfaces";

export interface PhoenixScoresResponse {
  page: number;
  count: number;
  totalResults: number;
  results: Result[];
}

export interface Result {
  plate: null | string;
  letterGrade: string;
  score: number;
  isBroken: boolean;
  recordedDate: Date;
  chart: Chart;
}

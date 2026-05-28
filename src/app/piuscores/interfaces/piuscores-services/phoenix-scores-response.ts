import { Chart } from "./piuscores-interfaces";

export interface PhoenixScoresResponse {
  page: number;
  count: number;
  totalResults: number;
  results: Result[];
}

export interface Result {
  plate: Plate | null;
  letterGrade: string;
  score: number;
  isBroken: boolean;
  recordedDate: Date;
  chart: Chart;
}

export enum Plate {
  RoughGame = "Rough Game",
  FairGame = "Fair Game",
  TalentedGame = "Talented Game",
  MarvelousGame = "Marvelous Game",
  SuperbGame = "Superb Game",
  ExtremeGame = "Extreme Game",
  UltimateGame = "Ultimate Game",
  PerfectGame = "Perfect Game"
}

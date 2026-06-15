import { ChartType } from "./piuscores-interfaces";

export interface ScoreRequest {
  chartLevel: number,
  chartType: ChartType,
  isBroken: boolean | null,
  plate: string | null,
  score: number | null,
  songName: string
}

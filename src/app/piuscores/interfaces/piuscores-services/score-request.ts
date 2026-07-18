import { ChartType } from "./piuscores-interfaces";

export const MIX_OPTIONS = ['Phoenix', 'Phoenix2'] as const;
export type MixOption = (typeof MIX_OPTIONS)[number] | null;

export interface ScoreRequest {
  chartLevel: number,
  chartType: ChartType,
  isBroken: boolean | null,
  plate: string | null,
  score: number | null,
  songName: string,
  mix: MixOption
}

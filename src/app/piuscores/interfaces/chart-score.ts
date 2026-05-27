import { Chart } from "./piuscores-services/piuscores-interfaces";
import { Score } from "./score";

export interface ChartScore {
  chart: Chart;
  score?: Score;
}

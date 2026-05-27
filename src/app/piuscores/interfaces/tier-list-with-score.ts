import { Category, Chart } from "./piuscores-services/piuscores-interfaces";
import { Score } from "./score";

export interface TierListWithScore {
  category: Category;
  order: number;
  chart: Chart;
  score?: Score;
}

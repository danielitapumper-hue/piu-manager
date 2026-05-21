import { Category, Chart } from "./piuscores-interfaces";

export interface TierListResponse {
  category: Category;
  order: number;
  chart: Chart;
}

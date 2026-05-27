import { ChartScore } from "./chart-score";
import { Category } from "./piuscores-services/piuscores-interfaces";

export interface CategoryCharts {
  category: Category;
  charts: ChartScore[];
}

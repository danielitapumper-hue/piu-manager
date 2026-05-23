import { Category, Chart } from "./piuscores-services/piuscores-interfaces";

export interface CategoryChart {
  category: Category;
  charts: Chart[];
}

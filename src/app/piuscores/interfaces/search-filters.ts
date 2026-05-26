import { ChartType, SongType } from "./piuscores-services/piuscores-interfaces"

export interface SearchFilters {
  chartType: string,
  filter?: string,
  isLastFilter?: boolean,
  level: number,
  saveFilter?: boolean,
  songTypes: boolean[]
}

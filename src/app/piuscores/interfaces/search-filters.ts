import { ChartType, SongType } from "./piuscores-services/piuscores-interfaces"

export interface SearchFilters {
  chartType: string,
  filter?: string,
  level: number,
  saveFilter?: boolean,
  songTypes: boolean[]
}

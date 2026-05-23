import { ChartType, SongType } from "./piuscores-services/piuscores-interfaces"

export interface SearchFilters {
  chartType: string,
  level: number,
  saveFilter: boolean,
  songTypes: SongType[]
}

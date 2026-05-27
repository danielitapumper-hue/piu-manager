export interface SearchFilters {
  chartType: string,
  filter?: string,
  isLastFilter?: boolean,
  level: number,
  saveFilter?: boolean,
  songTypes: boolean[],
  stagePass: boolean | null
}

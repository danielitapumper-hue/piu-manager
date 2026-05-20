export interface Chart {
  id: string;
  type: ChartType;
  shorthand: string;
  level: number;
  song: Song;
}

export interface Song {
  name: string;
  type: SongType;
  imagePath: string;
}

export enum SongType {
  Arcade = "Arcade",
  FullSong = "FullSong",
  Remix = "Remix",
  ShortCut = "ShortCut",
}

export enum ChartType {
  Double = "Double",
  Single = "Single",
}

export enum Category {
  Easy = "Easy",
  Hard = "Hard",
  Medium = "Medium",
  VeryEasy = "VeryEasy",
  VeryHard = "VeryHard",
}

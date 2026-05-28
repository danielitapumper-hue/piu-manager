import { Plate } from "./piuscores-services/phoenix-scores-response";

export interface Score {
  plate: Plate | null;
  letterGrade: string;
  score: number;
  isBroken: boolean;
}

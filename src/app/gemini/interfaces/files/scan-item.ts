import { ScoreRequest } from "@piuscores/interfaces/piuscores-services/score-request";

export interface ScanItem {
  id: string;
  file: File;
  previewUrl: string;
  status: ScanStatus;
  errorMessage?: string;
  scoreRequest?: ScoreRequest;
  formValid?: boolean;
}

export enum ScanStatus {
  Pending = 'pending',
  Scanning = 'scanning',
  Success = 'success',
  Saving = 'saving',
  Saved = 'saved',
  Error = 'error',
}

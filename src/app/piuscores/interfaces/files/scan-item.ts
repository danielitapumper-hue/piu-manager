import { ScoreRequest } from "../piuscores-services/score-request";

export interface ScanItem {
  id: string;
  file: File;
  previewUrl: string;
  status: 'pending' | 'scanning' | 'success' | 'saving' | 'saved' | 'error';
  errorMessage?: string;
  scoreRequest?: ScoreRequest;
  formValid?: boolean;
}

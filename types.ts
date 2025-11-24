export interface ImageState {
  file: File | null;
  previewUrl: string | null;
}

export interface GenerationResult {
  imageUrl: string | null;
  error: string | null;
}

export enum AppStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}
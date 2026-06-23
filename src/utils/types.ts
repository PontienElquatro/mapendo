export type GenerationType = "image" | "video";

export interface GenerationParams {
  sender: string;
  receiver: string;
  message: string;
  theme: string;
  style: string;
  font: string;
  type: GenerationType;
  customMedia?: string;
}

export interface GenerationResponse {
  url?: string;
  error?: string;
}

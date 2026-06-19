export interface GenerationParams {
  sender: string;
  receiver: string;
  message: string;
  theme: string;
  style: string;
  font: string;
  customMedia?: string; // base64 string
  type?: "image" | "video";
}

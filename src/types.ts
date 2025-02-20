export interface MemeTemplate {
  id: string;
  name: string;
  imageUrl: string;
  textBoxes: {
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
  }[];
}

export interface ConversationInput {
  text: string;
  type: 'tweet' | 'text' | 'chat';
}

export interface ImgflipMeme {
  id: string;
  name: string;
  url: string;
  width: number;
  height: number;
  box_count: number;
}

export interface ImgflipResponse {
  success: boolean;
  data: {
    memes: ImgflipMeme[];
  };
}

export interface ProcessedText {
  lines: string[];
  loading: boolean;
  error: string | null;
}
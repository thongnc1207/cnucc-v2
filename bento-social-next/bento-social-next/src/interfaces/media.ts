export interface Media {
  url: string;
  filename?: string;
  ext?: string;
  contentType?: string;
  size?: number;
}

export interface MediaResponse {
  data: Media | Media[];
}
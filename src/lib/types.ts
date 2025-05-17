export interface Note {
  id: string;
  content: string;
  createdAt: Date;
  tags: string[];
  imageDataUri?: string; // Added field for image data
}

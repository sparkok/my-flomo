export interface Note {
  id: string;
  title: string; // Derived from the first line of content, tags removed
  content: string;
  createdAt: Date;
  tags: string[];
  imageDataUri?: string;
}

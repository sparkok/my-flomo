import type { Note } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Tag } from "lucide-react";
import { format } from 'date-fns';
import Image from 'next/image';

interface NoteItemProps {
  note: Note;
  onToggleTag: (tag: string) => void;
  activeTags: Set<string>;
}

export default function NoteItem({ note, onToggleTag, activeTags }: NoteItemProps) {
  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-200 ease-in-out animate-fade-in rounded-lg overflow-hidden">
      <CardHeader className="pb-3 pt-4 px-5 bg-muted/30 border-b">
        <div className="flex items-center text-xs text-muted-foreground">
          <CalendarDays className="mr-1.5 h-3.5 w-3.5 text-primary" />
          <span>{format(new Date(note.createdAt), "MMM d, yyyy 'at' h:mm a")}</span>
        </div>
      </CardHeader>
      <CardContent className="py-4 px-5">
        {note.imageDataUri && (
          <div className="mb-4 rounded-md overflow-hidden border border-muted shadow-sm">
            <Image 
              src={note.imageDataUri} 
              alt="Note image" 
              width={600} // Adjust as needed
              height={400} // Adjust as needed
              className="w-full h-auto max-h-96 object-contain rounded-md"
              data-ai-hint="note illustration" 
            />
          </div>
        )}
        <p className="text-foreground whitespace-pre-wrap text-base leading-relaxed">{note.content}</p>
      </CardContent>
      {note.tags && note.tags.length > 0 && (
        <CardFooter className="flex flex-wrap gap-2 pt-3 pb-4 px-5 border-t bg-muted/30">
          <Tag className="h-4 w-4 text-primary mr-1" />
          {note.tags.map(tag => (
            <Badge
              key={tag}
              variant={activeTags.has(tag) ? "default" : "secondary"}
              onClick={() => onToggleTag(tag)}
              className={`cursor-pointer transition-all duration-150 ease-in-out hover:opacity-80
                ${activeTags.has(tag) ? 'bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}
                px-2.5 py-0.5 text-xs rounded-full`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onToggleTag(tag); }}
              aria-pressed={activeTags.has(tag)}
              aria-label={`Tag: ${tag}`}
            >
              {tag}
            </Badge>
          ))}
        </CardFooter>
      )}
    </Card>
  );
}

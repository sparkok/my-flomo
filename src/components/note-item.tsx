import type { Note } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tag, MoreHorizontal, Pencil } from "lucide-react";
import { format } from 'date-fns';
import Image from 'next/image';

interface NoteItemProps {
  note: Note;
  onToggleTag: (tag: string) => void;
  activeTags: Set<string>;
  onEditNote: (noteId: string) => void;
}

export default function NoteItem({ note, onToggleTag, activeTags, onEditNote }: NoteItemProps) {
  return (
    <div className="bg-card p-4 rounded-md border border-border hover:shadow-sm transition-shadow duration-200 ease-in-out animate-fade-in">
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs text-muted-foreground">
          {format(new Date(note.createdAt), "yyyy-MM-dd HH:mm:ss")}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground -mr-2 -mt-1">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem onClick={() => onEditNote(note.id)}>
              <Pencil className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              Edit
            </DropdownMenuItem>
            {/* Add other actions like Delete here */}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {note.imageDataUri && (
        <div className="mb-3 rounded-md overflow-hidden border border-muted">
          <Image 
            src={note.imageDataUri} 
            alt="Note image" 
            width={600}
            height={400}
            className="w-full h-auto max-h-72 object-contain rounded-sm"
            data-ai-hint="note illustration" 
          />
        </div>
      )}

      <p className="text-foreground whitespace-pre-wrap text-sm leading-relaxed mb-3">{note.content}</p>

      {note.tags && note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center">
          {/* <Tag className="h-3.5 w-3.5 text-muted-foreground mr-0.5" /> */}
          {note.tags.map(tag => (
            <Badge
              key={tag}
              variant={activeTags.has(tag) ? "default" : "secondary"}
              onClick={() => onToggleTag(tag)}
              className={`cursor-pointer transition-all duration-150 ease-in-out hover:opacity-80
                ${activeTags.has(tag) ? 'bg-accent/80 text-accent-foreground hover:bg-accent text-xs' : 'bg-muted hover:bg-secondary/70 text-muted-foreground hover:text-secondary-foreground text-xs'}
                px-2 py-0.5 font-normal rounded-sm`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onToggleTag(tag); }}
              aria-pressed={activeTags.has(tag)}
              aria-label={`Tag: ${tag}`}
            >
             #{tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

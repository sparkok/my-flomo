
import type { Note } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Tag, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { format } from 'date-fns';
import Image from 'next/image';
import React from "react";

interface NoteItemProps {
  note: Note;
  allNotes: Note[]; 
  onToggleTag: (tag: string) => void;
  activeTags: Set<string>;
  onEditNote: (noteId: string) => void;
  onDeleteNote: (noteId: string) => void;
}

const renderContentWithLinks = (content: string, allNotes: Note[]): React.ReactNode[] => {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  const regex = /\[\[note:([^\]]+)\]\]/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const noteId = match[1];
    const linkedNote = allNotes.find(n => n.id === noteId);
    
    if (match.index > lastIndex) {
      parts.push(content.substring(lastIndex, match.index));
    }

    if (linkedNote) {
      let displayName = linkedNote.title; // Prioritize derived title
      if (!displayName) { // Fallback to content snippet if title is empty
        displayName = linkedNote.content.substring(0, 30);
        if (linkedNote.content.length > 30) {
          displayName += "...";
        }
      }
      if (!displayName.trim() && linkedNote.imageDataUri) {
        displayName = "Image Note";
      } else if (!displayName.trim()) {
        displayName = "Untitled Note";
      }
      parts.push(
        <span key={`${match.index}-${noteId}`} className="font-medium text-primary cursor-pointer hover:underline">
          @{displayName}
        </span>
      );
    } else {
      parts.push(
        <span key={`${match.index}-${noteId}`} className="text-muted-foreground italic">
          @Note (ID: {noteId.substring(0,8)}...) [not found]
        </span>
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex));
  }

  return parts;
};


export default function NoteItem({ note, allNotes, onToggleTag, activeTags, onEditNote, onDeleteNote }: NoteItemProps) {
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
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDeleteNote(note.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Delete
            </DropdownMenuItem>
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

      <p className="text-foreground whitespace-pre-wrap text-sm leading-relaxed mb-3">
        {renderContentWithLinks(note.content, allNotes)}
      </p>

      {note.tags && note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center">
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

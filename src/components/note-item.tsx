
import type { Note } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
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

const renderContentWithLinksAndTags = (content: string, allNotes: Note[]): React.ReactNode[] => {
  const parts: React.ReactNode[] = [];
  // Regex to capture [[note:ID]] links OR #tags
  const regex = /(\[\[note:([^\]]+)\]\])|(#([^#\s\/]+(?:\/[^#\s\/]+)*))/g;
  let lastIndex = 0;
  let match;
  let keyCounter = 0; // For unique keys

  while ((match = regex.exec(content)) !== null) {
    // Text before the current match
    if (match.index > lastIndex) {
      parts.push(content.substring(lastIndex, match.index));
    }

    if (match[1]) { // It's a note link: match[1] is [[note:ID]], match[2] is ID
      const noteId = match[2];
      const linkedNote = allNotes.find(n => n.id === noteId);
      let displayName = linkedNote?.title || "";

      if (linkedNote) {
        if (!displayName.trim()) {
          displayName = linkedNote.content.substring(0, 30);
          if (linkedNote.content.length > 30) {
            displayName += "...";
          }
        }
        if (!displayName.trim() && linkedNote.imageDataUri) {
          displayName = "Image Note";
        } else if (!displayName.trim()) {
          displayName = `Note ID: ${noteId.substring(0,6)}...`;
        }
      } else {
        displayName = `Note (ID: ${noteId.substring(0,6)}...) [not found]`;
      }

      parts.push(
        <span key={`link-${keyCounter++}-${noteId}`} className="font-medium text-primary cursor-pointer hover:underline">
          @{displayName}
        </span>
      );
    } else if (match[3]) { // It's a tag: match[3] is #fulltag, match[4] is tagname
      parts.push(
        <span key={`tag-${keyCounter++}-${match[4]}`} className="text-primary">
          {match[3]}
        </span>
      );
    }
    lastIndex = regex.lastIndex;
  }

  // Remaining text after the last match
  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex));
  }

  return parts;
};


export default function NoteItem({ note, allNotes, onEditNote, onDeleteNote }: NoteItemProps) {
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
        {renderContentWithLinksAndTags(note.content, allNotes)}
      </p>
    </div>
  );
}

    
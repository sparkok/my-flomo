
import type { Note } from "@/lib/types";
import NoteItem from "./note-item";

interface NoteListProps {
  notes: Note[];
  allNotes: Note[]; // Added to pass down for link resolution
  onToggleTag: (tag: string) => void;
  activeTags: Set<string>;
  onEditNote: (noteId: string) => void;
  onDeleteNote: (noteId: string) => void;
}

export default function NoteList({ notes, allNotes, onToggleTag, activeTags, onEditNote, onDeleteNote }: NoteListProps) {
  if (notes.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground bg-card border border-dashed border-border rounded-lg">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3 text-muted-foreground opacity-60 lucide lucide-file-text"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
        <p className="text-md font-medium">No notes yet.</p>
        {activeTags.size > 0 ? (
            <p className="mt-1 text-xs">Try clearing filters or add a new note!</p>
        ) : (
            <p className="mt-1 text-xs">Capture your first thought above.</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notes.map(note => (
        <NoteItem 
          key={note.id} 
          note={note} 
          allNotes={allNotes} // Pass allNotes to each NoteItem
          onToggleTag={onToggleTag} 
          activeTags={activeTags} 
          onEditNote={onEditNote}
          onDeleteNote={onDeleteNote}
        />
      ))}
    </div>
  );
}

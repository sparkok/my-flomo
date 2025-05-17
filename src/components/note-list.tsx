import type { Note } from "@/lib/types";
import NoteItem from "./note-item";
import { ScrollArea } from "@/components/ui/scroll-area"; // Keep for long lists

interface NoteListProps {
  notes: Note[];
  onToggleTag: (tag: string) => void;
  activeTags: Set<string>;
  onEditNote: (noteId: string) => void;
}

export default function NoteList({ notes, onToggleTag, activeTags, onEditNote }: NoteListProps) {
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
    // The main page will handle scrolling for the entire main content area
    // So ScrollArea might not be needed here if the parent div scrolls.
    // For now, keeping it simple as a div.
    <div className="space-y-4">
      {notes.map(note => (
        <NoteItem key={note.id} note={note} onToggleTag={onToggleTag} activeTags={activeTags} onEditNote={onEditNote} />
      ))}
    </div>
  );
}

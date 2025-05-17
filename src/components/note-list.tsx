import type { Note } from "@/lib/types";
import NoteItem from "./note-item";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NoteListProps {
  notes: Note[];
  onToggleTag: (tag: string) => void;
  activeTags: Set<string>;
  onEditNote: (noteId: string) => void;
}

export default function NoteList({ notes, onToggleTag, activeTags, onEditNote }: NoteListProps) {
  if (notes.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground bg-card shadow-md rounded-lg">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 text-primary opacity-50 lucide lucide-file-text"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
        <p className="text-lg font-medium">No notes to display.</p>
        {activeTags.size > 0 ? (
            <p className="mt-1 text-sm">Try clearing some tag filters or add a new note!</p>
        ) : (
            <p className="mt-1 text-sm">Start by capturing a new thought above.</p>
        )}
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-460px)] md:h-[calc(100vh-420px)] pr-3 -mr-3"> {/* Adjust height & padding for scrollbar */}
      <div className="space-y-4">
        {notes.map(note => (
          <NoteItem key={note.id} note={note} onToggleTag={onToggleTag} activeTags={activeTags} onEditNote={onEditNote} />
        ))}
      </div>
    </ScrollArea>
  );
}

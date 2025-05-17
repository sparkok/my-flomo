
"use client";

import type { Note } from "@/lib/types";
import { useState, useEffect, useMemo, useCallback } from "react";
import NoteInputForm from "@/components/note-input-form";
import NoteList from "@/components/note-list";
import TagFilter from "@/components/tag-filter";
import ExportNotesButton from "@/components/export-notes-button";
import ActivityHeatmap from "@/components/ActivityHeatmap";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  RefreshCw,
  Search,
  Settings2,
  BookCopy,
  CalendarCheck,
  Package,
  ShieldAlert,
  TrendingUp,
  Folder
} from "lucide-react";
import { getNotesDB, createNoteDB, updateNoteDB, deleteNoteDB } from "@/app/actions/noteActions";
import { deriveTitleFromContent, extractTagsFromContent } from "@/lib/noteUtils";

const STORAGE_KEY = "sparkok_notes";
const DATA_STORAGE_MODE = process.env.NEXT_PUBLIC_DATA_STORAGE_MODE || "localStorage";


export default function HomePage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false); 
  const [isFetchingNotes, setIsFetchingNotes] = useState(true);
  const [noteToEdit, setNoteToEdit] = useState<Note | null>(null);
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [noteIdToDelete, setNoteIdToDelete] = useState<string | null>(null);

  useEffect(() => {
    setCurrentDate(new Date());
    async function loadNotes() {
      setIsFetchingNotes(true);
      try {
        let fetchedNotes: Note[] = [];
        if (DATA_STORAGE_MODE === "database") {
          fetchedNotes = await getNotesDB();
        } else {
          const storedNotes = localStorage.getItem(STORAGE_KEY);
          if (storedNotes) {
            const parsedDbNotes: Omit<Note, 'tags' | 'title'> & { tagsJson?: string, tags?: string[], title?:string }[] = JSON.parse(storedNotes);
            fetchedNotes = parsedDbNotes.map(note => {
              const content = note.content || "";
              // Ensure tags are an array
              let currentTags: string[];
              if (Array.isArray(note.tags)) {
                currentTags = note.tags;
              } else if (typeof note.tagsJson === 'string') {
                try {
                  currentTags = JSON.parse(note.tagsJson);
                } catch {
                  currentTags = extractTagsFromContent(content); // Fallback
                }
              } else {
                 currentTags = extractTagsFromContent(content);
              }
              
              return {
                ...note,
                id: note.id || crypto.randomUUID(), // Ensure ID exists for older notes
                title: note.title !== undefined ? note.title : deriveTitleFromContent(content),
                content: content,
                tags: currentTags,
                createdAt: new Date(note.createdAt),
                updatedAt: new Date(note.updatedAt),
                imageDataUri: note.imageDataUri
              };
            }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          }
        }
        setNotes(fetchedNotes);
      } catch (error) {
        console.error(`Failed to fetch notes (mode: ${DATA_STORAGE_MODE}):`, error);
        toast({
          title: "Error Loading Notes",
          description: `Could not retrieve your notes. Using ${DATA_STORAGE_MODE} storage.`,
          variant: "destructive",
        });
        setNotes([]);
      }
      setIsFetchingNotes(false);
    }
    loadNotes();
  }, [toast]);

  const saveNotesToLocalStorage = useCallback((updatedNotes: Note[]) => {
    // For localStorage, we store tagsJson string representation for consistency with DB model expectation
    const notesToStore = updatedNotes.map(note => ({...note, tagsJson: JSON.stringify(note.tags)}));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notesToStore));
  }, []);


  const handleSaveNote = useCallback(async (
    data: { content: string; imageDataUri?: string },
    noteIdToUpdate?: string
  ) => {
    const { content, imageDataUri } = data;

    if (!content.trim() && !imageDataUri) {
      toast({
        title: "Empty Note",
        description: "Cannot save an empty note without content or an image.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);

    try {
      if (DATA_STORAGE_MODE === "database") {
        if (noteIdToUpdate) {
          const updatedNoteData = await updateNoteDB(noteIdToUpdate, { content, imageDataUri });
          if (updatedNoteData) {
            setNotes(prevNotes => prevNotes.map(note => note.id === noteIdToUpdate ? updatedNoteData : note));
            toast({ title: "Note Updated", description: "Your note has been successfully updated in the database." });
          } else { throw new Error("Failed to update note on server"); }
        } else {
          const newNoteData = await createNoteDB({ content, imageDataUri });
          if (newNoteData) {
            setNotes(prevNotes => [newNoteData, ...prevNotes]);
            toast({ title: "Note Saved", description: "Your note has been successfully saved to the database." });
          } else { throw new Error("Failed to save note on server"); }
        }
      } else { // localStorage mode
        const title = deriveTitleFromContent(content);
        const tags = extractTagsFromContent(content);
        let updatedNotes;

        if (noteIdToUpdate) {
          const updatedNote: Note = {
            id: noteIdToUpdate,
            title,
            content,
            tags,
            imageDataUri,
            createdAt: notes.find(n => n.id === noteIdToUpdate)?.createdAt || new Date(), // Keep original createdAt
            updatedAt: new Date(),
          };
          updatedNotes = notes.map(note => note.id === noteIdToUpdate ? updatedNote : note);
          toast({ title: "Note Updated", description: "Your note has been updated in local storage." });
        } else {
          const newNote: Note = {
            id: crypto.randomUUID(),
            title,
            content,
            tags,
            imageDataUri,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          updatedNotes = [newNote, ...notes];
          toast({ title: "Note Saved", description: "Your note has been saved to local storage." });
        }
        setNotes(updatedNotes);
        saveNotesToLocalStorage(updatedNotes);
      }
    } catch (error) {
        console.error("Error saving note:", error);
        toast({
            title: "Error Saving Note",
            description: (error as Error).message || "Could not save your note. Please try again.",
            variant: "destructive",
        });
    }

    setIsLoading(false);
    setNoteToEdit(null);
  }, [notes, toast, saveNotesToLocalStorage]);

  const handleSetNoteToEdit = useCallback((noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      setNoteToEdit(note);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [notes]);

  const handleCancelEdit = useCallback(() => {
    setNoteToEdit(null);
  }, []);

  const handleToggleTag = (tag: string) => {
    setActiveTags((prevTags) => {
      const newTags = new Set(prevTags);
      if (newTags.has(tag)) {
        newTags.delete(tag);
      } else {
        newTags.add(tag);
      }
      return newTags;
    });
  };

  const openDeleteConfirmDialog = (noteId: string) => {
    setNoteIdToDelete(noteId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteNote = async () => {
    if (noteIdToDelete) {
      setIsLoading(true);
      let success = false;
      if (DATA_STORAGE_MODE === "database") {
        const result = await deleteNoteDB(noteIdToDelete);
        success = result.success;
      } else {
        const updatedNotes = notes.filter(note => note.id !== noteIdToDelete);
        setNotes(updatedNotes);
        saveNotesToLocalStorage(updatedNotes);
        success = true;
      }
      setIsLoading(false);

      if (success) {
        toast({
          title: "Note Deleted",
          description: `Your note has been successfully deleted from ${DATA_STORAGE_MODE}.`,
        });
      } else {
         toast({
          title: "Error Deleting Note",
          description: "Could not delete your note. Please try again.",
          variant: "destructive",
        });
      }
    }
    setNoteIdToDelete(null);
    setShowDeleteConfirm(false);
  };

  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    notes.forEach(note => note.tags.forEach(tag => tagsSet.add(tag)));
    return Array.from(tagsSet).sort();
  }, [notes]);

  const filteredNotes = useMemo(() => {
    if (activeTags.size === 0) {
      return notes;
    }
    return notes.filter(note =>
      Array.from(activeTags).every(activeTag => note.tags.includes(activeTag))
    );
  }, [notes, activeTags]);

  const specialTagsConfig = [
    { name: "产品", icon: Package },
    { name: "故障检测", icon: ShieldAlert },
    { name: "成长", icon: TrendingUp },
  ];


  if (isFetchingNotes) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        Loading notes... ({DATA_STORAGE_MODE} mode)
      </div>
    );
  }

  return (
    <>
      <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-sidebar-background p-4 flex flex-col space-y-4 border-r border-sidebar-border fixed top-0 left-0 h-full">
          <div className="flex items-center space-x-2">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-md text-xs font-bold">PRO</div>
            <h1 className="text-xl font-semibold text-foreground">sparkok</h1>
          </div>

          <div className="flex justify-around text-center text-xs text-muted-foreground pt-2">
            <div><p className="text-lg font-medium text-foreground">{notes.length}</p><p>笔记</p></div>
            <div><p className="text-lg font-medium text-foreground">{allTags.length}</p><p>标签</p></div>
            <div><p className="text-lg font-medium text-foreground">1183</p><p>天</p></div>
          </div>

          <ActivityHeatmap notes={notes} currentDate={currentDate} />

          <Button variant="default" className="w-full bg-primary hover:bg-accent text-primary-foreground justify-start px-3">
            <BookCopy className="mr-2 h-4 w-4" />
            全部笔记
          </Button>

          <nav className="flex flex-col space-y-1 text-sm">
            <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground px-3">
              <CalendarCheck className="mr-2 h-4 w-4" />
              每日回顾
            </Button>
          </nav>

          <Separator className="my-2 bg-sidebar-border"/>

          <div className="flex-grow overflow-y-auto pr-1 -mr-2">
            <h2 className="text-xs font-semibold text-muted-foreground mb-2 px-2 uppercase">全部标签</h2>
            <TagFilter
              allTags={allTags}
              activeTags={activeTags}
              onToggleTag={handleToggleTag}
              specialTagsConfig={specialTagsConfig}
            />
          </div>

        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col ml-64 overflow-y-auto">
          <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-6 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              {currentDate !== null ? <span>{format(currentDate, "yyyy-MM-dd")}</span> : <span>Loading date...</span>}
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center space-x-2 w-1/3">
              <Search className="h-4 w-4 text-muted-foreground absolute ml-2 pointer-events-none" />
              <Input
                type="search"
                placeholder="Ctrl+K"
                className="pl-8 pr-2 py-1 h-8 text-sm rounded-md w-full focus-visible:ring-primary"
              />
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                <Settings2 className="h-4 w-4" />
              </Button>
            </div>
          </header>

          <div className="flex-grow p-6 space-y-6">
            <NoteInputForm
              onSaveNote={handleSaveNote}
              isLoading={isLoading}
              noteToEdit={noteToEdit}
              onCancelEdit={handleCancelEdit}
              allTags={allTags}
              allNotes={notes}
            />

            <div className="flex items-center justify-between mt-6 mb-4">
              <h2 className="text-base font-semibold text-muted-foreground">笔记 ({filteredNotes.length})</h2>
              <div className="flex items-center space-x-3">
                <button className="text-xs text-muted-foreground hover:text-primary">筛选</button>
                <ExportNotesButton notes={notes} />
              </div>
            </div>

            <NoteList
              notes={filteredNotes}
              allNotes={notes}
              onToggleTag={handleToggleTag}
              activeTags={activeTags}
              onEditNote={handleSetNoteToEdit}
              onDeleteNote={openDeleteConfirmDialog}
            />
          </div>
        </main>
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this note?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your note.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setShowDeleteConfirm(false); setNoteIdToDelete(null); }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteNote} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

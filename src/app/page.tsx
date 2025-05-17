
"use client";

import type { Note } from "@/lib/types";
import { useState, useEffect, useMemo, useCallback } from "react";
import NoteInputForm from "@/components/note-input-form";
import NoteList from "@/components/note-list";
import TagFilter from "@/components/tag-filter";
import ExportNotesButton from "@/components/export-notes-button"; 
import ActivityHeatmap from "@/components/ActivityHeatmap"; 
import { useToast } from "@/hooks/use-toast";
import { generateTags } from "@/ai/flows/generate-tags";
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
  MessageSquare, 
  CalendarCheck,
  Package,
  ShieldAlert,
  TrendingUp,
  Folder 
} from "lucide-react";

export default function HomePage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState<Note | null>(null);
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [noteIdToDelete, setNoteIdToDelete] = useState<string | null>(null);


  useEffect(() => {
    setCurrentDate(new Date());
    const storedNotes = localStorage.getItem("flownotes");
    if (storedNotes) {
      try {
        const parsedNotes: Note[] = JSON.parse(storedNotes).map((note: any) => ({
          ...note,
          createdAt: new Date(note.createdAt),
        }));
        setNotes(parsedNotes);
      } catch (error) {
        console.error("Failed to parse notes from localStorage", error);
        setNotes([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("flownotes", JSON.stringify(notes));
  }, [notes]);

  const extractTagsFromContent = (content: string): string[] => {
    const extracted: string[] = [];
    const regex = /#([^#\s\/]+(?:\/[^#\s\/]+)*)/g; 
    let match;
    while ((match = regex.exec(content)) !== null) {
      extracted.push(match[1]);
    }
    return Array.from(new Set(extracted));
  };

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

    const manuallyExtractedTags = extractTagsFromContent(content);

    try {
      const { tags: aiTags } = await generateTags({ text: content });
      const combinedTags = Array.from(
        new Set([...manuallyExtractedTags, ...(aiTags || [])])
      ).sort();
      
      if (noteIdToUpdate) {
        const updatedNote: Note = {
          id: noteIdToUpdate,
          content,
          createdAt: notes.find(n => n.id === noteIdToUpdate)?.createdAt || new Date(),
          tags: combinedTags,
          imageDataUri,
        };
        setNotes(prevNotes => prevNotes.map(note => note.id === noteIdToUpdate ? updatedNote : note));
        toast({
          title: "Note Updated",
          description: "Your note has been successfully updated.",
        });
      } else {
        const newNote: Note = {
          id: new Date().toISOString(),
          content,
          createdAt: new Date(),
          tags: combinedTags,
          imageDataUri,
        };
        setNotes(prevNotes => [newNote, ...prevNotes]);
        toast({
          title: "Note Saved",
          description: "Your note has been successfully saved.",
        });
      }
    } catch (error) {
      console.error("Error generating tags or saving/updating note:", error);
      const fallbackTags = Array.from(new Set([...manuallyExtractedTags])).sort();
      
      if (noteIdToUpdate) {
        const updatedNoteWithoutAITags: Note = {
          id: noteIdToUpdate,
          content,
          createdAt: notes.find(n => n.id === noteIdToUpdate)?.createdAt || new Date(),
          tags: fallbackTags,
          imageDataUri,
        };
        setNotes(prevNotes => prevNotes.map(note => note.id === noteIdToUpdate ? updatedNoteWithoutAITags : note));
      } else {
        const newNoteWithoutAITags: Note = {
          id: new Date().toISOString(),
          content,
          createdAt: new Date(),
          tags: fallbackTags,
          imageDataUri,
        };
        setNotes(prevNotes => [newNoteWithoutAITags, ...prevNotes]);
      }
      toast({
        title: noteIdToUpdate ? "Note Updated (AI Tagging Failed)" : "Note Saved (AI Tagging Failed)",
        description: `Note saved with manually extracted tags: ${fallbackTags.join(', ')}. AI tagging failed.`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setNoteToEdit(null);
    }
  }, [notes, toast]);

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

  const confirmDeleteNote = () => {
    if (noteIdToDelete) {
      setNotes(prevNotes => prevNotes.filter(note => note.id !== noteIdToDelete));
      toast({
        title: "Note Deleted",
        description: "Your note has been successfully deleted.",
      });
    }
    setNoteIdToDelete(null);
    setShowDeleteConfirm(false);
  };

  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    notes.forEach(note => note.tags.forEach(tag => tagsSet.add(tag)));
    ["产品", "故障检测", "成长"].forEach(st => tagsSet.add(st));
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
            <div><p className="text-lg font-medium text-foreground">728</p><p>笔记</p></div>
            <div><p className="text-lg font-medium text-foreground">347</p><p>标签</p></div>
            <div><p className="text-lg font-medium text-foreground">1183</p><p>天</p></div>
          </div>
          
          <ActivityHeatmap notes={notes} currentDate={currentDate} />

          <Button variant="default" className="w-full bg-primary hover:bg-accent text-primary-foreground justify-start px-3">
            <BookCopy className="mr-2 h-4 w-4" />
            全部笔记
          </Button>
          
          <nav className="flex flex-col space-y-1 text-sm">
            <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground px-3">
              <MessageSquare className="mr-2 h-4 w-4" />
              微信输入
            </Button>
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
              allNotes={notes} // Pass all notes for link resolution
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
            <AlertDialogCancel onClick={() => setNoteIdToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteNote} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

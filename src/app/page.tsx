
"use client";

import type { Note } from "@/lib/types";
import { useState, useEffect, useMemo, useCallback } from "react";
import NoteInputForm from "@/components/note-input-form";
import NoteList from "@/components/note-list";
import ExportNotesButton from "@/components/export-notes-button";
import { useToast } from "@/hooks/use-toast";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { getNotesDB, createNoteDB, updateNoteDB, deleteNoteDB } from "@/app/actions/noteActions";
import { deriveTitleFromContent, extractTagsFromContent } from "@/lib/noteUtils";
import { useAuth } from "@/contexts/AuthContext";
import LoginForm from "@/components/auth/LoginForm.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Added for SidebarHeader

// Refactored components
import SidebarHeader from "@/components/page/SidebarHeader";
import SidebarNav from "@/components/page/SidebarNav";
import MainHeader from "@/components/page/MainHeader";


const STORAGE_KEY_PREFIX = "shareok_notes_"; // Prefix for user-specific local storage
const DATA_STORAGE_MODE_ENV = process.env.NEXT_PUBLIC_DATA_STORAGE_MODE || "localStorage";

interface ProspectiveNoteData {
  id?: string;
  content: string;
  imageDataUri?: string;
  title: string;
  tags: string[];
  originalCreatedAt?: Date;
}

export default function HomePage() {
  const { currentUser, loadingAuth, logout } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isFetchingNotes, setIsFetchingNotes] = useState(true);
  const [noteToEdit, setNoteToEdit] = useState<Note | null>(null);
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showPreferencesDialog, setShowPreferencesDialog] = useState(false); // New state for preferences dialog
  const [noteIdToDelete, setNoteIdToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showLoginPage, setShowLoginPage] = useState(false);


  const effectiveDataStorageMode = useMemo(() => {
    if (currentUser) return "database"; // If user is logged in, always use database
    return DATA_STORAGE_MODE_ENV;
  }, [currentUser]);

  const getLocalStorageKey = useCallback(() => {
    return currentUser ? `${STORAGE_KEY_PREFIX}${currentUser.uid}` : `${STORAGE_KEY_PREFIX}guest`;
  }, [currentUser]);


  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  useEffect(() => {
    async function loadNotes() {
      if (loadingAuth) {
        setIsFetchingNotes(true);
        return;
      }
      setShowLoginPage(false); // Reset login page trigger on auth state change

      setIsFetchingNotes(true);
      let fetchedNotes: Note[] = [];
      try {
        if (effectiveDataStorageMode === "database") {
          if (currentUser) {
            fetchedNotes = await getNotesDB();
          } else {
            // If in database mode but no user, no notes are loaded client-side (login form shown)
            fetchedNotes = [];
          }
        } else { // localStorage mode
          const storageKey = getLocalStorageKey();
          const storedNotes = localStorage.getItem(storageKey);
          if (storedNotes) {
            const parsedDbNotes: Omit<Note, 'tags' | 'title' | 'userId'> & { tagsJson?: string, tags?: string[], title?:string }[] = JSON.parse(storedNotes);
            fetchedNotes = parsedDbNotes.map(note => {
              const content = note.content || "";
              let currentTags: string[];
              if (Array.isArray(note.tags)) {
                currentTags = note.tags;
              } else if (typeof note.tagsJson === 'string') {
                try {
                  currentTags = JSON.parse(note.tagsJson);
                } catch {
                  currentTags = extractTagsFromContent(content);
                }
              } else {
                 currentTags = extractTagsFromContent(content);
              }
              const currentTitle = note.title !== undefined ? note.title : deriveTitleFromContent(content);

              return {
                ...note,
                id: note.id || crypto.randomUUID(),
                title: currentTitle,
                content: content,
                tags: currentTags,
                createdAt: new Date(note.createdAt),
                updatedAt: new Date(note.updatedAt),
                imageDataUri: note.imageDataUri,
              };
            }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          }
        }
        setNotes(fetchedNotes);
      } catch (error) {
        console.error(`Failed to fetch notes (mode: ${effectiveDataStorageMode}):`, error);
        toast({
          title: "Error Loading Notes",
          description: `Could not retrieve your notes. Using ${effectiveDataStorageMode} storage.`,
          variant: "destructive",
        });
        setNotes([]);
      }
      setIsFetchingNotes(false);
    }
    loadNotes();
  }, [effectiveDataStorageMode, loadingAuth, currentUser, toast, getLocalStorageKey]);

  const saveNotesToLocalStorage = useCallback((updatedNotes: Note[]) => {
    const storageKey = getLocalStorageKey();
    const notesToStore = updatedNotes.map(note => ({...note, tagsJson: JSON.stringify(note.tags)}));
    localStorage.setItem(storageKey, JSON.stringify(notesToStore));
  }, [getLocalStorageKey]);

  const beforeSaveNoteInterceptor = (prospectiveNote: ProspectiveNoteData): boolean => {
    // console.log("Intercepting note before save:", prospectiveNote);
    return true;
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
    setIsSavingNote(true);

    const currentTags = extractTagsFromContent(content);
    const currentTitle = deriveTitleFromContent(content); // Derive title here for prospective note

    const prospectiveNote: ProspectiveNoteData = {
      content,
      imageDataUri,
      title: currentTitle,
      tags: currentTags,
    };

    if (noteIdToUpdate) {
      prospectiveNote.id = noteIdToUpdate;
      const existingNote = notes.find(n => n.id === noteIdToUpdate);
      if (existingNote) {
        prospectiveNote.originalCreatedAt = existingNote.createdAt;
      }
    }

    if (!beforeSaveNoteInterceptor(prospectiveNote)) {
      toast({
        title: "Note Save Interrupted",
        description: "The note could not be saved due to a pre-save condition.",
        variant: "default",
      });
      setIsSavingNote(false);
      return;
    }

    try {
      if (effectiveDataStorageMode === "database") {
        if (!currentUser) {
          toast({ title: "Not Logged In", description: "Please log in to save notes to the database.", variant: "destructive" });
          setIsSavingNote(false);
          return;
        }
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
        let updatedNotes;
        const noteDataForStorage = {
          title: currentTitle, // Use already derived title
          content,
          tags: currentTags,
          imageDataUri,
          updatedAt: new Date(),
        };

        if (noteIdToUpdate) {
          const existingNote = notes.find(n => n.id === noteIdToUpdate);
          const updatedNote: Note = {
            ...existingNote!,
            ...noteDataForStorage,
            id: noteIdToUpdate,
            createdAt: existingNote?.createdAt || new Date(),
          };
          updatedNotes = notes.map(note => note.id === noteIdToUpdate ? updatedNote : note);
          toast({ title: "Note Updated", description: "Your note has been updated in local storage." });
        } else {
          const newNote: Note = {
            ...noteDataForStorage,
            id: crypto.randomUUID(),
            createdAt: new Date(),
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

    setIsSavingNote(false);
    setNoteToEdit(null);
  }, [notes, toast, saveNotesToLocalStorage, effectiveDataStorageMode, currentUser]);

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
      setIsSavingNote(true);
      let success = false;
      if (effectiveDataStorageMode === "database") {
        if (!currentUser) {
          toast({ title: "Not Logged In", description: "Please log in to delete notes from the database.", variant: "destructive" });
          setIsSavingNote(false);
          setShowDeleteConfirm(false);
          setNoteIdToDelete(null);
          return;
        }
        const result = await deleteNoteDB(noteIdToDelete);
        success = result.success;
        if (success) {
           setNotes(prevNotes => prevNotes.filter(note => note.id !== noteIdToDelete));
        }
      } else { // localStorage mode
        const updatedNotes = notes.filter(note => note.id !== noteIdToDelete);
        setNotes(updatedNotes);
        saveNotesToLocalStorage(updatedNotes);
        success = true;
      }
      setIsSavingNote(false);

      if (success) {
        toast({
          title: "Note Deleted",
          description: `Your note has been successfully deleted from ${effectiveDataStorageMode}.`,
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
    let notesToFilter = notes;

    if (activeTags.size > 0) {
      notesToFilter = notesToFilter.filter(note =>
        Array.from(activeTags).every(activeTag => note.tags.includes(activeTag))
      );
    }

    if (searchTerm.trim() !== "") {
      const lowercasedSearchTerm = searchTerm.toLowerCase();
      notesToFilter = notesToFilter.filter(note =>
        note.content.toLowerCase().includes(lowercasedSearchTerm) ||
        (note.title && note.title.toLowerCase().includes(lowercasedSearchTerm))
      );
    }
    return notesToFilter;
  }, [notes, activeTags, searchTerm]);


  const handleLogout = async () => {
    await logout();
    setShowLogoutConfirm(false);
    setNotes([]); 
    setActiveTags(new Set());
    setNoteToEdit(null);
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
  };

  const getUserInitials = () => {
    if (!currentUser) return "";
    const name = currentUser.displayName || currentUser.email || "";
    if (!name) return "";
    const parts = name.split(/[.\s@]/); 
    if (parts.length > 1 && parts[0] && parts[1]) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name[0]?.toUpperCase() || "";
  };

  const handleOpenPreferencesDialog = () => {
    setShowPreferencesDialog(true);
  };

  if (loadingAuth || (isFetchingNotes && effectiveDataStorageMode === "database" && currentUser)) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
        Loading notes... ({effectiveDataStorageMode} mode)
      </div>
    );
  }

  if (!currentUser && !loadingAuth && (showLoginPage || effectiveDataStorageMode === "database")) {
    return <LoginForm />;
  }


  return (
    <>
      <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden">
        <aside className="w-64 bg-sidebar-background p-4 flex flex-col space-y-4 border-r border-sidebar-border fixed top-0 left-0 h-full">
          <SidebarHeader
            currentUser={currentUser}
            effectiveDataStorageMode={effectiveDataStorageMode}
            notes={notes}
            allTagsCount={allTags.length}
            currentDate={currentDate}
            getUserInitials={getUserInitials}
            onOpenPreferences={handleOpenPreferencesDialog} 
          />
          <SidebarNav
            currentUser={currentUser}
            loadingAuth={loadingAuth}
            effectiveDataStorageMode={effectiveDataStorageMode}
            onShowLoginPage={() => setShowLoginPage(true)}
            onShowLogoutConfirm={() => setShowLogoutConfirm(true)}
            allTags={allTags}
            activeTags={activeTags}
            onToggleTag={handleToggleTag}
          />
        </aside>

        <main className="flex-1 flex flex-col ml-64 overflow-y-auto">
          <MainHeader
            currentDate={currentDate}
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
          />

          <div className="flex-grow p-6 space-y-6">
            <NoteInputForm
              onSaveNote={handleSaveNote}
              isLoading={isSavingNote}
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
              onToggleTag={handleToggleTag} // This prop seems unused in NoteList/NoteItem now
              activeTags={activeTags} // This prop seems unused in NoteList/NoteItem now
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
            <AlertDialogAction onClick={confirmDeleteNote} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground" disabled={isSavingNote}>
              {isSavingNote && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
            <AlertDialogDescription>
              You will be logged out of your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowLogoutConfirm(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showPreferencesDialog} onOpenChange={setShowPreferencesDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>偏好设置</DialogTitle>
            <DialogDescription>
              Manage your application preferences here. (Content to be added)
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {/* Preferences content will go here */}
            <p className="text-sm text-muted-foreground">This is a placeholder for preferences settings.</p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

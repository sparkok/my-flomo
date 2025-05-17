
"use client";

import type { Note } from "@/lib/types";
import { useState, useEffect, useMemo } from "react";
import NoteInputForm from "@/components/note-input-form";
import NoteList from "@/components/note-list";
import TagFilter from "@/components/tag-filter";
import ExportNotesButton from "@/components/export-notes-button";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { generateTags } from "@/ai/flows/generate-tags";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
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
    const regex = /#([a-zA-Z0-9]+(?:[/][a-zA-Z0-9]+)*)/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      extracted.push(match[1]);
    }
    return Array.from(new Set(extracted)); // Return unique tags
  };

  const handleAddNote = async (content: string) => {
    if (!content.trim()) {
      toast({
        title: "Empty Note",
        description: "Cannot save an empty note.",
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
      
      const newNote: Note = {
        id: new Date().toISOString(),
        content,
        createdAt: new Date(),
        tags: combinedTags,
      };
      setNotes((prevNotes) => [newNote, ...prevNotes]);
      toast({
        title: "Note Saved",
        description: "Your note has been successfully saved and tagged.",
      });
    } catch (error) {
      console.error("Error generating tags or saving note:", error);
      const fallbackTags = Array.from(new Set([...manuallyExtractedTags])).sort();
      const newNoteWithoutAITags: Note = {
        id: new Date().toISOString(),
        content,
        createdAt: new Date(),
        tags: fallbackTags,
      };
      setNotes((prevNotes) => [newNoteWithoutAITags, ...prevNotes]);
      toast({
        title: "Note Saved (AI Tagging Failed)",
        description: `Note saved with manually extracted tags: ${fallbackTags.join(', ')}. AI tagging failed.`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-sans">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
          <h1 className="text-3xl font-bold text-primary">FlowNote</h1>
          <ExportNotesButton notes={notes} />
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <aside className="md:col-span-4 lg:col-span-3 space-y-6">
            <Card className="shadow-lg sticky top-[calc(4rem+24px)]"> {/* Adjust top based on header height */}
              <CardHeader>
                <CardTitle className="text-xl">Filter by Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <TagFilter
                  allTags={allTags}
                  activeTags={activeTags}
                  onToggleTag={handleToggleTag}
                />
              </CardContent>
            </Card>
          </aside>

          <section className="md:col-span-8 lg:col-span-9 space-y-6">
            <NoteInputForm onAddNote={handleAddNote} isLoading={isLoading} />
            <Separator />
            <NoteList notes={filteredNotes} onToggleTag={handleToggleTag} activeTags={activeTags}/>
          </section>
        </div>
      </main>

      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        <p>&copy; {new Date().getFullYear()} FlowNote. All rights reserved.</p>
      </footer>
      <Toaster />
    </div>
  );
}

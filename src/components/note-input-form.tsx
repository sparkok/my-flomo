
"use client";

import { useState, useRef, useEffect, type ChangeEvent, type FormEvent } from "react";
import type { Note } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Send, Loader2, ImagePlus, XCircle, RotateCcw, Hash, Type, List, AtSign, Globe } from "lucide-react";
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";

interface NoteInputFormProps {
  onSaveNote: (data: { content: string; imageDataUri?: string }, noteIdToUpdate?: string) => Promise<void>;
  isLoading: boolean;
  noteToEdit: Note | null;
  onCancelEdit: () => void;
  allTags: string[];
  allNotes: Note[];
}

export default function NoteInputForm({
  onSaveNote,
  isLoading,
  noteToEdit,
  onCancelEdit,
  allTags,
  allNotes
}: NoteInputFormProps) {
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const [isTagSuggestionsOpen, setIsTagSuggestionsOpen] = useState(false);
  const [currentTagSuggestions, setCurrentTagSuggestions] = useState<string[]>([]);
  const [tagQueryInfo, setTagQueryInfo] = useState<{ query: string, range: { start: number, end: number } } | null>(null);

  const [isNoteSuggestionsOpen, setIsNoteSuggestionsOpen] = useState(false);
  const [currentNoteSuggestions, setCurrentNoteSuggestions] = useState<Note[]>([]);
  const [noteQueryRange, setNoteQueryRange] = useState<{ start: number, end: number } | null>(null);


  useEffect(() => {
    if (noteToEdit) {
      setContent(noteToEdit.content);
      setImagePreview(noteToEdit.imageDataUri || null);
      setImageFile(null);
      textareaRef.current?.focus();
      setIsTagSuggestionsOpen(false);
      setIsNoteSuggestionsOpen(false);
    } else {
      setContent("");
      setImagePreview(null);
      setImageFile(null);
    }
  }, [noteToEdit]);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Image Too Large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        });
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImageFile(null);
      setImagePreview(noteToEdit?.imageDataUri || null);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsTagSuggestionsOpen(false);
    setIsNoteSuggestionsOpen(false);
    if (!content.trim() && !imageFile && !imagePreview) {
        toast({
            title: "Empty Note",
            description: "Cannot save an empty note without content or an image.",
            variant: "destructive",
        });
        return;
    }

    let finalImageDataUri: string | undefined = undefined;
    if (imageFile) {
      finalImageDataUri = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });
    } else if (imagePreview) {
       finalImageDataUri = imagePreview;
    }

    await onSaveNote({ content, imageDataUri: finalImageDataUri }, noteToEdit?.id);

    if (!noteToEdit) {
        setContent("");
        removeImage();
    }
  };

  const handleCancel = () => {
    setIsTagSuggestionsOpen(false);
    setIsNoteSuggestionsOpen(false);
    onCancelEdit();
  };

  const handleTextareaChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = event.target.value;
    setContent(newContent);

    const textarea = textareaRef.current;
    if (textarea) {
      const cursorPos = textarea.selectionStart;
      const textBeforeCursor = newContent.substring(0, cursorPos);

      const tagMatch = textBeforeCursor.match(/#([\w\/-]*)$/);
      if (tagMatch && tagMatch[0].length > 0) {
        const query = tagMatch[1];
        const filtered = allTags.filter(t => t.toLowerCase().startsWith(query.toLowerCase()));
        if (filtered.length > 0) {
          setCurrentTagSuggestions(filtered);
          setTagQueryInfo({ query: tagMatch[0], range: { start: tagMatch.index!, end: cursorPos } });
          setIsTagSuggestionsOpen(true);
          setIsNoteSuggestionsOpen(false);
        } else {
          setIsTagSuggestionsOpen(false);
        }
      } else {
        setIsTagSuggestionsOpen(false);
      }

      if (!isTagSuggestionsOpen) {
        const noteMentionMatch = textBeforeCursor.match(/@([\p{L}\p{N}\s-]*)$/u);
        if (noteMentionMatch) {
          const query = noteMentionMatch[1].toLowerCase();
          let filteredNotes = allNotes.filter(n =>
            (noteToEdit ? n.id !== noteToEdit.id : true) && // Exclude current note if editing
            (n.title.toLowerCase().includes(query) || n.content.toLowerCase().includes(query))
          );
          // Filter out notes with no effective title
          filteredNotes = filteredNotes.filter(n => n.title && n.title.trim() !== "").slice(0, 5);


          if (filteredNotes.length > 0) {
            setCurrentNoteSuggestions(filteredNotes);
            setNoteQueryRange({ start: noteMentionMatch.index!, end: cursorPos });
            setIsNoteSuggestionsOpen(true);
          } else {
            setIsNoteSuggestionsOpen(false);
          }
        } else {
          setIsNoteSuggestionsOpen(false);
        }
      }
    }
  };

  const handleSelectTag = (tag: string) => {
    const textarea = textareaRef.current;
    if (textarea && tagQueryInfo) {
      const { range } = tagQueryInfo;
      const currentVal = content;
      const before = currentVal.substring(0, range.start);
      const after = currentVal.substring(range.end);
      const newText = `${before}#${tag} ${after}`;
      setContent(newText);
      setIsTagSuggestionsOpen(false);
      setTagQueryInfo(null);
      requestAnimationFrame(() => {
        textarea.focus();
        const newCursorPos = range.start + 1 + tag.length + 1;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      });
    }
  };

  const handleInsertHashtag = () => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentVal = content;
      const newText = currentVal.substring(0, start) + "#" + currentVal.substring(end);
      setContent(newText);

      setIsTagSuggestionsOpen(false);
      setIsNoteSuggestionsOpen(false);

      requestAnimationFrame(() => {
        textarea.focus();
        const newCursorPos = start + 1;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        const textBeforeCursor = newText.substring(0, newCursorPos);
        const tagMatch = textBeforeCursor.match(/#([\w\/-]*)$/);
        if (tagMatch) {
            const query = tagMatch[1];
            const filtered = allTags.filter(t => t.toLowerCase().startsWith(query.toLowerCase()));
            if (filtered.length > 0) {
                setCurrentTagSuggestions(filtered);
                setTagQueryInfo({ query: tagMatch[0], range: { start: tagMatch.index!, end: newCursorPos } });
                setIsTagSuggestionsOpen(true);
            }
        }
      });
    }
  };

  const handleSelectNoteSuggestion = (selectedNote: Note) => {
    const textarea = textareaRef.current;
    if (textarea && noteQueryRange) {
      const linkText = `[[note:${selectedNote.id}]]`;
      const before = content.substring(0, noteQueryRange.start);
      const after = content.substring(noteQueryRange.end);
      const newText = `${before}${linkText} ${after}`;
      setContent(newText);
      setIsNoteSuggestionsOpen(false);
      setNoteQueryRange(null);

      requestAnimationFrame(() => {
        textarea.focus();
        const newCursorPos = noteQueryRange.start + linkText.length + 1;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      });
    }
  };

  const handleInsertAtSymbol = () => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentVal = content;
      const newText = currentVal.substring(0, start) + "@" + currentVal.substring(end);
      setContent(newText);

      setIsTagSuggestionsOpen(false);
      setIsNoteSuggestionsOpen(false);

      requestAnimationFrame(() => {
        textarea.focus();
        const newCursorPos = start + 1;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        const textBeforeCursor = newText.substring(0, newCursorPos);
        const noteMatch = textBeforeCursor.match(/@([\p{L}\p{N}\s-]*)$/u);
        if (noteMatch) {
          const query = noteMatch[1].toLowerCase();
          let filtered = allNotes.filter(n =>
            (noteToEdit ? n.id !== noteToEdit.id : true) &&
            (n.title.toLowerCase().includes(query) || n.content.toLowerCase().includes(query))
          );
          filtered = filtered.filter(n => n.title && n.title.trim() !== "").slice(0,5);

          if (filtered.length > 0) {
            setCurrentNoteSuggestions(filtered);
            setNoteQueryRange({ start: noteMatch.index!, end: newCursorPos });
            setIsNoteSuggestionsOpen(true);
          }
        }
      });
    }
  };

  return (
    <div className="bg-card p-4 rounded-lg border border-border shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <Popover open={isTagSuggestionsOpen} onOpenChange={setIsTagSuggestionsOpen}>
            <PopoverTrigger asChild>
              <div/>
            </PopoverTrigger>
            <PopoverContent
              className="w-[--radix-popover-trigger-width] p-0 max-h-60 overflow-auto shadow-lg"
              side="bottom"
              align="start"
              onOpenAutoFocus={(e) => e.preventDefault()}
              onCloseAutoFocus={(e) => e.preventDefault()}
              style={{
                width: textareaRef.current ? `${textareaRef.current.offsetWidth}px` : 'auto',
              }}
            >
              {currentTagSuggestions.map((tag) => (
                <Button
                  key={tag}
                  variant="ghost"
                  className="w-full justify-start rounded-none px-3 py-1.5 text-sm font-normal h-auto"
                  onClick={() => handleSelectTag(tag)}
                >
                  #{tag}
                </Button>
              ))}
            </PopoverContent>
          </Popover>

          <Popover open={isNoteSuggestionsOpen} onOpenChange={setIsNoteSuggestionsOpen}>
            <PopoverTrigger asChild>
              <div/>
            </PopoverTrigger>
            <PopoverContent
              className="w-[--radix-popover-trigger-width] p-0 max-h-60 overflow-auto shadow-lg"
              side="bottom"
              align="start"
              onOpenAutoFocus={(e) => e.preventDefault()}
              onCloseAutoFocus={(e) => e.preventDefault()}
              style={{
                width: textareaRef.current ? `${textareaRef.current.offsetWidth}px` : 'auto',
              }}
            >
              {currentNoteSuggestions.map((note) => (
                <Button
                  key={note.id}
                  variant="ghost"
                  className="w-full justify-start rounded-none px-3 py-1.5 text-sm font-normal h-auto text-left"
                  onClick={() => handleSelectNoteSuggestion(note)}
                >
                  <div className="truncate">
                    <span className="font-medium">
                      {note.title || `ID: ${note.id.substring(0,8)}...`}
                    </span>
                    <br/>
                    <span className="text-xs text-muted-foreground">
                       {note.title ? note.content.substring(0, 50) + (note.content.length > 50 ? '...' : '') : (note.content.length > 50 ? note.content.substring(0, 50) + '...' : note.content || 'No content')}
                    </span>
                  </div>
                </Button>
              ))}
            </PopoverContent>
          </Popover>

          <Textarea
            ref={textareaRef}
            value={content}
            onChange={handleTextareaChange}
            placeholder="现在的想法是..."
            rows={3}
            className="resize-none focus:ring-primary focus:border-primary text-sm p-3 pr-12 block w-full border-none focus:ring-0"
            aria-label="Note content"
            disabled={isLoading}
            onBlur={() => {
              setTimeout(() => {
                if (!document.activeElement?.closest('[data-radix-popper-content-wrapper]')) {
                   setIsTagSuggestionsOpen(false);
                   setIsNoteSuggestionsOpen(false);
                }
              }, 150);
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 text-muted-foreground hover:text-primary h-8 w-8"
            onClick={() => console.log("O logo clicked")}
            disabled={isLoading}
            aria-label="Open AI options"
          >
            <Globe className="h-5 w-5" />
          </Button>
        </div>


        {imagePreview && (
          <div className="relative group rounded-md overflow-hidden border border-muted shadow-sm max-w-xs">
            <Image
              src={imagePreview}
              alt="Selected image preview"
              width={200}
              height={200}
              className="w-full h-auto max-h-48 object-contain rounded-md"
              data-ai-hint="note image"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity rounded-full h-6 w-6 p-1"
              onClick={removeImage}
              aria-label="Remove image"
              disabled={isLoading}
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-primary h-7 w-7" disabled={isLoading} onClick={() => fileInputRef.current?.click()}>
              <ImagePlus className="h-4 w-4" />
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              aria-label="Upload image"
              disabled={isLoading}
            />
            <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-primary h-7 w-7" disabled={isLoading} onClick={handleInsertHashtag} aria-label="Insert hashtag">
              <Hash className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-primary h-7 w-7" disabled={isLoading} aria-label="Format text"><Type className="h-4 w-4" /></Button>
            <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-primary h-7 w-7" disabled={isLoading} aria-label="Create list"><List className="h-4 w-4" /></Button>
            <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-primary h-7 w-7" disabled={isLoading} onClick={handleInsertAtSymbol} aria-label="Mention user or link note"><AtSign className="h-4 w-4" /></Button>
          </div>
          <div className="flex items-center space-x-2">
            {noteToEdit && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleCancel}
                disabled={isLoading}
                className="text-muted-foreground hover:text-primary h-8 px-3 text-xs"
                aria-label="Cancel edit"
              >
                <RotateCcw className="mr-1.5 h-3 w-3" />
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isLoading || (!content.trim() && !imagePreview)}
              className="bg-primary hover:bg-accent text-primary-foreground h-8 w-8 p-0 rounded-md"
              size="icon"
              aria-label={noteToEdit ? "Update note" : "Save note"}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

    
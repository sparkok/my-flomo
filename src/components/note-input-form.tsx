
"use client";

import { useState, useRef, useEffect, type ChangeEvent, type FormEvent } from "react";
import type { Note } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, ImagePlus, XCircle, RotateCcw, Hash, Type, List, AtSign, Globe } from "lucide-react";
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";

interface NoteInputFormProps {
  onSaveNote: (data: { content: string; imageDataUri?: string }, noteIdToUpdate?: string) => Promise<void>;
  isLoading: boolean;
  noteToEdit: Note | null;
  onCancelEdit: () => void;
}

export default function NoteInputForm({ onSaveNote, isLoading, noteToEdit, onCancelEdit }: NoteInputFormProps) {
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null); // Ref for the textarea
  const { toast } = useToast();

  useEffect(() => {
    if (noteToEdit) {
      setContent(noteToEdit.content);
      setImagePreview(noteToEdit.imageDataUri || null);
      setImageFile(null); // Clear any staged new image file
      textareaRef.current?.focus(); // Focus textarea when editing
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
      // If no file is selected, and we are editing, revert to the original image if it exists
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
    if (!content.trim() && !imageFile && !imagePreview) { // Check imagePreview as well for existing images
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
    } else if (imagePreview) { // If no new file, but there's a preview (could be from noteToEdit)
       finalImageDataUri = imagePreview;
    }

    await onSaveNote({ content, imageDataUri: finalImageDataUri }, noteToEdit?.id);

    if (!noteToEdit) { // Only clear if it's a new note, not an edit
        setContent("");
        removeImage();
    }
    // For edits, the form is cleared by the useEffect when noteToEdit becomes null
  };

  const handleCancel = () => {
    onCancelEdit();
    // Form clearing is handled by useEffect when noteToEdit changes
  };

  const handleInsertHashtag = () => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.substring(0, start) + "#" + content.substring(end);
      setContent(newContent);

      // After state update, focus and set cursor position
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(start + 1, start + 1);
      });
    }
  };

  return (
    <div className="bg-card p-4 rounded-lg border border-border shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <Textarea
            ref={textareaRef} // Assign ref here
            value={content}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
            placeholder="现在的想法是..."
            rows={3}
            className="resize-none focus:ring-primary focus:border-primary text-sm p-3 pr-12 block w-full border-none focus:ring-0"
            aria-label="Note content"
            disabled={isLoading}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 text-muted-foreground hover:text-primary h-8 w-8"
            onClick={() => console.log("O logo clicked")} // Placeholder action
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
            <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-primary h-7 w-7" disabled={isLoading} aria-label="Mention user"><AtSign className="h-4 w-4" /></Button>
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
              disabled={isLoading || (!content.trim() && !imagePreview)} // Disable if no content and no image
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

    
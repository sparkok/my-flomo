
"use client";

import { useState, useRef, useEffect } from "react";
import type { ChangeEvent, FormEvent } from "react";
import type { Note } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, Loader2, ImagePlus, XCircle, RotateCcw } from "lucide-react";
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
  const { toast } = useToast();

  useEffect(() => {
    if (noteToEdit) {
      setContent(noteToEdit.content);
      setImagePreview(noteToEdit.imageDataUri || null);
      setImageFile(null); // Reset file input, user must re-select to change image
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
      // This case might not be hit if browser doesn't allow selecting "no file"
      // but it's good for completeness.
      setImageFile(null);
      setImagePreview(noteToEdit?.imageDataUri || null); // Revert to original if clearing selection
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
    if (!content.trim() && !imageFile && !imagePreview) { // Check imagePreview for existing images
        toast({
            title: "Empty Note",
            description: "Cannot save an empty note without content or an image.",
            variant: "destructive",
        });
        return;
    }
    
    let finalImageDataUri: string | undefined = undefined;
    if (imageFile) { // New image selected
      finalImageDataUri = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });
    } else if (imagePreview) { // Existing image is kept (or was just removed and preview is now null)
       finalImageDataUri = imagePreview;
    }
    // If imagePreview is null (either never had one, or it was removed via XCircle), finalImageDataUri will be undefined.
    
    await onSaveNote({ content, imageDataUri: finalImageDataUri }, noteToEdit?.id);
    
    // onSaveNote in parent will call setNoteToEdit(null), which triggers useEffect to clear form.
    // If it wasn't an edit, we clear fields directly.
    if (!noteToEdit) {
        setContent("");
        removeImage();
    }
  };

  const handleCancel = () => {
    onCancelEdit(); 
    // Form fields will be reset by useEffect watching noteToEdit
  };

  return (
    <Card className="shadow-lg rounded-lg overflow-hidden">
      <CardHeader className="bg-muted/50">
        <CardTitle className="text-xl text-primary">
          {noteToEdit ? "Edit Note" : "Capture a new thought"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            value={content}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
            placeholder="What's on your mind? Type your note here..."
            rows={4}
            className="resize-none focus:ring-primary focus:border-primary text-base"
            aria-label="Note content"
            disabled={isLoading}
          />

          {imagePreview && (
            <div className="relative group rounded-md overflow-hidden border border-muted shadow-sm">
              <Image 
                src={imagePreview} 
                alt="Selected image preview" 
                width={200} 
                height={200} 
                className="w-full h-auto max-h-72 object-contain rounded-md"
                data-ai-hint="note image" 
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-full h-8 w-8"
                onClick={removeImage}
                aria-label="Remove image"
                disabled={isLoading}
              >
                <XCircle className="h-5 w-5" />
              </Button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="w-full sm:w-auto rounded-md"
              >
                <ImagePlus className="mr-2 h-4 w-4" />
                {imagePreview ? "Change Image" : "Add Image"}
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
              {noteToEdit && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="w-full sm:w-auto rounded-md"
                  aria-label="Cancel edit"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              )}
            </div>
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto rounded-md">
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {isLoading ? (noteToEdit ? "Updating..." : "Saving...") : (noteToEdit ? "Update Note" : "Save Note")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

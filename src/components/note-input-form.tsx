"use client";

import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface NoteInputFormProps {
  onAddNote: (content: string) => Promise<void>;
  isLoading: boolean;
}

export default function NoteInputForm({ onAddNote, isLoading }: NoteInputFormProps) {
  const [content, setContent] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    await onAddNote(content);
    setContent(""); 
  };

  return (
    <Card className="shadow-lg rounded-lg overflow-hidden">
      <CardHeader className="bg-muted/50">
        <CardTitle className="text-xl text-primary">Capture a new thought</CardTitle>
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
          <Button type="submit" disabled={isLoading} className="w-full sm:w-auto rounded-md">
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            {isLoading ? "Saving..." : "Save Note"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

"use client";

import type { Note } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExportNotesButtonProps {
  notes: Note[];
}

export default function ExportNotesButton({ notes }: ExportNotesButtonProps) {
  const { toast } = useToast();

  const handleExport = () => {
    if (notes.length === 0) {
      toast({
        title: "No Notes to Export",
        description: "There are no notes to export.",
        variant: "default"
      });
      return;
    }

    const dataStr = JSON.stringify(notes.map(note => ({
      ...note,
      createdAt: note.createdAt.toISOString() // Ensure date is in standard format
    })), null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const exportFileDefaultName = `flownotes_export_${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.href = URL.createObjectURL(dataBlob);
    linkElement.download = exportFileDefaultName;
    document.body.appendChild(linkElement); // Required for Firefox
    linkElement.click();
    document.body.removeChild(linkElement);
    URL.revokeObjectURL(linkElement.href); // Clean up

    toast({
      title: "Export Successful",
      description: `Your notes have been exported to ${exportFileDefaultName}.`,
    });
  };

  return (
    <Button onClick={handleExport} variant="outline" size="default" className="rounded-md">
      <Download className="mr-2 h-4 w-4" />
      Export Notes
    </Button>
  );
}

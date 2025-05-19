
"use client";

import type { Note } from "@/lib/types";
// import { Button } from "@/components/ui/button"; // No longer a full button
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
      createdAt: note.createdAt.toISOString() 
    })), null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const exportFileDefaultName = `ShareOk_notes_${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.href = URL.createObjectURL(dataBlob);
    linkElement.download = exportFileDefaultName;
    document.body.appendChild(linkElement); 
    linkElement.click();
    document.body.removeChild(linkElement);
    URL.revokeObjectURL(linkElement.href); 

    toast({
      title: "Export Successful",
      description: `Notes exported to ${exportFileDefaultName}.`,
    });
  };

  return (
    <button 
      onClick={handleExport} 
      className="text-xs text-muted-foreground hover:text-primary flex items-center"
    >
      <Download className="mr-1 h-3.5 w-3.5" />
      导出
    </button>
  );
}


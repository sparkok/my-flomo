
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from 'date-fns';
import { RefreshCw, Search, Settings2 } from "lucide-react";

interface MainHeaderProps {
  currentDate: Date | null;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
}

export default function MainHeader({
  currentDate,
  searchTerm,
  onSearchTermChange,
}: MainHeaderProps) {
  return (
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
          placeholder="Search notes... (Ctrl+K)"
          className="pl-8 pr-2 py-1 h-8 text-sm rounded-md w-full focus-visible:ring-primary"
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
        />
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
          <Settings2 className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}

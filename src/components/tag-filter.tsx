import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tag } from "lucide-react";

interface TagFilterProps {
  allTags: string[];
  activeTags: Set<string>;
  onToggleTag: (tag: string) => void;
}

export default function TagFilter({ allTags, activeTags, onToggleTag }: TagFilterProps) {
  if (allTags.length === 0) {
    return <p className="text-sm text-muted-foreground p-4 text-center">No tags available yet. Add notes with tags to see them here.</p>;
  }

  return (
    <ScrollArea className="h-auto max-h-80"> {/* Increased max-height */}
      <div className="flex flex-wrap gap-2 p-1">
        {allTags.map(tag => (
          <Badge
            key={tag}
            variant={activeTags.has(tag) ? "default" : "outline"}
            onClick={() => onToggleTag(tag)}
            className={`cursor-pointer transition-all duration-150 ease-in-out hover:shadow-md
              ${activeTags.has(tag) ? 'bg-accent text-accent-foreground hover:bg-accent/90 shadow-md' : 'border-accent text-accent hover:bg-accent/10'}
              px-3 py-1.5 text-sm rounded-full flex items-center gap-1`}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onToggleTag(tag); }}
            aria-pressed={activeTags.has(tag)}
            aria-label={`Filter by tag: ${tag}`}
          >
            <Tag className="h-3.5 w-3.5" />
            {tag}
          </Badge>
        ))}
      </div>
    </ScrollArea>
  );
}

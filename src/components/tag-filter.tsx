
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tag, Folder, ChevronDown, ChevronRight } from "lucide-react";

interface TagFilterProps {
  allTags: string[];
  activeTags: Set<string>;
  onToggleTag: (tag: string) => void;
}

interface TagTreeNode {
  name: string;
  fullPath: string;
  isActualTag: boolean;
  children: Map<string, TagTreeNode>;
}

function buildTagTree(allTags: string[]): Map<string, TagTreeNode> {
  const root = new Map<string, TagTreeNode>();
  const allTagSet = new Set(allTags);

  // Sort to ensure parent paths are processed before their children
  const sortedTags = [...allTags].sort();

  for (const tag of sortedTags) {
    let currentLevelMap = root;
    const parts = tag.split('/');
    let currentPath = "";

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      let currentNode: TagTreeNode;
      if (!currentLevelMap.has(part)) {
        currentNode = {
          name: part,
          fullPath: currentPath,
          isActualTag: allTagSet.has(currentPath),
          children: new Map<string, TagTreeNode>(),
        };
        currentLevelMap.set(part, currentNode);
      } else {
        currentNode = currentLevelMap.get(part)!;
        // Ensure isActualTag is true if this path was explicitly added as a tag
        if (allTagSet.has(currentPath)) {
          currentNode.isActualTag = true;
        }
        // Ensure fullPath is correct (it should be if sorted, but good for safety)
        currentNode.fullPath = currentPath; 
      }
      currentLevelMap = currentNode.children;
    }
  }
  return root;
}

const RenderTagNode: React.FC<{
  node: TagTreeNode;
  level: number;
  activeTags: Set<string>;
  onToggleTag: (tag: string) => void;
}> = ({ node, level, activeTags, onToggleTag }) => {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const hasChildren = node.children.size > 0;

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleContentClick = () => {
    if (node.isActualTag) {
      onToggleTag(node.fullPath);
    } else if (hasChildren) {
      setIsExpanded(!isExpanded); // Clicking a folder name also toggles expansion
    }
  };
  
  const isNodeOrDescendantActive = React.useMemo(() => {
    if (activeTags.has(node.fullPath) && node.isActualTag) return true;
    if (!hasChildren) return false;

    const queue = Array.from(node.children.values());
    while(queue.length > 0) {
        const current = queue.shift()!;
        if (current.isActualTag && activeTags.has(current.fullPath)) return true;
        current.children.forEach(child => queue.push(child));
    }
    return false;
  }, [node, activeTags, hasChildren]);


  const nodeIsActive = node.isActualTag && activeTags.has(node.fullPath);

  return (
    <div style={{ paddingLeft: level > 0 ? `${level * 0.5}rem` : '0' }} className="my-0.5">
      <div
        className={cn(
          "flex items-center gap-1.5 py-1 px-2 rounded-md group",
          (node.isActualTag || hasChildren) && "cursor-pointer hover:bg-accent/10",
          nodeIsActive && "bg-accent/20"
        )}
        onClick={handleContentClick}
        role={node.isActualTag || hasChildren ? "button" : undefined}
        tabIndex={node.isActualTag || hasChildren ? 0 : undefined}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleContentClick();
          }
        }}
        aria-pressed={node.isActualTag ? nodeIsActive : undefined}
        aria-expanded={hasChildren ? isExpanded : undefined}
      >
        {hasChildren ? (
          <Button
            variant="ghost"
            size="sm"
            className="p-0 h-6 w-6 hover:bg-accent/20 data-[state=open]:bg-accent/10"
            onClick={handleToggleExpand}
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        ) : (
          <div className="w-6 shrink-0"></div> // Placeholder for alignment
        )}

        {node.isActualTag && (
          <Tag className={cn("h-3.5 w-3.5 shrink-0", nodeIsActive || isNodeOrDescendantActive ? "text-accent" : "text-muted-foreground")} />
        )}
        {!node.isActualTag && hasChildren && (
          <Folder className={cn("h-3.5 w-3.5 shrink-0", isNodeOrDescendantActive ? "text-accent" : "text-muted-foreground")} />
        )}
        {/* Fallback for items that are somehow neither (e.g. empty string parts if tag is ///) */}
        {!node.isActualTag && !hasChildren && <div className="w-[14px] shrink-0"></div> }


        <span className={cn(
          "truncate text-sm",
          nodeIsActive ? "text-accent font-semibold" : (isNodeOrDescendantActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")
        )}>
          {node.name}
        </span>
      </div>

      {isExpanded && hasChildren && (
        <div className="mt-0.5">
          {Array.from(node.children.values()).map(childNode => (
            <RenderTagNode
              key={childNode.fullPath}
              node={childNode}
              level={level + 1}
              activeTags={activeTags}
              onToggleTag={onToggleTag}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function TagFilter({ allTags, activeTags, onToggleTag }: TagFilterProps) {
  const tagTree = React.useMemo(() => buildTagTree(allTags), [allTags]);

  if (tagTree.size === 0) {
    return <p className="text-sm text-muted-foreground p-4 text-center">No tags available yet. Add notes with tags to see them here.</p>;
  }

  return (
    <ScrollArea className="h-auto max-h-96"> {/* Increased max-height */}
      <div className="p-1 space-y-0.5">
        {Array.from(tagTree.values()).map(rootNode => (
          <RenderTagNode
            key={rootNode.fullPath}
            node={rootNode}
            level={0}
            activeTags={activeTags}
            onToggleTag={onToggleTag}
          />
        ))}
      </div>
    </ScrollArea>
  );
}


"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
// ScrollArea might not be needed if sidebar itself handles scrolling.
// import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tag, Folder, ChevronDown, ChevronRight, type LucideIcon } from "lucide-react";

interface TagFilterProps {
  allTags: string[];
  activeTags: Set<string>;
  onToggleTag: (tag: string) => void;
  specialTagsConfig?: { name: string; icon: LucideIcon }[];
}

interface TagTreeNode {
  name: string;
  fullPath: string;
  isActualTag: boolean;
  children: Map<string, TagTreeNode>;
  isSpecial: boolean;
  icon?: LucideIcon;
}

function buildTagTree(allTags: string[], specialTagsConfig?: { name: string; icon: LucideIcon }[]): Map<string, TagTreeNode> {
  const root = new Map<string, TagTreeNode>();
  const allTagSet = new Set(allTags);
  const specialTagMap = new Map(specialTagsConfig?.map(st => [st.name, st.icon]));

  const sortedTags = [...allTags].sort();

  for (const tag of sortedTags) {
    let currentLevelMap = root;
    const parts = tag.split('/');
    let currentPath = "";
    const isSpecialRoot = specialTagMap.has(parts[0]) && parts.length === 1;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isCurrentPathSpecial = specialTagMap.has(currentPath) && currentPath === tag;


      let currentNode: TagTreeNode;
      if (!currentLevelMap.has(part)) {
        currentNode = {
          name: part,
          fullPath: currentPath,
          isActualTag: allTagSet.has(currentPath),
          children: new Map<string, TagTreeNode>(),
          isSpecial: isCurrentPathSpecial,
          icon: isCurrentPathSpecial ? specialTagMap.get(currentPath) : (i === 0 && specialTagMap.has(part) ? specialTagMap.get(part) : undefined),
        };
        currentLevelMap.set(part, currentNode);
      } else {
        currentNode = currentLevelMap.get(part)!;
        if (allTagSet.has(currentPath)) {
          currentNode.isActualTag = true;
        }
        if (isCurrentPathSpecial) {
          currentNode.isSpecial = true;
          currentNode.icon = specialTagMap.get(currentPath);
        }
         // Ensure fullPath is correct
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
  const [isExpanded, setIsExpanded] = React.useState(true); // Default to expanded
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
      setIsExpanded(!isExpanded); 
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
  const NodeIcon = node.icon || (node.isActualTag ? Tag : (hasChildren ? Folder : Tag));


  return (
    <div style={{ paddingLeft: level > 0 ? `${level * 0.75}rem` : '0' }} className="my-0.5">
      <div
        className={cn(
          "flex items-center gap-1.5 py-1.5 px-2 rounded-md group text-sm",
          (node.isActualTag || hasChildren) && "cursor-pointer hover:bg-sidebar-accent",
          nodeIsActive && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
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
            className="p-0 h-5 w-5 hover:bg-transparent text-muted-foreground group-hover:text-sidebar-accent-foreground data-[state=open]:bg-transparent -ml-1"
            onClick={handleToggleExpand}
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </Button>
        ) : (
          <div className="w-4 shrink-0"></div> // Placeholder for alignment
        )}

        <NodeIcon className={cn("h-3.5 w-3.5 shrink-0", nodeIsActive || isNodeOrDescendantActive ? "text-primary" : "text-muted-foreground group-hover:text-sidebar-accent-foreground")} />
        
        <span className={cn(
          "truncate",
          nodeIsActive ? "text-sidebar-accent-foreground" : (isNodeOrDescendantActive && !hasChildren ? "text-foreground" : "text-muted-foreground group-hover:text-sidebar-accent-foreground")
        )}>
          {node.name}
        </span>
      </div>

      {isExpanded && hasChildren && (
        <div className="mt-0.5">
          {Array.from(node.children.values())
            .sort((a,b) => a.name.localeCompare(b.name)) // Sort children alphabetically
            .map(childNode => (
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

export default function TagFilter({ allTags, activeTags, onToggleTag, specialTagsConfig }: TagFilterProps) {
  const tagTree = React.useMemo(() => buildTagTree(allTags, specialTagsConfig), [allTags, specialTagsConfig]);

  const regularNodes = Array.from(tagTree.values()).filter(node => !specialTagsConfig?.some(sc => sc.name === node.name && node.children.size === 0));
  const specialNodes = Array.from(tagTree.values()).filter(node => specialTagsConfig?.some(sc => sc.name === node.name && node.children.size === 0));


  if (tagTree.size === 0) {
    return <p className="text-xs text-muted-foreground p-2 text-center">No tags yet.</p>;
  }

  return (
    // The parent div in page.tsx handles scrolling: flex-grow overflow-y-auto
    <div className="space-y-0.5">
      {/* Render regular tags/folders first */}
      {regularNodes
        .sort((a,b) => a.name.localeCompare(b.name))
        .map(rootNode => (
        <RenderTagNode
          key={rootNode.fullPath}
          node={rootNode}
          level={0}
          activeTags={activeTags}
          onToggleTag={onToggleTag}
        />
      ))}
      {/* Render special tags at the bottom */}
      {specialNodes.length > 0 && regularNodes.length > 0 && <div className="pt-2" />}
      {specialNodes
         .sort((a,b) => { // Sort special tags based on the order in specialTagsConfig
            const indexA = specialTagsConfig?.findIndex(sc => sc.name === a.name) ?? -1;
            const indexB = specialTagsConfig?.findIndex(sc => sc.name === b.name) ?? -1;
            return indexA - indexB;
          })
        .map(rootNode => (
         <RenderTagNode
           key={rootNode.fullPath}
           node={rootNode}
           level={0}
           activeTags={activeTags}
           onToggleTag={onToggleTag}
         />
      ))}
    </div>
  );
}

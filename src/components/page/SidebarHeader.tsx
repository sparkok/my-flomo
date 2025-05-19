
"use client";

import type { User } from "firebase/auth";
import type { Note } from "@/lib/types";
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ActivityHeatmap from "@/components/ActivityHeatmap";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User as UserIcon, Settings } from 'lucide-react';

interface SidebarHeaderProps {
  currentUser: User | null;
  effectiveDataStorageMode: string;
  notes: Note[];
  allTagsCount: number;
  currentDate: Date | null;
  getUserInitials: () => string;
  onOpenPreferences: () => void; // New prop to open preferences dialog
}

export default function SidebarHeader({
  currentUser,
  effectiveDataStorageMode,
  notes,
  allTagsCount,
  currentDate,
  getUserInitials,
  onOpenPreferences,
}: SidebarHeaderProps) {
  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-md text-xs font-bold">PRO</div>
          {currentUser && effectiveDataStorageMode === 'database' ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center space-x-2 group cursor-pointer" role="button" tabIndex={0} aria-label="User menu">
                  <Avatar className="h-7 w-7 border-2 border-transparent group-hover:border-primary transition-colors">
                    <AvatarImage src={currentUser.photoURL || undefined} alt={currentUser.displayName || currentUser.email || "User"} />
                    <AvatarFallback className="text-xs bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <h1
                    className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors truncate max-w-[120px] font-kaiti"
                    title={currentUser.displayName || currentUser.email || "User"}
                  >
                    {currentUser.displayName || currentUser.email}
                  </h1>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="start">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/profile" passHref legacyBehavior>
                  <DropdownMenuItem asChild>
                    <a><UserIcon className="mr-2 h-4 w-4" />Profile</a>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem onClick={onOpenPreferences}>
                  <Settings className="mr-2 h-4 w-4" />
                  偏好设置
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
             <h1 className="text-xl font-semibold text-foreground font-kaiti">ShareOk</h1>
          )}
        </div>
      </div>

      <div className="flex justify-around text-center text-xs text-muted-foreground pt-2">
        <div><p className="text-lg font-medium text-foreground">{notes.length}</p><p>笔记</p></div>
        <div><p className="text-lg font-medium text-foreground">{allTagsCount}</p><p>标签</p></div>
        <div><p className="text-lg font-medium text-foreground">1183</p><p>天</p></div>
      </div>

      <ActivityHeatmap notes={notes} currentDate={currentDate} />
    </>
  );
}

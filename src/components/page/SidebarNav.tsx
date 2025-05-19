
"use client";

import type { User } from "firebase/auth";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import TagFilter from "@/components/tag-filter";
import {
  BookCopy,
  CalendarCheck,
  LogIn,
  User as UserIcon,
  LogOut,
  type LucideIcon,
  Package,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";

interface SidebarNavProps {
  currentUser: User | null;
  loadingAuth: boolean;
  effectiveDataStorageMode: string;
  onShowLoginPage: () => void;
  onShowLogoutConfirm: () => void;
  allTags: string[];
  activeTags: Set<string>;
  onToggleTag: (tag: string) => void;
}

const specialTagsConfig: { name: string; icon: LucideIcon }[] = [
    { name: "产品", icon: Package },
    { name: "故障检测", icon: ShieldAlert },
    { name: "成长", icon: TrendingUp },
  ];

export default function SidebarNav({
  currentUser,
  loadingAuth,
  effectiveDataStorageMode,
  onShowLoginPage,
  onShowLogoutConfirm,
  allTags,
  activeTags,
  onToggleTag,
}: SidebarNavProps) {
  return (
    <>
      <Button variant="default" className="w-full bg-primary hover:bg-accent text-primary-foreground justify-start px-3">
        <BookCopy className="mr-2 h-4 w-4" />
        全部笔记
      </Button>

      <nav className="flex flex-col space-y-1 text-sm">
        <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground px-3">
          <CalendarCheck className="mr-2 h-4 w-4" />
          每日回顾
        </Button>
        {!currentUser && !loadingAuth && (
             <Button variant="ghost" onClick={onShowLoginPage} className="w-full justify-start text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground px-3">
                <LogIn className="mr-2 h-4 w-4" />
                Login / Sign Up
             </Button>
        )}
        {currentUser && effectiveDataStorageMode === 'database' && (
          <>
            <Link href="/profile" passHref legacyBehavior>
              <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground px-3">
                <UserIcon className="mr-2 h-4 w-4" />
                Profile
              </Button>
            </Link>
            <Button variant="ghost" onClick={onShowLogoutConfirm} className="w-full justify-start text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground px-3">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </>
        )}
      </nav>

      <Separator className="my-2 bg-sidebar-border"/>

      <div className="flex-grow overflow-y-auto pr-1 -mr-2">
        <h2 className="text-xs font-semibold text-muted-foreground mb-2 px-2 uppercase">全部标签</h2>
        <TagFilter
          allTags={allTags}
          activeTags={activeTags}
          onToggleTag={onToggleTag}
          specialTagsConfig={specialTagsConfig}
        />
      </div>
    </>
  );
}

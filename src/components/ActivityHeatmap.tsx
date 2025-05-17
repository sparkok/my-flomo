
"use client";

import type { Note } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import {
  format,
  addDays,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  subWeeks,
  getMonth,
  isSameDay,
} from 'date-fns';
import { useMemo } from "react";

interface ActivityHeatmapProps {
  notes: Note[];
  currentDate: Date | null; // Added currentDate prop
}

const WEEKS_TO_SHOW = 5;
const DAYS_IN_WEEK = 7;

export default function ActivityHeatmap({ notes, currentDate }: ActivityHeatmapProps) {
  const dayLabels = ['一', '二', '三', '四', '五', '六', '日']; // Mon to Sun

  const { gridDays, activityByDate, monthLabels } = useMemo(() => {
    if (!currentDate) {
      return { gridDays: [], activityByDate: new Map(), monthLabels: [] };
    }

    // Determine the 5-week interval based on currentDate
    // Grid ends on the Sunday of the week containing currentDate
    const lastDayOfGrid = endOfWeek(currentDate, { weekStartsOn: 1 /* Monday */ });
    // Grid starts 5 weeks (minus 1 day) before that, on a Monday
    const firstDayOfGrid = startOfWeek(subWeeks(lastDayOfGrid, WEEKS_TO_SHOW - 1), { weekStartsOn: 1 /* Monday */ });
    
    const daysInterval = eachDayOfInterval({
      start: firstDayOfGrid,
      end: lastDayOfGrid,
    });

    // Ensure we have exactly 35 days, padding if necessary (though eachDayOfInterval should handle it for full weeks)
    const currentGridDays: Date[] = [];
    for (let i = 0; i < WEEKS_TO_SHOW * DAYS_IN_WEEK; i++) {
        if (i < daysInterval.length) {
            currentGridDays.push(daysInterval[i]);
        } else {
            // This case should ideally not happen if interval is correct
            currentGridDays.push(addDays(currentGridDays[currentGridDays.length -1], 1));
        }
    }


    const currentActivityByDate = new Map<string, number>();
    notes.forEach(note => {
      const dateKey = format(note.createdAt, "yyyy-MM-dd");
      currentActivityByDate.set(dateKey, (currentActivityByDate.get(dateKey) || 0) + 1);
    });

    const uniqueMonths = new Set<string>();
    currentGridDays.forEach(day => {
      uniqueMonths.add(format(day, "M月")); // Format as "3月", "4月", etc.
    });
    const currentMonthLabels = Array.from(uniqueMonths);
    // Ensure we show a sensible number of month labels, like in the screenshot
     const displayMonthLabels = currentMonthLabels.slice(-3);


    return { gridDays: currentGridDays, activityByDate: currentActivityByDate, monthLabels: displayMonthLabels };
  }, [notes, currentDate]);

  const getActivityLevel = (date: Date): number => {
    const dateKey = format(date, "yyyy-MM-dd");
    const count = activityByDate.get(dateKey) || 0;
    if (count === 0) return 0;
    if (count === 1) return 1;
    if (count <= 3) return 2; // 2-3 notes
    if (count <= 5) return 3; // 4-5 notes
    return 4; // 6+ notes
  };

  const getLevelColor = (level: number) => {
    switch (level) {
      case 0: return "bg-gray-200 dark:bg-gray-700"; // No activity
      case 1: return "bg-green-200 dark:bg-green-800"; // 1
      case 2: return "bg-green-400 dark:bg-green-600"; // 2-3
      case 3: return "bg-green-600 dark:bg-green-400"; // 4-5
      case 4: return "bg-green-800 dark:bg-green-200"; // 6+
      default: return "bg-gray-100 dark:bg-gray-800";
    }
  };
  
  if (!currentDate) {
    // Render a placeholder or loading state if currentDate is not yet available
    const placeholderDays = Array.from({ length: 35 }).map((_, i) => ({
      id: i,
      level: 0,
    }));
    return (
      <Card className="bg-card shadow-sm border-none">
        <CardContent className="p-3">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayLabels.map(label => (
              <div key={label} className="w-4 h-4 text-xs text-muted-foreground text-center font-medium">{label}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {placeholderDays.map(day => (
              <div
                key={day.id}
                className={`w-4 h-4 rounded-sm ${getLevelColor(day.level)}`}
              />
            ))}
          </div>
          <div className="flex justify-around text-xs text-muted-foreground mt-2 px-1">
            {["月份"].map(label => <span key={label}>{label}</span>)}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card shadow-sm border-none">
      <CardContent className="p-3">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayLabels.map(label => (
            <div key={label} className="w-4 h-4 text-xs text-muted-foreground text-center font-medium">{label}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {gridDays.map((day, index) => {
            const level = getActivityLevel(day);
            const dateKey = format(day, "yyyy-MM-dd");
            return (
              <div
                key={index} // Use index as key if dates can repeat (they shouldn't in this 35-day grid)
                className={`w-4 h-4 rounded-sm ${getLevelColor(level)}`}
                title={`${dateKey}: ${activityByDate.get(dateKey) || 0} notes`}
              />
            );
          })}
        </div>
        {monthLabels.length > 0 && (
          <div className="flex justify-around text-xs text-muted-foreground mt-2 px-1">
            {monthLabels.map(label => <span key={label}>{label}</span>)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

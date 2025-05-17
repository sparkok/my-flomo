"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ActivityHeatmap() {
  // Placeholder data for days in a typical 5-week display for a month
  const days = Array.from({ length: 35 }).map((_, i) => ({
    id: i,
    level: Math.floor(Math.random() * 5), // Random activity level 0-4
  }));

  const getLevelColor = (level: number) => {
    switch (level) {
      case 0: return "bg-gray-200 dark:bg-gray-700"; // No activity
      case 1: return "bg-green-200 dark:bg-green-800";
      case 2: return "bg-green-400 dark:bg-green-600";
      case 3: return "bg-green-600 dark:bg-green-400";
      case 4: return "bg-green-800 dark:bg-green-200";
      default: return "bg-gray-100 dark:bg-gray-800";
    }
  };

  const monthLabels = ["三月", "四月", "五月"]; // Example month labels

  return (
    <Card className="bg-card shadow-sm border-none">
      <CardContent className="p-3">
        <div className="grid grid-cols-7 gap-1 mb-1">
          {days.slice(0, 7*1).map(day => ( // Placeholder for day labels (Mon, Tue, etc.)
            <div key={`day-label-${day.id}`} className="w-4 h-4 text-xs text-muted-foreground text-center"></div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map(day => (
            <div
              key={day.id}
              className={`w-4 h-4 rounded-sm ${getLevelColor(day.level)}`}
              title={`Activity level ${day.level}`}
            />
          ))}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2 px-1">
          {monthLabels.map(label => <span key={label}>{label}</span>)}
        </div>
      </CardContent>
    </Card>
  );
}

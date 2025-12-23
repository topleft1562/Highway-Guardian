import React from 'react';
import { format } from 'date-fns';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, User, FileEdit, PlusCircle, CheckCircle2 } from 'lucide-react';

const actionIcons = {
  created: PlusCircle,
  edited: FileEdit,
  cleared: CheckCircle2,
};

const actionColors = {
  created: 'bg-blue-50 text-blue-700 border-blue-200',
  edited: 'bg-amber-50 text-amber-700 border-amber-200',
  cleared: 'bg-green-50 text-green-700 border-green-200',
};

export default function HistorySheet({ shutdown, open, onOpenChange }) {
  if (!shutdown) return null;

  const activities = shutdown.activity_log || [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md z-[9999]">
        <SheetHeader>
          <SheetTitle>Activity History</SheetTitle>
          <p className="text-sm text-gray-500">{shutdown.title}</p>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-6">
          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Clock className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">No activity history</p>
            </div>
          ) : (
            <div className="space-y-4 pr-4">
              {activities.map((activity, idx) => {
                const Icon = actionIcons[activity.action] || FileEdit;
                const colorClass = actionColors[activity.action] || actionColors.edited;

                return (
                  <div
                    key={idx}
                    className="relative pl-6 pb-4 border-l-2 border-gray-200 last:border-0"
                  >
                    <div className="absolute -left-2.5 top-0">
                      <div className={`p-1.5 rounded-full border-2 border-white ${colorClass}`}>
                        <Icon className="h-3 w-3" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <Badge variant="outline" className={`capitalize ${colorClass}`}>
                          {activity.action}
                        </Badge>
                        <span className="text-xs text-gray-400">
                          {format(new Date(activity.timestamp), 'MMM d, h:mm a')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="h-3.5 w-3.5 text-gray-400" />
                        <span>{activity.user}</span>
                      </div>

                      {activity.details && (
                        <p className="text-sm text-gray-500 mt-1">
                          {activity.details}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
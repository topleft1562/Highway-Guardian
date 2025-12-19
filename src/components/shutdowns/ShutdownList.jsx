import React from 'react';
import { format } from 'date-fns';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  CloudSnow, 
  AlertTriangle, 
  Construction, 
  Calendar, 
  Siren,
  HelpCircle,
  MapPin,
  Clock,
  CheckCircle2
} from 'lucide-react';

const reasonIcons = {
  weather: CloudSnow,
  accident: AlertTriangle,
  construction: Construction,
  event: Calendar,
  emergency: Siren,
  other: HelpCircle
};

const reasonColors = {
  weather: 'bg-blue-50 text-blue-700 border-blue-200',
  accident: 'bg-red-50 text-red-700 border-red-200',
  construction: 'bg-amber-50 text-amber-700 border-amber-200',
  event: 'bg-violet-50 text-violet-700 border-violet-200',
  emergency: 'bg-rose-50 text-rose-700 border-rose-200',
  other: 'bg-gray-50 text-gray-700 border-gray-200'
};

export default function ShutdownList({ 
  shutdowns, 
  onSelect, 
  selectedId, 
  onClear,
  loading 
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
      </div>
    );
  }

  if (shutdowns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <MapPin className="h-12 w-12 mb-3 opacity-30" />
        <p className="text-sm">No shutdowns found</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-280px)]">
      <div className="space-y-2 pr-3">
        {shutdowns.map((shutdown) => {
          const Icon = reasonIcons[shutdown.reason] || HelpCircle;
          const isSelected = selectedId === shutdown.id;
          const isActive = shutdown.status === 'active';

          return (
            <div
              key={shutdown.id}
              onClick={() => onSelect(shutdown)}
              className={`
                p-4 rounded-xl border cursor-pointer transition-all duration-200
                ${isSelected 
                  ? 'border-slate-900 bg-slate-50 shadow-sm' 
                  : 'border-gray-100 hover:border-gray-200 bg-white hover:bg-gray-50'
                }
                ${!isActive ? 'opacity-60' : ''}
              `}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`p-2 rounded-lg ${reasonColors[shutdown.reason]}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm text-gray-900 truncate">
                      {shutdown.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5 capitalize">
                      {shutdown.reason?.replace('_', ' ')}
                      {shutdown.radius_km && ` • ${shutdown.radius_km}km radius`}
                    </p>
                    {shutdown.region && (
                      <p className="text-xs text-gray-400 mt-0.5">{shutdown.region}</p>
                    )}
                  </div>
                </div>
                <Badge 
                  variant="outline" 
                  className={`shrink-0 ${
                    isActive 
                      ? 'bg-red-50 text-red-700 border-red-200' 
                      : 'bg-gray-50 text-gray-500 border-gray-200'
                  }`}
                >
                  {shutdown.status}
                </Badge>
              </div>

              {shutdown.start_time && (
                <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-400">
                  <Clock className="h-3 w-3" />
                  <span>Started {format(new Date(shutdown.start_time), 'MMM d, h:mm a')}</span>
                </div>
              )}

              {isActive && isSelected && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClear(shutdown);
                  }}
                  className="w-full mt-3 text-green-700 border-green-200 hover:bg-green-50"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark as Cleared
                </Button>
              )}

              {!isActive && shutdown.cleared_at && (
                <p className="text-xs text-gray-400 mt-2">
                  Cleared {format(new Date(shutdown.cleared_at), 'MMM d, h:mm a')}
                  {shutdown.cleared_by && ` by ${shutdown.cleared_by}`}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
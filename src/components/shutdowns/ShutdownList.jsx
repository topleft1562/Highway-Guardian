import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Cloud, Flame, AlertTriangle, MapPin } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const reasonIcons = {
  weather: Cloud,
  accident: AlertTriangle,
  fires: Flame
};

const actionColors = {
  shutdown_all: 'bg-red-500 text-white border-red-500',
  shutdown_b_only: 'bg-purple-500 text-white border-purple-500',
  caution: 'bg-yellow-500 text-white border-yellow-500',
  cleared: 'bg-gray-400 text-white border-gray-400'
};

const actionLabels = {
  shutdown_all: 'Shutdown All',
  shutdown_b_only: 'Shutdown B',
  caution: 'Caution'
};

export default function ShutdownList({ 
  shutdowns, 
  onSelect, 
  selectedId, 
  onClear,
  loading,
  onHover
}) {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (error) {
        setCurrentUser({ access_level: 'driver', email: '' });
      }
    };
    fetchUser();
  }, []);

  const userAccessLevel = currentUser?.access_level || currentUser?.role || 'driver';
  const isDriver = userAccessLevel === 'driver';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (shutdowns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <MapPin className="h-12 w-12 mb-3 text-gray-300" />
        <p className="text-sm">No shutdowns found</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 overflow-y-auto h-full">
      {shutdowns.map((shutdown) => {
        const Icon = reasonIcons[shutdown.reason];
        const isActive = shutdown.status === 'active';
        const isSelected = selectedId === shutdown.id;
        const badgeColor = isActive 
          ? actionColors[shutdown.action] || actionColors.shutdown_all
          : actionColors.cleared;
        const actionLabel = isActive 
          ? actionLabels[shutdown.action] || 'Active'
          : 'Cleared';

        return (
          <div
            key={shutdown.id}
            onClick={() => onSelect(shutdown)}
            onMouseEnter={() => onHover?.(shutdown)}
            onMouseLeave={() => onHover?.(null)}
            className={`
              p-3 rounded-lg border transition-all cursor-pointer relative
              ${isSelected 
                ? 'bg-slate-50 border-slate-300 shadow-sm' 
                : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }
              ${!isActive && 'opacity-60'}
            `}
          >
            <Badge 
              variant="outline" 
              className={`absolute top-2 right-2 text-xs ${badgeColor}`}
            >
              {actionLabel}
            </Badge>
            
            <div className="flex items-start gap-2 pr-24">
              {Icon && <Icon className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 text-sm mb-1 truncate">
                  {shutdown.title}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 overflow-hidden">
                  <span className="capitalize shrink-0">{shutdown.reason}</span>
                  {shutdown.region && (
                    <>
                      <span className="shrink-0">·</span>
                      <span className="truncate">{shutdown.region}</span>
                    </>
                  )}
                  <span className="shrink-0">·</span>
                  <span className="shrink-0">{format(new Date(shutdown.created_date), 'MMM d, h:mm a')}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
import React from 'react';
import { format } from 'date-fns';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle2, 
  MapPin, 
  Clock, 
  User,
  FileText,
  Trash2,
  Pencil
} from 'lucide-react';

export default function ShutdownDetails({ 
  shutdown, 
  open, 
  onOpenChange, 
  onClear,
  onDelete,
  onEdit,
  loading 
}) {
  if (!shutdown) return null;

  const isActive = shutdown.status === 'active';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md z-[9999]">
        <SheetHeader>
          <div className="flex items-start justify-between">
            <SheetTitle className="text-lg pr-8">{shutdown.title}</SheetTitle>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="flex items-center gap-3">
            <Badge 
              variant="outline" 
              className={`${
                isActive 
                  ? 'bg-red-50 text-red-700 border-red-200' 
                  : 'bg-gray-50 text-gray-500 border-gray-200'
              }`}
            >
              {shutdown.status}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {shutdown.reason?.replace('_', ' ')}
            </Badge>
            {shutdown.region && (
              <Badge variant="outline">{shutdown.region}</Badge>
            )}
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Location</p>
                <p className="text-sm text-gray-600">
                  {shutdown.center_lat?.toFixed(4)}, {shutdown.center_lng?.toFixed(4)}
                </p>
                {shutdown.radius_km && (
                  <p className="text-sm text-gray-500">{shutdown.radius_km}km radius</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Created</p>
                <p className="text-sm text-gray-600">
                  {format(new Date(shutdown.created_date), 'PPp')}
                </p>
              </div>
            </div>

            {shutdown.notes && (
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Notes</p>
                  <p className="text-sm text-gray-600">{shutdown.notes}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Created by</p>
                <p className="text-sm text-gray-600">{shutdown.created_by}</p>
                <p className="text-xs text-gray-400">
                  {format(new Date(shutdown.created_date), 'PPp')}
                </p>
              </div>
            </div>

            {!isActive && shutdown.cleared_at && (
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Cleared</p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(shutdown.cleared_at), 'PPp')}
                  </p>
                  {shutdown.cleared_by && (
                    <p className="text-xs text-gray-400">by {shutdown.cleared_by}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-3">
            {isActive && (
              <>
                <Button
                  onClick={() => onEdit(shutdown)}
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Shutdown
                </Button>
                <Button
                  onClick={() => onClear(shutdown)}
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark as Cleared
                </Button>
              </>
            )}
            
            <Button
              variant="outline"
              onClick={() => onDelete(shutdown)}
              disabled={loading}
              className="w-full text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Permanently
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
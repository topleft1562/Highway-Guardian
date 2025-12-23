import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, MapPin, Route } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const provinces = [
  'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick',
  'Newfoundland and Labrador', 'Northwest Territories', 'Nova Scotia',
  'Nunavut', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan', 'Yukon'
];

const initialFormData = {
  title: '',
  city: '',
  radius_km: '200',
  from_city: '',
  to_city: '',
  reason: 'weather',
  action: 'shutdown_all',
  notes: ''
};

export default function AddShutdownDialog({ open, onOpenChange, onAdd, loading, editData }) {
  const [mode, setMode] = useState('city');
  const [processing, setProcessing] = useState(false);
  const [formData, setFormData] = useState(initialFormData);

  React.useEffect(() => {
    if (open && !editData) {
      setFormData(initialFormData);
      setMode('city');
      setProcessing(false);
    } else if (editData) {
      setFormData({
        title: editData.title || '',
        city: '',
        radius_km: editData.radius_km?.toString() || '200',
        from_city: editData.from_city || '',
        to_city: editData.to_city || '',
        reason: editData.reason || 'weather',
        action: editData.action || 'shutdown_all',
        notes: editData.notes || ''
      });
      setMode(editData.geometry_type === 'line' ? 'road' : 'city');
    }
  }, [open, editData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);

    try {
      const user = await base44.auth.me();
      
      if (editData) {
        // Edit mode - track what changed
        const changes = [];
        if (formData.title !== editData.title) changes.push('title');
        if (formData.reason !== editData.reason) changes.push('reason');
        if (formData.action !== editData.action) changes.push('action');
        if (formData.notes !== editData.notes) changes.push('notes');
        if (mode === 'road') {
          if (formData.from_city !== editData.from_city) changes.push('from city');
          if (formData.to_city !== editData.to_city) changes.push('to city');
        } else if (parseFloat(formData.radius_km) !== editData.radius_km) {
          changes.push('radius');
        }
        
        const activityLog = editData.activity_log || [];
        activityLog.push({
          action: 'edited',
          user: user.email,
          timestamp: new Date().toISOString(),
          details: changes.length > 0 ? `Updated ${changes.join(', ')}` : 'No changes made'
        });

        if (mode === 'road' && formData.from_city && formData.to_city) {
          // Re-geocode the cities for road type
          const response = await base44.integrations.Core.InvokeLLM({
            prompt: `Geocode these two Canadian cities: "${formData.from_city}" and "${formData.to_city}". Return coordinates for both.`,
            add_context_from_internet: true,
            response_json_schema: {
              type: "object",
              properties: {
                from_city: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    province: { type: "string" },
                    latitude: { type: "number" },
                    longitude: { type: "number" }
                  }
                },
                to_city: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    province: { type: "string" },
                    latitude: { type: "number" },
                    longitude: { type: "number" }
                  }
                }
              }
            }
          });

          const data = {
            title: formData.title || `${response.from_city.name} to ${response.to_city.name}`,
            coordinates: [
              [response.from_city.latitude, response.from_city.longitude],
              [response.to_city.latitude, response.to_city.longitude]
            ],
            from_city: formData.from_city,
            to_city: formData.to_city,
            reason: formData.reason,
            action: formData.action,
            region: response.from_city.province,
            notes: formData.notes,
            activity_log: activityLog
          };
          await onAdd(data);
        } else {
          // Just update the fields for circle type
          const data = {
            title: formData.title,
            radius_km: parseFloat(formData.radius_km),
            reason: formData.reason,
            action: formData.action,
            notes: formData.notes,
            activity_log: activityLog
          };
          await onAdd(data);
        }
        setProcessing(false);
      } else if (mode === 'city') {
        // Geocode the city
        const response = await base44.integrations.Core.InvokeLLM({
          prompt: `Geocode the following Canadian city: "${formData.city}". Return ONLY the coordinates, nothing else.`,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              city_name: { type: "string" },
              province: { type: "string" },
              latitude: { type: "number" },
              longitude: { type: "number" }
            }
          }
        });

        const data = {
          title: formData.title || `${formData.radius_km}km radius of ${response.city_name}`,
          geometry_type: 'circle',
          center_lat: response.latitude,
          center_lng: response.longitude,
          radius_km: parseFloat(formData.radius_km),
          reason: formData.reason,
          action: formData.action,
          region: response.province,
          notes: formData.notes,
          status: 'active',
          activity_log: [{
            action: 'created',
            user: user.email,
            timestamp: new Date().toISOString(),
            details: `Created shutdown: ${formData.radius_km}km radius of ${response.city_name}`
          }]
        };

        await onAdd(data);
        setProcessing(false);
      } else {
        // Road mode - geocode both cities
        const response = await base44.integrations.Core.InvokeLLM({
          prompt: `Geocode these two Canadian cities: "${formData.from_city}" and "${formData.to_city}". Return coordinates for both.`,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              from_city: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  province: { type: "string" },
                  latitude: { type: "number" },
                  longitude: { type: "number" }
                }
              },
              to_city: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  province: { type: "string" },
                  latitude: { type: "number" },
                  longitude: { type: "number" }
                }
              }
            }
          }
        });

        const data = {
          title: formData.title || `${response.from_city.name} to ${response.to_city.name}`,
          geometry_type: 'line',
          coordinates: [
            [response.from_city.latitude, response.from_city.longitude],
            [response.to_city.latitude, response.to_city.longitude]
          ],
          from_city: formData.from_city,
          to_city: formData.to_city,
          reason: formData.reason,
          action: formData.action,
          region: response.from_city.province,
          notes: formData.notes,
          status: 'active',
          activity_log: [{
            action: 'created',
            user: user.email,
            timestamp: new Date().toISOString(),
            details: `Created road shutdown: ${response.from_city.name} to ${response.to_city.name}`
          }]
        };

        await onAdd(data);
        setProcessing(false);
      }
    } catch (error) {
      toast.error('Failed to geocode location. Please check city names.');
      setProcessing(false);
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] z-[9999] overflow-visible">
        <DialogHeader>
          <DialogTitle>{editData ? 'Edit Shutdown' : 'Add Shutdown'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Mode Toggle - only show when adding new */}
          {!editData && (
            <Tabs value={mode} onValueChange={setMode} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="city" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  City Radius
                </TabsTrigger>
                <TabsTrigger value="road" className="flex items-center gap-2">
                  <Route className="h-4 w-4" />
                  Road Between Cities
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {/* City Mode */}
          {!editData && mode === 'city' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  placeholder="e.g., Winnipeg, Calgary, Toronto"
                  value={formData.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  required
                />
                <p className="text-xs text-gray-500">Enter city name, we'll find the coordinates</p>
              </div>
            </>
          )}

          {/* Road Mode */}
          {mode === 'road' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="from">From City *</Label>
                <Input
                  id="from"
                  placeholder="e.g., Regina"
                  value={formData.from_city}
                  onChange={(e) => updateField('from_city', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="to">To City *</Label>
                <Input
                  id="to"
                  placeholder="e.g., Saskatoon"
                  value={formData.to_city}
                  onChange={(e) => updateField('to_city', e.target.value)}
                  required
                />
              </div>
            </>
          )}

          {/* Radius - show for city mode or when editing a circle */}
          {((!editData && mode === 'city') || (editData && editData.geometry_type === 'circle')) && (
            <div className="space-y-2">
              <Label htmlFor="radius">Radius (km) *</Label>
              <Input
                id="radius"
                type="number"
                step="any"
                placeholder="e.g., 200"
                value={formData.radius_km}
                onChange={(e) => updateField('radius_km', e.target.value)}
                required
              />
            </div>
          )}

          {/* Common Fields */}
          <div className="space-y-2">
            <Label htmlFor="title">Title (optional)</Label>
            <Input
              id="title"
              placeholder="Auto-generated if left blank"
              value={formData.title}
              onChange={(e) => updateField('title', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Reason *</Label>
            <Select 
              value={formData.reason} 
              onValueChange={(v) => updateField('reason', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[99999]">
                <SelectItem value="weather">Weather</SelectItem>
                <SelectItem value="accident">Accident</SelectItem>
                <SelectItem value="fires">Fires</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Action *</Label>
            <Select 
              value={formData.action} 
              onValueChange={(v) => updateField('action', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[99999]">
                <SelectItem value="shutdown_all">Shutdown All (Red)</SelectItem>
                <SelectItem value="shutdown_b_only">Shutdown B Only (Purple)</SelectItem>
                <SelectItem value="caution">Caution (Yellow)</SelectItem>
              </SelectContent>
            </Select>
          </div>



          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional details..."
              value={formData.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={processing || loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={processing || loading}>
              {(processing || loading) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {processing ? 'Geocoding...' : editData ? 'Save Changes' : 'Add Shutdown'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
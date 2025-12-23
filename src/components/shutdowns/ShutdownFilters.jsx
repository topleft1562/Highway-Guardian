import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, Filter } from 'lucide-react';

export default function ShutdownFilters({ 
  search, 
  setSearch, 
  statusFilter, 
  setStatusFilter,
  reasonFilter,
  setReasonFilter,
  regionFilter,
  setRegionFilter,
  regions,
  myShutdownsOnly,
  setMyShutdownsOnly
}) {
  const hasFilters = search || statusFilter !== 'all' || reasonFilter !== 'all' || regionFilter !== 'all' || myShutdownsOnly;

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setReasonFilter('all');
    setRegionFilter('all');
    setMyShutdownsOnly(false);
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search shutdowns..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-white border-gray-200"
        />
      </div>

      <div className="flex items-center gap-2 mb-2">
        <Checkbox 
          id="my-shutdowns" 
          checked={myShutdownsOnly}
          onCheckedChange={setMyShutdownsOnly}
        />
        <label
          htmlFor="my-shutdowns"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
        >
          My shutdowns only
        </label>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[120px] bg-white border-gray-200 h-9 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="cleared">Cleared</SelectItem>
          </SelectContent>
        </Select>

        <Select value={reasonFilter} onValueChange={setReasonFilter}>
          <SelectTrigger className="w-[130px] bg-white border-gray-200 h-9 text-sm">
            <SelectValue placeholder="Reason" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Reasons</SelectItem>
            <SelectItem value="weather">Weather</SelectItem>
            <SelectItem value="accident">Accident</SelectItem>
            <SelectItem value="fires">Fires</SelectItem>
          </SelectContent>
        </Select>

        {regions.length > 0 && (
          <Select value={regionFilter} onValueChange={setRegionFilter}>
            <SelectTrigger className="w-[140px] bg-white border-gray-200 h-9 text-sm">
              <SelectValue placeholder="Region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              {regions.map(region => (
                <SelectItem key={region} value={region}>{region}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {hasFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearFilters}
            className="h-9 text-gray-500"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
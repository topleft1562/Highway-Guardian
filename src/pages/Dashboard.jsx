import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Plus, Map, List, LayoutGrid } from 'lucide-react';
import { toast } from 'sonner';

import ShutdownMap from '../components/map/ShutdownMap';
import ShutdownList from '../components/shutdowns/ShutdownList';
import ShutdownFilters from '../components/shutdowns/ShutdownFilters';
import AddShutdownDialog from '../components/shutdowns/AddShutdownDialog';
import ShutdownDetails from '../components/shutdowns/ShutdownDetails';

export default function Dashboard() {
  const [selectedShutdown, setSelectedShutdown] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingShutdown, setEditingShutdown] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [viewMode, setViewMode] = useState('split'); // 'split', 'map', 'list'
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [reasonFilter, setReasonFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');

  const queryClient = useQueryClient();

  const { data: shutdowns = [], isLoading } = useQuery({
    queryKey: ['shutdowns'],
    queryFn: () => base44.entities.Shutdown.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Shutdown.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shutdowns'] });
      setShowAddDialog(false);
      setEditingShutdown(null);
      toast.success('Shutdown added');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Shutdown.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shutdowns'] });
      setShowDetails(false);
      setShowAddDialog(false);
      setSelectedShutdown(null);
      setEditingShutdown(null);
      toast.success('Shutdown updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Shutdown.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shutdowns'] });
      setShowDetails(false);
      setSelectedShutdown(null);
      toast.success('Shutdown deleted');
    },
  });

  const handleClear = async (shutdown) => {
    const user = await base44.auth.me();
    updateMutation.mutate({
      id: shutdown.id,
      data: {
        status: 'cleared',
        cleared_by: user.email,
        cleared_at: new Date().toISOString()
      }
    });
  };

  const handleDelete = (shutdown) => {
    if (confirm('Delete this shutdown permanently? This cannot be undone.')) {
      deleteMutation.mutate(shutdown.id);
    }
  };

  const handleSelect = (shutdown) => {
    setSelectedShutdown(shutdown);
    setShowDetails(true);
  };

  const handleEdit = (shutdown) => {
    setEditingShutdown(shutdown);
    setShowDetails(false);
    setShowAddDialog(true);
  };

  const handleSave = async (data) => {
    if (editingShutdown) {
      return updateMutation.mutateAsync({
        id: editingShutdown.id,
        data
      });
    } else {
      return createMutation.mutateAsync(data);
    }
  };

  // Get unique regions for filter
  const regions = useMemo(() => {
    const uniqueRegions = [...new Set(shutdowns.map(s => s.region).filter(Boolean))];
    return uniqueRegions.sort();
  }, [shutdowns]);

  // Filter shutdowns
  const filteredShutdowns = useMemo(() => {
    return shutdowns.filter(s => {
      const matchesSearch = !search || 
        s.title?.toLowerCase().includes(search.toLowerCase()) ||
        s.notes?.toLowerCase().includes(search.toLowerCase()) ||
        s.region?.toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
      const matchesReason = reasonFilter === 'all' || s.reason === reasonFilter;
      const matchesRegion = regionFilter === 'all' || s.region === regionFilter;

      return matchesSearch && matchesStatus && matchesReason && matchesRegion;
    });
  }, [shutdowns, search, statusFilter, reasonFilter, regionFilter]);

  const activeCount = shutdowns.filter(s => s.status === 'active').length;

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Shutdowns</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {activeCount} active · {shutdowns.length} total
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('split')}
                className={`p-1.5 rounded-md transition-colors hidden md:block ${
                  viewMode === 'split' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'map' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                }`}
              >
                <Map className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            <Button onClick={() => {
              setEditingShutdown(null);
              setShowAddDialog(true);
            }}>
              <Plus className="h-4 w-4 mr-2 md:inline hidden" />
              <span className="md:inline hidden">Add Shutdown</span>
              <Plus className="h-5 w-5 md:hidden" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - List */}
        {(viewMode === 'split' || viewMode === 'list') && (
          <aside className={`
            bg-white border-r border-gray-200 flex flex-col
            ${viewMode === 'list' ? 'w-full' : 'w-full md:w-96'}
          `}>
            <div className="p-4 border-b border-gray-100">
              <ShutdownFilters
                search={search}
                setSearch={setSearch}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                reasonFilter={reasonFilter}
                setReasonFilter={setReasonFilter}
                regionFilter={regionFilter}
                setRegionFilter={setRegionFilter}
                regions={regions}
              />
            </div>
            <div className="flex-1 overflow-hidden p-4">
              <ShutdownList
                shutdowns={filteredShutdowns}
                onSelect={handleSelect}
                selectedId={selectedShutdown?.id}
                onClear={handleClear}
                loading={isLoading}
              />
            </div>
          </aside>
        )}

        {/* Map */}
        {(viewMode === 'split' || viewMode === 'map') && (
          <main className={`
            flex-1 relative
            ${viewMode === 'split' ? 'hidden md:block' : ''}
          `}>
            <ShutdownMap
              shutdowns={filteredShutdowns}
              onSelectShutdown={handleSelect}
              selectedId={selectedShutdown?.id}
            />
            
            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 text-xs">
              <p className="font-medium mb-2">Legend</p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span>Weather</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span>Accident</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span>Construction</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-violet-500" />
                  <span>Event</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-400" />
                  <span>Cleared</span>
                </div>
              </div>
            </div>
          </main>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <AddShutdownDialog
        open={showAddDialog}
        onOpenChange={(open) => {
          setShowAddDialog(open);
          if (!open) setEditingShutdown(null);
        }}
        onAdd={handleSave}
        editData={editingShutdown}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Details Sheet */}
      <ShutdownDetails
        shutdown={selectedShutdown}
        open={showDetails}
        onOpenChange={setShowDetails}
        onClear={handleClear}
        onDelete={handleDelete}
        onEdit={handleEdit}
        loading={updateMutation.isPending || deleteMutation.isPending}
      />
    </div>
  );
}
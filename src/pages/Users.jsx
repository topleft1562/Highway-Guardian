import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shield, User, Car, AlertCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function UsersPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: allUsers = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list('-created_date'),
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        if (user.role !== 'admin') {
          window.location.href = '/access-denied';
        }
      } catch (error) {
        window.location.href = '/access-denied';
      }
    };
    fetchUser();
  }, []);

  const updateAccessLevelMutation = useMutation({
    mutationFn: ({ userId, access_level }) => 
      base44.entities.User.update(userId, { access_level }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Access level updated');
    },
    onError: () => {
      toast.error('Failed to update access level');
    }
  });

  const handleAccessLevelChange = (userId, newAccessLevel) => {
    updateAccessLevelMutation.mutate({ userId, access_level: newAccessLevel });
  };

  if (!currentUser || currentUser.role !== 'admin') {
    return null;
  }

  const getAccessLevelBadge = (accessLevel) => {
    const levels = {
      admin: { color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Shield },
      user: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: User },
      driver: { color: 'bg-gray-100 text-gray-700 border-gray-200', icon: Car }
    };
    const config = levels[accessLevel] || levels.driver;
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {accessLevel}
      </Badge>
    );
  };

  const getAccessLevelIcon = (accessLevel) => {
    const icons = { admin: Shield, user: User, driver: Car };
    const Icon = icons[accessLevel] || Car;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(createPageUrl('Dashboard'))}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Shutdowns
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage user access levels for shutdown tracking</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Access Level</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allUsers.map((user) => {
                const userAccessLevel = user.access_level || 'driver';
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{getAccessLevelBadge(userAccessLevel)}</TableCell>
                    <TableCell className="text-gray-500">
                      {format(new Date(user.created_date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Select
                        value={userAccessLevel}
                        onValueChange={(value) => handleAccessLevelChange(user.id, value)}
                        disabled={user.id === currentUser.id}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="driver">
                            <div className="flex items-center gap-2">
                              <Car className="h-4 w-4" />
                              Driver
                            </div>
                          </SelectItem>
                          <SelectItem value="user">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              User
                            </div>
                          </SelectItem>
                          <SelectItem value="admin">
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4" />
                              Admin
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900 mb-1">Access Levels</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li><strong>Driver:</strong> View-only access (default for new users)</li>
                <li><strong>User:</strong> Can add, edit, and clear shutdowns</li>
                <li><strong>Admin:</strong> Full access including user management</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
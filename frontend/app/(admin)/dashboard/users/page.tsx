'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useDoubleConfirmDialog } from '@/components/ui/DoubleConfirmDialog';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner, LoadingSkeleton } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Tooltip, InfoTooltip } from '@/components/ui/Tooltip';
import { InlineMessage } from '@/components/ui/InlineMessage';
import { UserPlus, Mail, Shield, Trash2, Edit, Users, Search, Eye, Calendar, Phone } from 'lucide-react';
import { getRoleColor, getRoleName, USER_ROLES } from '@/lib/roles';
import RolesList from '@/components/admin/RolesList';
import EmailApprovalsList from '@/components/admin/EmailApprovalsList';
import { fetchAPI } from '@/lib/api';

interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  displayName: string;
  role: string;
  createdAt: string;
  postsCount?: number;
  phoneNumber?: string;
  countryCode?: string;
}

export default function UsersPage() {
  const router = useRouter();
  const { success, warning, error: showError, info } = useToast();
  const { dialog, confirm } = useConfirmDialog();
  const { dialog: doubleDialog, confirm: doubleConfirm } = useDoubleConfirmDialog();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ 
    email: '', 
    name: '', 
    password: '', 
    role: 'SUBSCRIBER' 
  });
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'approvals'>('users');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await fetchAPI('/auth/users');
      setUsers(Array.isArray(data) ? data : []);
      setError(null);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      setError(error.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchAPI('/auth/register', { method: 'POST', body: JSON.stringify(newUser) });
      setNewUser({ email: '', name: '', password: '', role: 'USER' });
      setShowAddUser(false);
      fetchUsers();
    } catch (error: any) {
      console.error('Error adding user:', error);
      showError(error.message || 'Failed to add user');
    }
  };

  const handleDeleteUser = (id: string, username: string, role: string) => {
    // Check if user is SUPER_ADMIN
    if (role === 'SUPER_ADMIN') {
      const superAdminCount = users.filter(u => u.role === 'SUPER_ADMIN').length;
      if (superAdminCount <= 1) {
        showError('Cannot delete the last Super Admin. Create another Super Admin first.');
        return;
      }
    }

    // Double confirmation for account deletion
    doubleConfirm(
      'Delete User Account',
      <>
        <p className="mb-2">You are about to permanently delete user <strong>{username}</strong>.</p>
        <p className="mb-2">This will:</p>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Remove all their content and posts</li>
          <li>Delete all associated data</li>
          <li>Revoke all permissions immediately</li>
        </ul>
        <p className="mt-3 font-semibold text-red-600 dark:text-red-400">This action cannot be undone!</p>
      </>,
      async () => {
        try {
          try {
            await fetchAPI(`/auth/users/${id}`, { method: 'DELETE' });
            success(`User "${username}" deleted successfully`);
            fetchUsers();
          } catch (error: any) {
            console.error('Error deleting user:', error);
            showError(error.message || 'Failed to delete user');
          }
        } catch (error) {
          console.error('Error deleting user:', error);
          showError('An error occurred while deleting');
        }
      },
      'DELETE'
    );
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-6">Users Management</h1>
        <LoadingSkeleton lines={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800">{error}</p>
        </div>
        <Button onClick={fetchUsers}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {dialog}
      {doubleDialog}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            Users & Roles
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Manage user accounts, roles, and permissions across your site</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6 border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-2 px-1 font-medium text-sm transition-colors relative ${
            activeTab === 'users'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          User Management
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`pb-2 px-1 font-medium text-sm transition-colors relative ${
            activeTab === 'roles'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          User Roles & Capabilities
        </button>
        <button
          onClick={() => setActiveTab('approvals')}
          className={`pb-2 px-1 font-medium text-sm transition-colors relative ${
            activeTab === 'approvals'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Pending Email Approvals
        </button>
      </div>

      {activeTab === 'users' && (
        <>
          <div className="flex justify-end mb-6">
            <Tooltip content="Add a new user to your site">
              <Button onClick={() => setShowAddUser(!showAddUser)} className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Add User
              </Button>
            </Tooltip>
          </div>

      {showAddUser && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Add New User</h3>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
                <Input
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <Input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="john@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                <Input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="••••••••"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="SUBSCRIBER">Subscriber - Can read content and manage profile</option>
                  <option value="CONTRIBUTOR">Contributor - Can create and edit own posts</option>
                  <option value="AUTHOR">Author - Can publish and manage own posts</option>
                  <option value="EDITOR">Editor - Can manage all posts and moderate</option>
                  <option value="ADMINISTRATOR">Administrator - Full site control</option>
                  <option value="SUPER_ADMIN">Super Admin - Unrestricted access</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Add User</Button>
                <Button type="button" variant="outline" onClick={() => setShowAddUser(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {users.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-slate-600">
              No users found. Click "Add User" to create one.
            </CardContent>
          </Card>
        ) : (
          users.map((user) => (
          <Card key={user.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-lg">
                      {(user.displayName || user.firstName || user.username).charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {user.displayName || `${user.firstName} ${user.lastName}`.trim() || user.username}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <span className="flex items-center gap-1">
                        <Mail size={14} />
                        {user.email}
                      </span>
                      {user.phoneNumber && (
                        <span className="flex items-center gap-1">
                          <Phone size={14} />
                          {user.countryCode} {user.phoneNumber}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Shield size={14} />
                        <span className={`px-2 py-0.5 rounded-full text-xs ${getRoleColor(user.role)}`}>
                          {getRoleName(user.role)}
                        </span>
                      </span>
                      {user.postsCount !== undefined && (
                        <span>
                          {user.postsCount} {user.postsCount === 1 ? 'post' : 'posts'}
                        </span>
                      )}
                      <span>
                        Joined {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/dashboard/users/${user.id}`)}
                  >
                    <Edit size={14} className="mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteUser(user.id, user.username, user.role)}
                  >
                    <Trash2 size={14} className="mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
        )}
      </div>
      </>
      )}

      {activeTab === 'roles' && <RolesList />}
      {activeTab === 'approvals' && <EmailApprovalsList />}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { Shield, User, Loader2, Check, AlertTriangle, Search, UserPlus, Trash2, CheckCircle, XCircle, Users, ShieldCheck, UserCheck } from 'lucide-react';
import { useToast } from '../AppShell';

interface AppUser {
  id: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'admin' | 'user' | 'pending';
  createdAt: string;
}

export default function UserManagement() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user' | 'pending'>('all');

  const fetchUsers = async () => {
    try {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const fetchedUsers: AppUser[] = [];
      snapshot.forEach(doc => {
        fetchedUsers.push({ id: doc.id, ...doc.data() } as AppUser);
      });
      setUsers(fetchedUsers);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleToggle = async (userId: string, currentRole: 'admin' | 'user' | 'pending') => {
    const user = users.find(u => u.id === userId);
    if (user?.email === 'anil99senchury@gmail.com') {
      showToast("Cannot modify the system owner.", "error");
      return;
    }
    if (userId === auth.currentUser?.uid) {
      showToast("You cannot change your own role.", "error");
      return;
    }

    setUpdatingId(userId);
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { role: newRole });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      showToast(`User updated to ${newRole}`, "success");
    } catch (err: any) {
      showToast('Failed to update role: ' + err.message, "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleApprove = async (userId: string) => {
    setUpdatingId(userId);
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { role: 'user' });
      setUsers(users.map(u => u.id === userId ? { ...u, role: 'user' } : u));
      showToast("User approved successfully", "success");
    } catch (err: any) {
      showToast('Approval failed: ' + err.message, "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleReject = async (userId: string) => {
    if (!confirm("Are you sure you want to reject and delete this user?")) return;
    setUpdatingId(userId);
    try {
      await deleteDoc(doc(db, 'users', userId));
      setUsers(users.filter(u => u.id !== userId));
      showToast("User rejected and deleted", "success");
    } catch (err: any) {
      showToast('Rejection failed: ' + err.message, "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const copyInviteLink = () => {
    const link = `https://app.anilsunar.com.np?invite=true`;
    navigator.clipboard.writeText(link);
    showToast("Invite link copied to clipboard!", "success");
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (u.displayName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const pendingUsers = users.filter(u => u.role === 'pending');
  const activeUsers = filteredUsers.filter(u => u.role !== 'pending');

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    regular: users.filter(u => u.role === 'user').length,
    newest: users.length > 0 ? new Date(users[0].createdAt).toLocaleDateString() : 'N/A'
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 64, color: 'var(--text-secondary)' }}>
        <Loader2 className="animate-spin" size={24} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' }}>User Management</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            Manage access and roles for the Goxent Command Center.
          </p>
        </div>
        <button onClick={copyInviteLink} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <UserPlus size={18} /> Invite User
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--info-color)', marginBottom: 8 }}>
            <Users size={18} />
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Total Users</span>
          </div>
          <p style={{ fontSize: 24, fontWeight: 800 }}>{stats.total}</p>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--gold)', marginBottom: 8 }}>
            <ShieldCheck size={18} />
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Admins</span>
          </div>
          <p style={{ fontSize: 24, fontWeight: 800 }}>{stats.admins}</p>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--success-color)', marginBottom: 8 }}>
            <UserCheck size={18} />
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Regular</span>
          </div>
          <p style={{ fontSize: 24, fontWeight: 800 }}>{stats.regular}</p>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
            <Loader2 size={18} />
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Last Joined</span>
          </div>
          <p style={{ fontSize: 24, fontWeight: 800 }}>{stats.newest}</p>
        </div>
      </div>

      {/* Pending Approvals Section */}
      {pendingUsers.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--gold)' }}>
            <AlertTriangle size={18} /> Pending Approvals ({pendingUsers.length})
          </h3>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {pendingUsers.map(user => (
              <div key={user.id} className="card" style={{ padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {user.photoURL ? <img src={user.photoURL} alt="" style={{ width: '100%', height: '100%' }} /> : <User size={20} />}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{user.displayName || 'Unknown'}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{user.email}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => handleApprove(user.id)} disabled={!!updatingId} className="btn" style={{ padding: 8, background: 'rgba(74, 222, 128, 0.1)', color: 'var(--success-color)', border: '1px solid rgba(74, 222, 128, 0.2)' }}>
                    <CheckCircle size={18} />
                  </button>
                  <button onClick={() => handleReject(user.id)} disabled={!!updatingId} className="btn" style={{ padding: 8, background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <XCircle size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Users List with Filter */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '10px 10px 10px 36px', fontSize: 14 }}
            />
          </div>
          <select 
            value={roleFilter} 
            onChange={(e) => setRoleFilter(e.target.value as any)}
            style={{ padding: '10px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, color: 'white', fontSize: 14 }}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admins</option>
            <option value="user">Regular Users</option>
          </select>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>User</th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Role</th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Joined</th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeUsers.map(user => (
                <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {user.photoURL ? <img src={user.photoURL} alt="" style={{ width: '100%', height: '100%' }} /> : <User size={18} />}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{user.displayName || 'Unknown'}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ 
                      padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                      background: user.role === 'admin' ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.05)',
                      color: user.role === 'admin' ? 'var(--gold)' : 'var(--text-secondary)',
                      display: 'inline-flex', alignItems: 'center', gap: 4
                    }}>
                      {user.role === 'admin' ? <Shield size={10} /> : <User size={10} />}
                      {user.role}
                    </span>
                  </td>
                  <td style={{ padding: '16px', fontSize: 13, color: 'var(--text-secondary)' }}>
                    {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <button 
                      disabled={!!updatingId || user.email === 'anil99senchury@gmail.com'}
                      onClick={() => handleRoleToggle(user.id, user.role)}
                      className="btn" 
                      style={{ fontSize: 12, padding: '6px 12px' }}
                    >
                      {updatingId === user.id ? <Loader2 size={14} className="animate-spin" /> : 
                       user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                    </button>
                  </td>
                </tr>
              ))}
              {activeUsers.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No users found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

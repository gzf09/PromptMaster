import React, { useState } from 'react';
import { User, Language, UserRole } from '../types';
import { Icons } from './Icon';
import { t } from '../utils/translations';

interface UserManagementProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  onAddUser: (name: string, role: UserRole) => void;
  onDeleteUser: (id: string) => void;
  currentUser: User;
  lang: Language;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  isOpen,
  onClose,
  users,
  onAddUser,
  onDeleteUser,
  currentUser,
  lang
}) => {
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('user');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      onAddUser(newName.trim(), newRole);
      setNewName('');
      setNewRole('user');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-colors duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Icons.Shield size={20} className="text-indigo-600 dark:text-indigo-400"/>
            {t(lang, 'manageUsers')}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
            <Icons.Close size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          
          {/* Add User Form */}
          <form onSubmit={handleSubmit} className="mb-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">{t(lang, 'addUser')}</h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t(lang, 'nameLabel')}
                className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="user">{t(lang, 'user')}</option>
                <option value="admin">{t(lang, 'admin')}</option>
              </select>
              <button 
                type="submit"
                disabled={!newName.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Icons.Plus size={18} />
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">{t(lang, 'defaultPasswordNotice')}</p>
          </form>

          {/* User List */}
          <div className="space-y-3">
            {users.map(user => (
              <div key={user.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900/50 bg-white dark:bg-slate-900/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm
                    ${user.role === 'admin' ? 'bg-indigo-600' : 'bg-slate-500'}
                  `}>
                    {user.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        {user.name}
                        {currentUser.id === user.id && <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-full">{t(lang, 'currentUser')}</span>}
                    </p>
                    <p className="text-xs text-slate-500 capitalize">{t(lang, user.role)}</p>
                  </div>
                </div>

                {user.id !== currentUser.id && user.role !== 'guest' && (
                  <button 
                    onClick={() => onDeleteUser(user.id)}
                    className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title={t(lang, 'deleteUser')}
                  >
                    <Icons.Trash size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

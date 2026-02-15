import React, { useState, useEffect } from 'react';
import { User, Language, UserRole } from '../types';
import { Icons } from './Icon';
import { t } from '../utils/translations';
import * as api from '../services/api';

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
  const [allowRegistration, setAllowRegistration] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.fetchSettings().then(s => setAllowRegistration(s.allowRegistration)).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      onAddUser(newName.trim(), newRole);
      setNewName('');
      setNewRole('user');
    }
  };

  const handleToggleRegistration = async () => {
    setSettingsLoading(true);
    try {
      const result = await api.updateSettings({ allowRegistration: !allowRegistration });
      setAllowRegistration(result.allowRegistration);
    } catch {
      // silent
    } finally {
      setSettingsLoading(false);
    }
  };

  const formatTime = (ts?: number) => {
    if (!ts || ts === 0) return t(lang, 'neverLoggedIn');
    return new Date(ts).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-colors duration-200">

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
        <div className="p-6 overflow-y-auto max-h-[70vh]">

          {/* Registration Toggle */}
          <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t(lang, 'allowRegistration')}</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {allowRegistration ? t(lang, 'registerTitle') : t(lang, 'registrationClosed')}
              </p>
            </div>
            <button
              onClick={handleToggleRegistration}
              disabled={settingsLoading}
              className={`relative w-12 h-7 rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
                allowRegistration ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200 ${
                allowRegistration ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Add User Form */}
          <form onSubmit={handleSubmit} className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
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

          {/* User Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t(lang, 'nameLabel')}</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t(lang, 'roleLabel')}</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t(lang, 'createdAt')}</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t(lang, 'lastLoginAt')}</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0
                          ${user.role === 'admin' ? 'bg-indigo-600' : 'bg-slate-500'}
                        `}>
                          {user.avatar}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate flex items-center gap-2">
                            {user.name}
                            {currentUser.id === user.id && <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-full">{t(lang, 'currentUser')}</span>}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-xs text-slate-600 dark:text-slate-400 capitalize">{t(lang, user.role)}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-xs text-slate-500 dark:text-slate-400">{formatTime(user.createdAt)}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-xs text-slate-500 dark:text-slate-400">{formatTime(user.lastLoginAt)}</span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {user.id !== currentUser.id && user.role !== 'guest' && (
                        <button
                          onClick={() => onDeleteUser(user.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title={t(lang, 'deleteUser')}
                        >
                          <Icons.Trash size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
};

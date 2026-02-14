import React, { useState } from 'react';
import { Category, Language, User, Theme } from '../types';
import { Icons } from './Icon';
import { t } from '../utils/translations';

const ICON_OPTIONS = [
  { name: 'Tag', icon: Icons.Tag },
  { name: 'Code', icon: Icons.Code },
  { name: 'PenTool', icon: Icons.PenTool },
  { name: 'Image', icon: Icons.Image },
  { name: 'BarChart', icon: Icons.BarChart },
  { name: 'Book', icon: Icons.Book },
  { name: 'Star', icon: Icons.Star },
  { name: 'Globe', icon: Icons.Globe },
  { name: 'User', icon: Icons.User },
  { name: 'Sparkles', icon: Icons.Sparkles },
  { name: 'Folder', icon: Icons.Folder },
  { name: 'Shield', icon: Icons.Shield },
] as const;

const SYSTEM_ICON_MAP: Record<string, React.FC<any>> = {
  coding: Icons.Code,
  writing: Icons.PenTool,
  'image-gen': Icons.Image,
  'data-analysis': Icons.BarChart,
  learning: Icons.Book,
};

function getCategoryIcon(cat: Category): React.FC<any> {
  // System categories use hardcoded mapping
  if (cat.type === 'system' && SYSTEM_ICON_MAP[cat.id]) {
    return SYSTEM_ICON_MAP[cat.id];
  }
  // User categories use stored icon name
  if (cat.icon) {
    const found = ICON_OPTIONS.find(o => o.name === cat.icon);
    if (found) return found.icon;
  }
  return Icons.Tag;
}

interface SidebarProps {
  categories: Category[];
  selectedCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
  onAddCategory: (name: string, icon?: string) => void;
  onDeleteCategory: (id: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  lang: Language;
  setLang: (lang: Language) => void;
  currentUser: User;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  onOpenUserManagement: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
  onAddCategory,
  onDeleteCategory,
  isOpen,
  setIsOpen,
  lang,
  setLang,
  currentUser,
  theme,
  setTheme,
  onOpenUserManagement,
  onLogout
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('Tag');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isGuest = currentUser.role === 'guest';
  const isAdmin = currentUser.role === 'admin';

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategoryName.trim()) {
      onAddCategory(newCategoryName.trim(), newCategoryIcon);
      setNewCategoryName('');
      setNewCategoryIcon('Tag');
      setIsAdding(false);
      setShowIconPicker(false);
    }
  };

  const toggleLanguage = () => {
    setLang(lang === 'zh' ? 'en' : 'zh');
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const SelectedIcon = ICON_OPTIONS.find(o => o.name === newCategoryIcon)?.icon || Icons.Tag;

  const sidebarClass = `
    fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out
    bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    md:translate-x-0 md:static md:inset-auto flex flex-col
  `;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={sidebarClass}>
        {/* App Title */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/20">
                <Icons.Sparkles className="text-white h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{t(lang, 'appTitle')}</h1>
          </div>
          <button onClick={() => setIsOpen(false)} className="md:hidden text-slate-500 dark:text-slate-400">
            <Icons.Close />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 flex-1 overflow-y-auto">
            {/* Main Navigation */}
            <div className="space-y-1 mb-8">
                {/* Guest ONLY sees Community */}
                {!isGuest && (
                    <button
                    onClick={() => {
                        onSelectCategory('all');
                        setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                        ${selectedCategoryId === 'all'
                        ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                        }
                    `}
                    >
                    <Icons.User size={18} />
                    {t(lang, 'allPrompts')}
                    {selectedCategoryId === 'all' && (
                        <Icons.ChevronRight className="ml-auto w-4 h-4 opacity-50" />
                    )}
                    </button>
                )}

                <button
                onClick={() => {
                    onSelectCategory('community');
                    setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                    ${selectedCategoryId === 'community'
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                    }
                `}
                >
                <Icons.Globe size={18} />
                {t(lang, 'community')}
                {selectedCategoryId === 'community' && (
                    <Icons.ChevronRight className="ml-auto w-4 h-4 opacity-50" />
                )}
                </button>

                {!isGuest && (
                    <button
                    onClick={() => {
                        onSelectCategory('favorites');
                        setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                        ${selectedCategoryId === 'favorites'
                        ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                        }
                    `}
                    >
                    <Icons.Star size={18} />
                    {t(lang, 'favorites')}
                    {selectedCategoryId === 'favorites' && (
                        <Icons.ChevronRight className="ml-auto w-4 h-4 opacity-50" />
                    )}
                    </button>
                )}
            </div>

            {/* Categories Header */}
            <div className="flex items-center justify-between px-2 mb-2">
                <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t(lang, 'categories')}</h3>
                {!isGuest && (
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className="text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors"
                        title={t(lang, 'addCategory')}
                    >
                        <Icons.Plus size={16} />
                    </button>
                )}
            </div>

            {/* Category List */}
            <div className="space-y-0.5">
                {categories.map((cat) => {
                    const CatIcon = getCategoryIcon(cat);
                    return (
                    <div key={cat.id} className="group flex items-center">
                        <button
                        onClick={() => {
                            onSelectCategory(cat.id);
                            setIsOpen(false);
                        }}
                        className={`flex-1 flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                            ${selectedCategoryId === cat.id
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                            }
                        `}
                        >
                            <CatIcon size={16} />
                            <span className="truncate">{cat.name}</span>
                        </button>

                        {isAdmin && cat.id !== 'other' && (
                             <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if(confirm(t(lang, 'deleteCategoryConfirm', { name: cat.name }))) {
                                        onDeleteCategory(cat.id);
                                    }
                                }}
                                className="p-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Delete"
                            >
                                <Icons.Trash size={14} />
                            </button>
                        )}
                    </div>
                    );
                })}

                {isAdding && !isGuest && (
                    <form onSubmit={handleAddSubmit} className="px-2 py-1">
                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-lg p-1 border border-indigo-500/50">
                            <button
                              type="button"
                              onClick={() => setShowIconPicker(!showIconPicker)}
                              className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors shrink-0"
                              title={t(lang, 'selectIcon')}
                            >
                              <SelectedIcon size={16} />
                            </button>
                            <input
                                autoFocus
                                type="text"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                placeholder={t(lang, 'addCategoryPlaceholder')}
                                className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none"
                                onBlur={() => {
                                  if (!newCategoryName && !showIconPicker) {
                                    setIsAdding(false);
                                  }
                                }}
                            />
                            <button type="submit" className="text-indigo-600 dark:text-indigo-400 px-1 shrink-0">
                                <Icons.Check size={14} />
                            </button>
                        </div>
                        {showIconPicker && (
                          <div className="mt-2 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg grid grid-cols-6 gap-1">
                            {ICON_OPTIONS.map(({ name, icon: IconComp }) => (
                              <button
                                key={name}
                                type="button"
                                onClick={() => {
                                  setNewCategoryIcon(name);
                                  setShowIconPicker(false);
                                }}
                                className={`p-2 rounded-md transition-colors flex items-center justify-center
                                  ${newCategoryIcon === name
                                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                  }
                                `}
                                title={name}
                              >
                                <IconComp size={16} />
                              </button>
                            ))}
                          </div>
                        )}
                    </form>
                )}
            </div>
        </div>

        {/* Bottom Section */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 mt-auto shrink-0 bg-white dark:bg-slate-950 space-y-3">

             {/* User Menu */}
             <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors border border-transparent"
                >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md
                        ${isGuest ? 'bg-slate-500' : 'bg-indigo-600 shadow-indigo-500/20'}`}>
                        {currentUser.avatar}
                    </div>
                    <div className="flex-1 text-left overflow-hidden">
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t(lang, 'currentUser')}</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate flex items-center gap-1">
                            {currentUser.name}
                            {currentUser.role === 'admin' && <Icons.Shield size={12} className="text-indigo-500" />}
                        </p>
                    </div>
                    <Icons.More size={16} className="text-slate-400" />
                </button>

                {/* User Menu Dropdown */}
                {showUserMenu && (
                    <div className="absolute bottom-full left-0 w-full mb-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden z-50 animate-fade-in-up">
                        {/* Admin Action */}
                        {!isGuest && currentUser.role === 'admin' && (
                            <button
                                onClick={() => {
                                    onOpenUserManagement();
                                    setShowUserMenu(false);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-medium text-sm transition-colors border-b border-slate-100 dark:border-slate-800"
                            >
                                <Icons.Shield size={16} />
                                {t(lang, 'manageUsers')}
                            </button>
                        )}

                        <button
                            onClick={() => {
                                onLogout();
                                setShowUserMenu(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/10 text-red-600 dark:text-red-400 font-medium text-sm transition-colors"
                        >
                            <Icons.LogOut size={16} />
                            {t(lang, 'logout')}
                        </button>
                    </div>
                )}
             </div>

             <div className="flex items-center gap-2">
                 <button
                    onClick={toggleLanguage}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-bold transition-colors"
                 >
                    <span className={lang === 'zh' ? 'text-indigo-600 dark:text-indigo-400' : ''}>CN</span>
                    <span className="text-slate-400 dark:text-slate-600">/</span>
                    <span className={lang === 'en' ? 'text-indigo-600 dark:text-indigo-400' : ''}>EN</span>
                 </button>

                 <button
                    onClick={toggleTheme}
                    className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                    title={t(lang, 'theme')}
                 >
                     {theme === 'dark' ? <Icons.Moon size={16} /> : <Icons.Sun size={16} />}
                 </button>
             </div>
        </div>
      </aside>
    </>
  );
};

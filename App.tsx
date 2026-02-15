import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { PromptList } from './components/PromptList';
import { PromptEditor } from './components/PromptEditor';
import { ToastContainer } from './components/Toast';
import { Icons } from './components/Icon';
import { UserManagement } from './components/UserManagement';
import { Login } from './components/Login';
import { ChangePassword } from './components/ChangePassword';
import { Prompt, Category, ToastMessage, ToastType, Language, User, Theme, UserRole } from './types';
import { t } from './utils/translations';
import { generateId } from './utils/generateId';
import * as api from './services/api';

const GUEST_USER: User = { id: 'guest', name: 'Guest', avatar: 'G', role: 'guest' };

const App: React.FC = () => {
  // --- STATE ---

  // Theme State (client-side preference)
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('promptmaster_theme');
    if (saved) return saved as Theme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Language State (client-side preference)
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('promptmaster_lang');
    return (saved as Language) || 'zh';
  });

  // Server-side data
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Loading state
  const [loading, setLoading] = useState(true);

  // UI State
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategoryId, setSearchCategoryId] = useState<string>('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isUserMgmtOpen, setIsUserMgmtOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [forkSource, setForkSource] = useState<Prompt | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // --- INITIALIZATION ---

  useEffect(() => {
    const init = async () => {
      // Always load categories (public endpoint)
      try {
        const cats = await api.fetchCategories();
        setCategories(cats);
      } catch {
        // Fallback empty
      }

      // Check for existing token
      if (api.hasToken()) {
        try {
          const user = await api.getMe();
          setCurrentUser(user);
          const data = await api.fetchPrompts();
          setPrompts(data);
        } catch {
          // Token invalid, clear it
          api.logout();
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  // --- EFFECTS ---

  // Persist client preferences
  useEffect(() => localStorage.setItem('promptmaster_lang', lang), [lang]);
  useEffect(() => localStorage.setItem('promptmaster_theme', theme), [theme]);

  // Apply Theme Class
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // --- HELPERS ---

  const loadPrompts = async () => {
    try {
      if (currentUser && currentUser.role !== 'guest') {
        const data = await api.fetchPrompts();
        setPrompts(data);
      } else if (currentUser?.role === 'guest') {
        const data = await api.fetchPublicPrompts();
        setPrompts(data);
      }
    } catch {
      // silent
    }
  };

  const loadCategories = async () => {
    try {
      const cats = await api.fetchCategories();
      setCategories(cats);
    } catch {
      // silent
    }
  };

  // --- HANDLERS ---

  const addToast = (message: string, type: ToastType) => {
    const id = generateId();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Auth Handlers
  const handleLogin = async (username: string, pass: string): Promise<boolean> => {
    try {
      const { user } = await api.login(username, pass);
      setCurrentUser(user);
      setSelectedCategoryId('all');

      // Load data
      const [promptsData, catsData] = await Promise.all([
        api.fetchPrompts(),
        api.fetchCategories(),
      ]);
      setPrompts(promptsData);
      setCategories(catsData);

      addToast(`Welcome back, ${user.name}`, 'success');
      return true;
    } catch {
      return false;
    }
  };

  const handleRegister = async (username: string, pass: string): Promise<boolean> => {
    try {
      const { user } = await api.register(username, pass);
      setCurrentUser(user);
      setSelectedCategoryId('all');

      const [promptsData, catsData] = await Promise.all([
        api.fetchPrompts(),
        api.fetchCategories(),
      ]);
      setPrompts(promptsData);
      setCategories(catsData);

      addToast(t(lang, 'registerSuccess'), 'success');
      return true;
    } catch {
      return false;
    }
  };

  const handleGuestAccess = async () => {
    setCurrentUser(GUEST_USER);
    setSelectedCategoryId('community');
    try {
      const data = await api.fetchPublicPrompts();
      setPrompts(data);
    } catch {
      // silent
    }
    addToast('Browsing as Guest', 'info');
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    setPrompts([]);
    setUsers([]);
    setSelectedCategoryId('all');
  };

  const handleChangePassword = async (newPass: string): Promise<boolean> => {
    try {
      const { user } = await api.changePassword(newPass);
      setCurrentUser(user);
      addToast(t(lang, 'passwordChanged'), 'success');
      return true;
    } catch {
      addToast('Failed to change password', 'error');
      return false;
    }
  };

  // Prompt Handlers
  const handleSavePrompt = async (promptData: {
    id?: string;
    title: string;
    content: string;
    description?: string;
    categoryId: string;
    tags: string[];
    visibility: string;
  }): Promise<boolean> => {
    if (!currentUser || currentUser.role === 'guest') return false;

    try {
      if (editingPrompt && promptData.id) {
        // Update
        const updated = await api.updatePrompt(promptData.id, {
          title: promptData.title,
          content: promptData.content,
          description: promptData.description,
          categoryId: promptData.categoryId,
          tags: promptData.tags,
          visibility: promptData.visibility,
        });
        setPrompts(prev => prev.map(p => p.id === updated.id ? updated : p));
      } else {
        // Create
        const created = await api.createPrompt({
          title: promptData.title,
          content: promptData.content,
          description: promptData.description,
          categoryId: promptData.categoryId,
          tags: promptData.tags,
          visibility: promptData.visibility,
        });
        setPrompts(prev => [created, ...prev]);
      }
      return true;
    } catch (err: any) {
      addToast(err.message || 'Failed to save prompt', 'error');
      return false;
    }
  };

  const handleDeletePrompt = async (id: string) => {
    if (!currentUser || currentUser.role === 'guest') return;
    try {
      await api.deletePrompt(id);
      setPrompts(prev => prev.filter(p => p.id !== id));
      addToast(t(lang, 'promptDeleted'), 'info');
    } catch (err: any) {
      addToast(err.message || 'Failed to delete prompt', 'error');
    }
  };

  const handleCopyPrompt = (content: string) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(content).then(() => {
        addToast(t(lang, 'clipboardCopied'), 'success');
      }).catch(() => {
        fallbackCopy(content);
      });
    } else {
      fallbackCopy(content);
    }
  };

  const fallbackCopy = (text: string) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      addToast(t(lang, 'clipboardCopied'), 'success');
    } catch {
      addToast('Copy failed', 'error');
    }
    document.body.removeChild(textarea);
  };

  const handleToggleFavorite = async (id: string) => {
    if (!currentUser || currentUser.role === 'guest') return;
    try {
      const { isFavorite } = await api.toggleFavorite(id);
      setPrompts(prev => prev.map(p =>
        p.id === id ? { ...p, isFavorite } : p
      ));
    } catch {
      // silent
    }
  };

  const handleForkPrompt = (prompt: Prompt) => {
    setEditingPrompt(null);
    setForkSource(prompt);
    setIsEditorOpen(true);
  };

  const handleAddCategory = async (name: string, icon?: string) => {
    if (!currentUser || currentUser.role === 'guest') return;
    try {
      const newCat = await api.createCategory(name, icon);
      setCategories(prev => [...prev, newCat]);
      addToast(t(lang, 'categoryCreated'), 'success');
    } catch (err: any) {
      addToast(err.message || t(lang, 'categoryExists'), 'error');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!currentUser || currentUser.role !== 'admin') return;
    try {
      await api.deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
      // Reload prompts since some may have been reassigned
      await loadPrompts();
      if (selectedCategoryId === id) {
        setSelectedCategoryId('all');
      }
      addToast(t(lang, 'categoryDeleted'), 'info');
    } catch (err: any) {
      addToast(err.message || 'Failed to delete category', 'error');
    }
  };

  const handleTagClick = (tag: string) => {
    if (searchQuery === tag) {
      setSearchQuery('');
    } else {
      setSearchQuery(tag);
    }
  };

  // User Management Handlers
  const handleAddUser = async (name: string, role: UserRole) => {
    if (!currentUser || currentUser.role !== 'admin') return;
    try {
      const newUser = await api.createUser(name, role);
      setUsers(prev => [...prev, newUser]);
      addToast(t(lang, 'userAdded'), 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to add user', 'error');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!currentUser || currentUser.role !== 'admin') return;
    if (id === currentUser.id) {
      addToast(t(lang, 'cannotDeleteSelf'), 'error');
      return;
    }
    try {
      await api.deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
      // Reload prompts since they may have been reassigned
      await loadPrompts();
      addToast(t(lang, 'userDeleted'), 'info');
    } catch (err: any) {
      addToast(err.message || 'Failed to delete user', 'error');
    }
  };

  const handleOpenUserManagement = async () => {
    // Load users when opening user management
    try {
      const data = await api.fetchUsers();
      setUsers(data);
    } catch {
      // silent
    }
    setIsUserMgmtOpen(true);
  };

  // --- DERIVED STATE ---

  const popularTags = useMemo(() => {
    const currentUserId = currentUser?.id || '';
    const isGuest = currentUser?.role === 'guest';

    const tagCounts: Record<string, number> = {};
    prompts.forEach(p => {
      let isVisible = false;
      if (isGuest) {
        isVisible = p.visibility === 'public';
      } else {
        isVisible = p.userId === currentUserId || p.visibility === 'public';
      }

      if (isVisible) {
        p.tags.forEach(t => {
          const normalized = t.trim().toLowerCase();
          if (normalized) {
            tagCounts[normalized] = (tagCounts[normalized] || 0) + 1;
          }
        });
      }
    });
    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag]) => tag);
  }, [prompts, currentUser]);

  const filteredPrompts = useMemo(() => {
    if (!currentUser) return [];

    return prompts.filter(prompt => {
      // 1. Permission / Scope Filter
      let isInScope = false;

      if (currentUser.role === 'guest') {
        isInScope = prompt.visibility === 'public';
      } else {
        if (selectedCategoryId === 'community') {
          isInScope = prompt.visibility === 'public';
        } else if (selectedCategoryId === 'all') {
          isInScope = prompt.userId === currentUser.id;
        } else {
          // Specific category or favorites: show own + public
          isInScope = prompt.userId === currentUser.id || prompt.visibility === 'public';
        }
      }

      if (!isInScope) return false;

      // 2. Category/Filter Selection
      let matchesCategory = true;
      if (selectedCategoryId === 'all' || selectedCategoryId === 'community') {
        matchesCategory = true;
      } else if (selectedCategoryId === 'favorites') {
        matchesCategory = prompt.isFavorite;
      } else {
        matchesCategory = prompt.categoryId === selectedCategoryId;
      }

      // 3. Search Filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        prompt.title.toLowerCase().includes(searchLower) ||
        prompt.content.toLowerCase().includes(searchLower) ||
        prompt.tags.some(tag => tag.toLowerCase().includes(searchLower));

      // 4. Search Category Filter
      const matchesSearchCategory = searchCategoryId === 'all' || prompt.categoryId === searchCategoryId;

      return matchesCategory && matchesSearch && matchesSearchCategory;
    });
  }, [prompts, selectedCategoryId, searchQuery, searchCategoryId, currentUser]);

  const currentCategoryName = useMemo(() => {
    if (selectedCategoryId === 'all') return t(lang, 'allPrompts');
    if (selectedCategoryId === 'community') return t(lang, 'community');
    if (selectedCategoryId === 'favorites') return t(lang, 'favorites');
    const cat = categories.find(c => c.id === selectedCategoryId);
    return cat ? cat.name : t(lang, 'unknownCategory');
  }, [selectedCategoryId, categories, lang]);


  // --- RENDER ---

  // 0. Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400 dark:text-slate-500 animate-pulse text-lg font-medium">Loading...</div>
      </div>
    );
  }

  // 1. Login Screen
  if (!currentUser) {
    return (
      <>
        <Login onLogin={handleLogin} onRegister={handleRegister} onGuestAccess={handleGuestAccess} lang={lang} />
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </>
    );
  }

  // 2. Force Password Change
  if (currentUser.isFirstLogin && currentUser.role !== 'guest') {
    return (
      <>
        <ChangePassword onChange={handleChangePassword} lang={lang} />
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </>
    );
  }

  // 3. Main App
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 overflow-hidden font-sans transition-colors duration-300">
      <Sidebar
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={setSelectedCategoryId}
        onAddCategory={handleAddCategory}
        onDeleteCategory={handleDeleteCategory}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        lang={lang}
        setLang={setLang}
        currentUser={currentUser}
        theme={theme}
        setTheme={setTheme}
        onOpenUserManagement={handleOpenUserManagement}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">

        {/* Top Navigation / Search Bar */}
        <header className="h-20 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md flex items-center justify-between px-8 z-20 shrink-0 sticky top-0">
          <div className="flex items-center gap-3 flex-1">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <Icons.Menu />
            </button>

            <div className="relative max-w-lg w-full hidden sm:block group">
              <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors w-5 h-5" />
              <input
                type="text"
                placeholder={t(lang, 'searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-transparent dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 dark:focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none transition-all placeholder-slate-500 shadow-inner focus:shadow-lg focus:shadow-indigo-500/10"
              />
            </div>

            <div className="relative hidden sm:block">
              <select
                value={searchCategoryId}
                onChange={(e) => setSearchCategoryId(e.target.value)}
                className="appearance-none bg-slate-100 dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-xl pl-3 pr-8 py-2.5 text-sm text-slate-900 dark:text-white outline-none cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                <option value="all">{t(lang, 'allCategories')}</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <Icons.ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none w-4 h-4" />
            </div>
          </div>

          <div className="flex items-center gap-4">
             {currentUser.role !== 'guest' && (
                <button
                    onClick={() => {
                        setEditingPrompt(null);
                        setForkSource(null);
                        setIsEditorOpen(true);
                    }}
                    className="hidden sm:flex items-center gap-2 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-500/20 dark:shadow-indigo-900/30 transition-all transform hover:translate-y-px hover:scale-105"
                >
                    <Icons.Plus size={20} />
                    {t(lang, 'newPrompt')}
                </button>
             )}
             {/* Mobile Add Button (Icon Only) - Hide for Guest */}
             {currentUser.role !== 'guest' && (
                 <button
                  onClick={() => {
                    setEditingPrompt(null);
                    setForkSource(null);
                    setIsEditorOpen(true);
                  }}
                  className="sm:hidden flex items-center justify-center bg-indigo-600 text-white w-12 h-12 rounded-full shadow-lg shadow-indigo-500/30"
                >
                  <Icons.Plus size={24} />
                </button>
             )}
          </div>
        </header>

         {/* Mobile Search Bar (Below Header) */}
        <div className="sm:hidden px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-3">
           <div className="relative w-full">
              <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder={t(lang, 'searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-transparent rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>
           <div className="relative w-full">
              <select
                value={searchCategoryId}
                onChange={(e) => setSearchCategoryId(e.target.value)}
                className="w-full appearance-none bg-slate-100 dark:bg-slate-900 border border-transparent rounded-lg pl-3 pr-8 py-2.5 text-sm text-slate-900 dark:text-white outline-none cursor-pointer"
              >
                <option value="all">{t(lang, 'allCategories')}</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <Icons.ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none w-4 h-4" />
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col mb-10">
              <div className="flex items-end justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2 flex items-center gap-3 tracking-tight">
                      {currentCategoryName}
                      {selectedCategoryId === 'community' && <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 uppercase tracking-wider">Public Library</span>}
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                    {filteredPrompts.length} {filteredPrompts.length === 1 ? 'prompt' : 'prompts'} found
                  </p>
                </div>
              </div>

              {/* Popular Tags Section */}
              {popularTags.length > 0 && (
                  <div className="flex flex-wrap gap-2.5 animate-fade-in-up">
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1 self-center mr-2">
                        <Icons.Tag size={14}/> {t(lang, 'popularTags')}:
                    </span>
                    {popularTags.map(tag => (
                        <button
                            key={tag}
                            onClick={() => handleTagClick(tag)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all duration-200
                                ${searchQuery === tag
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/30'
                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400'
                                }
                            `}
                        >
                            #{tag}
                            {searchQuery === tag && <Icons.Close size={10} className="inline ml-1.5 opacity-70"/>}
                        </button>
                    ))}
                  </div>
              )}
            </div>

            <PromptList
              prompts={filteredPrompts}
              categories={categories}
              onEdit={(p) => {
                setEditingPrompt(p);
                setForkSource(null);
                setIsEditorOpen(true);
              }}
              onDelete={handleDeletePrompt}
              onCopy={handleCopyPrompt}
              onToggleFavorite={handleToggleFavorite}
              onFork={handleForkPrompt}
              lang={lang}
              currentUser={currentUser}
            />
          </div>
        </div>
      </main>

      <PromptEditor
        isOpen={isEditorOpen}
        onClose={() => { setIsEditorOpen(false); setForkSource(null); }}
        onSave={handleSavePrompt}
        initialData={editingPrompt}
        forkSource={forkSource}
        categories={categories}
        addToast={addToast}
        lang={lang}
        currentUser={currentUser}
      />

      <UserManagement
        isOpen={isUserMgmtOpen}
        onClose={() => setIsUserMgmtOpen(false)}
        users={users}
        onAddUser={handleAddUser}
        onDeleteUser={handleDeleteUser}
        currentUser={currentUser}
        lang={lang}
      />

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default App;

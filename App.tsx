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
import { runMigrations } from './utils/migrations';

// Run data migrations before any React state initialization
runMigrations();

// Mock Users with Roles and Passwords
const MOCK_USERS_INIT: User[] = [
  { id: 'user1', name: 'Admin User', avatar: 'AU', role: 'admin', password: 'password', isFirstLogin: false },
  { id: 'user2', name: 'Jane Doe', avatar: 'JD', role: 'user', password: 'password', isFirstLogin: false },
];

const GUEST_USER: User = { id: 'guest', name: 'Guest', avatar: 'G', role: 'guest' };

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'coding', name: '编程', type: 'system' },
  { id: 'writing', name: '写作', type: 'system' },
  { id: 'image-gen', name: '图像生成', type: 'system' },
  { id: 'data-analysis', name: '数据分析', type: 'system' },
  { id: 'learning', name: '学习', type: 'system' },
  { id: 'other', name: '其他', type: 'system' },
];

// Demo prompts
const DEMO_PROMPTS: Prompt[] = [
  {
    id: '1',
    title: 'React Component Generator',
    content: 'Create a responsive React functional component...',
    description: 'Standard template for generating UI components.',
    categoryId: 'coding',
    tags: ['react', 'typescript', 'tailwind', 'ui'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isFavorite: true,
    userId: 'user1',
    authorName: 'Admin User',
    visibility: 'public'
  },
  {
    id: '2',
    title: 'Blog Post Outline',
    content: 'Act as a professional content strategist...',
    description: 'Structuring blog content efficiently.',
    categoryId: 'writing',
    tags: ['blog', 'content', 'marketing', 'outline'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isFavorite: false,
    userId: 'user1',
    authorName: 'Admin User',
    visibility: 'private'
  },
  {
    id: '3',
    title: 'Midjourney Portrait (Shared)',
    content: '/imagine prompt: A cinematic portrait...',
    description: 'Shared by Jane',
    categoryId: 'image-gen',
    tags: ['midjourney', 'portrait', 'cyberpunk', 'art'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isFavorite: false,
    userId: 'user2',
    authorName: 'Jane Doe',
    visibility: 'public'
  }
];

const App: React.FC = () => {
  // --- STATE ---
  
  // Theme State
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('promptmaster_theme');
    if (saved) return saved as Theme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Language State
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('promptmaster_lang');
    return (saved as Language) || 'zh';
  });

  // Users State (Persist mock users including passwords)
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('promptmaster_users');
    return saved ? JSON.parse(saved) : MOCK_USERS_INIT;
  });

  // Current User (Session) - No persistence for session security simulation, starts null
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Prompts State (field defaults handled by migration system)
  const [prompts, setPrompts] = useState<Prompt[]>(() => {
    const saved = localStorage.getItem('promptmaster_data');
    return saved ? JSON.parse(saved) : DEMO_PROMPTS;
  });

  // Categories State
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('promptmaster_categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  // UI State
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isUserMgmtOpen, setIsUserMgmtOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // --- EFFECTS ---

  // Persist Data
  useEffect(() => localStorage.setItem('promptmaster_data', JSON.stringify(prompts)), [prompts]);
  useEffect(() => localStorage.setItem('promptmaster_categories', JSON.stringify(categories)), [categories]);
  useEffect(() => localStorage.setItem('promptmaster_lang', lang), [lang]);
  useEffect(() => localStorage.setItem('promptmaster_users', JSON.stringify(users)), [users]);
  useEffect(() => localStorage.setItem('promptmaster_theme', theme), [theme]);

  // Apply Theme Class
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // --- HANDLERS ---

  const addToast = (message: string, type: ToastType) => {
    const id = generateId();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Auth Handlers
  const handleLogin = (username: string, pass: string): boolean => {
    const user = users.find(u => u.name === username && u.password === pass);
    if (user) {
      setCurrentUser(user);
      setSelectedCategoryId('all');
      addToast(`Welcome back, ${user.name}`, 'success');
      return true;
    }
    return false;
  };

  const handleGuestAccess = () => {
    setCurrentUser(GUEST_USER);
    setSelectedCategoryId('community');
    addToast('Browsing as Guest', 'info');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedCategoryId('all');
  };

  const handleChangePassword = (newPass: string) => {
    if (!currentUser) return;
    
    const updatedUser = { ...currentUser, password: newPass, isFirstLogin: false };
    const updatedUsers = users.map(u => u.id === currentUser.id ? updatedUser : u);
    
    setUsers(updatedUsers);
    setCurrentUser(updatedUser);
    addToast(t(lang, 'passwordChanged'), 'success');
  };

  // Prompt Handlers
  const handleSavePrompt = (prompt: Prompt) => {
    if (!currentUser || currentUser.role === 'guest') return;

    if (editingPrompt) {
      setPrompts(prev => prev.map(p => p.id === prompt.id ? prompt : p));
    } else {
      setPrompts(prev => [prompt, ...prev]);
    }
  };

  const handleDeletePrompt = (id: string) => {
    if (!currentUser || currentUser.role === 'guest') return;
    setPrompts(prev => prev.filter(p => p.id !== id));
    addToast(t(lang, 'promptDeleted'), 'info');
  };

  const handleCopyPrompt = (content: string) => {
    navigator.clipboard.writeText(content);
    addToast(t(lang, 'clipboardCopied'), 'success');
  };

  const handleToggleFavorite = (id: string) => {
    if (!currentUser || currentUser.role === 'guest') return;
    setPrompts(prev => prev.map(p => 
      p.id === id ? { ...p, isFavorite: !p.isFavorite } : p
    ));
  };

  const handleAddCategory = (name: string) => {
    if (!currentUser || currentUser.role === 'guest') return;
    if (categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
        addToast(t(lang, 'categoryExists'), 'error');
        return;
    }
    const newCategory: Category = {
        id: generateId(),
        name,
        type: 'user',
        userId: currentUser.id
    };
    setCategories(prev => [...prev, newCategory]);
    addToast(t(lang, 'categoryCreated'), 'success');
  };

  const handleDeleteCategory = (id: string) => {
    if (!currentUser || currentUser.role === 'guest') return;
    setPrompts(prev => prev.map(p => {
        if (p.categoryId === id) {
            return { ...p, categoryId: 'other' };
        }
        return p;
    }));

    setCategories(prev => prev.filter(c => c.id !== id));
    if (selectedCategoryId === id) {
        setSelectedCategoryId('all');
    }
    addToast(t(lang, 'categoryDeleted'), 'info');
  };

  const handleTagClick = (tag: string) => {
      if (searchQuery === tag) {
          setSearchQuery('');
      } else {
          setSearchQuery(tag);
      }
  };

  const handleSwitchUser = (userId: string) => {
      if (!currentUser || currentUser.role !== 'admin') return;
      const user = users.find(u => u.id === userId);
      if (user) {
          setCurrentUser(user);
          setSelectedCategoryId('all');
          addToast(t(lang, 'switchUser') + `: ${user.name}`, 'info');
      }
  };

  // User Management Handlers
  const handleAddUser = (name: string, role: UserRole) => {
    if (!currentUser || currentUser.role !== 'admin') return;
    
    const avatar = name.substring(0, 2).toUpperCase();
    const newUser: User = {
        id: generateId(),
        name,
        role,
        avatar,
        password: '123456', // Default password per requirement
        isFirstLogin: true
    };
    setUsers(prev => [...prev, newUser]);
    addToast(t(lang, 'userAdded'), 'success');
  };

  const handleDeleteUser = (id: string) => {
    if (!currentUser || currentUser.role !== 'admin') return;
    if (id === currentUser.id) {
        addToast(t(lang, 'cannotDeleteSelf'), 'error');
        return;
    }
    
    // Reassign prompts to current admin
    setPrompts(prev => prev.map(p => p.userId === id ? { ...p, userId: currentUser.id } : p));
    setUsers(prev => prev.filter(u => u.id !== id));
    addToast(t(lang, 'userDeleted'), 'info');
  };

  // --- DERIVED STATE ---

  const popularTags = useMemo(() => {
    // If not logged in (shouldn't happen due to Login wrapper), safe fallback
    const currentUserId = currentUser?.id || '';
    const isGuest = currentUser?.role === 'guest';

    const tagCounts: Record<string, number> = {};
    prompts.forEach(p => {
        // Visibility Check
        let isVisible = false;
        if (isGuest) {
            isVisible = p.visibility === 'public';
        } else {
            // User sees their own + public
            isVisible = p.userId === currentUserId || p.visibility === 'public';
        }

        if (isVisible) {
            p.tags.forEach(t => {
                const normalized = t.trim().toLowerCase();
                if(normalized) {
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
          // Guest only sees public
          isInScope = prompt.visibility === 'public';
      } else {
          // Logged in user
          if (selectedCategoryId === 'community') {
              isInScope = prompt.visibility === 'public';
          } else {
              // Default view: My Prompts
              isInScope = prompt.userId === currentUser.id;
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
      
      return matchesCategory && matchesSearch;
    });
  }, [prompts, selectedCategoryId, searchQuery, currentUser]);

  const currentCategoryName = useMemo(() => {
    if (selectedCategoryId === 'all') return t(lang, 'allPrompts');
    if (selectedCategoryId === 'community') return t(lang, 'community');
    if (selectedCategoryId === 'favorites') return t(lang, 'favorites');
    const cat = categories.find(c => c.id === selectedCategoryId);
    return cat ? cat.name : t(lang, 'unknownCategory');
  }, [selectedCategoryId, categories, lang]);


  // --- RENDER ---

  // 1. Login Screen
  if (!currentUser) {
    return (
      <>
        <Login onLogin={handleLogin} onGuestAccess={handleGuestAccess} lang={lang} />
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
        users={users}
        onSwitchUser={handleSwitchUser}
        theme={theme}
        setTheme={setTheme}
        onOpenUserManagement={() => setIsUserMgmtOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* Top Navigation / Search Bar */}
        <header className="h-20 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md flex items-center justify-between px-8 z-20 shrink-0 sticky top-0">
          <div className="flex items-center gap-4 flex-1">
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
          </div>

          <div className="flex items-center gap-4">
             {currentUser.role !== 'guest' && (
                <button
                    onClick={() => {
                        setEditingPrompt(null);
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
        <div className="sm:hidden px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
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
                setIsEditorOpen(true);
              }}
              onDelete={handleDeletePrompt}
              onCopy={handleCopyPrompt}
              onToggleFavorite={handleToggleFavorite}
              lang={lang}
              currentUser={currentUser}
            />
          </div>
        </div>
      </main>

      <PromptEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSavePrompt}
        initialData={editingPrompt}
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

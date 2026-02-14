import React, { useState, useEffect } from 'react';
import { Prompt, Category, Language, Visibility, User } from '../types';
import { Icons } from './Icon';
import { t } from '../utils/translations';
import { generateId } from '../utils/generateId';

interface PromptEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (prompt: Prompt) => void;
  initialData?: Prompt | null;
  categories: Category[];
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  lang: Language;
  currentUser: User;
}

export const PromptEditor: React.FC<PromptEditorProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData,
  categories,
  addToast,
  lang,
  currentUser
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('private');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setContent(initialData.content);
      setDescription(initialData.description || '');
      setCategoryId(initialData.categoryId);
      setTags(initialData.tags || []);
      setVisibility(initialData.visibility || 'private');
    } else {
      resetForm();
    }
  }, [initialData, isOpen, categories]);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setDescription('');
    // Default to first category (usually Coding) or Other
    const defaultCat = categories.find(c => c.id === 'other') || categories[0];
    setCategoryId(defaultCat ? defaultCat.id : '');
    setTags([]);
    setTagInput('');
    setVisibility('private');
  };

  const handleSave = () => {
    if (!title.trim() || !content.trim()) {
      addToast(t(lang, 'titleRequired'), 'error');
      return;
    }

    if (!categoryId) {
        addToast(t(lang, 'selectCategory'), 'error');
        return;
    }

    const newPrompt: Prompt = {
      id: initialData ? initialData.id : generateId(),
      title,
      content,
      description,
      categoryId,
      tags,
      createdAt: initialData ? initialData.createdAt : Date.now(),
      updatedAt: Date.now(),
      isFavorite: initialData ? initialData.isFavorite : false,
      userId: initialData ? initialData.userId : currentUser.id,
      authorName: initialData ? initialData.authorName : currentUser.name,
      visibility
    };

    onSave(newPrompt);
    onClose();
    resetForm();
    addToast(initialData ? t(lang, 'promptUpdated') : t(lang, 'promptSaved'), 'success');
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-5xl h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-colors duration-200">
        
        {/* Header */}
        <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/50 dark:bg-slate-900/50 backdrop-blur">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                {initialData ? <Icons.Edit size={24} className="text-indigo-600 dark:text-indigo-400"/> : <Icons.Plus size={24} className="text-indigo-600 dark:text-indigo-400"/>}
            </div>
            {initialData ? t(lang, 'editPrompt') : t(lang, 'createPrompt')}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
            <Icons.Close size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50 dark:bg-slate-950">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 h-full">
            {/* Left Column: Metadata (4 cols) */}
            <div className="md:col-span-4 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{t(lang, 'titleLabel')}</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., React Component Generator"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder-slate-400 dark:placeholder-slate-600 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{t(lang, 'categoryLabel')}</label>
                <div className="relative">
                    <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none cursor-pointer shadow-sm"
                    >
                    <option value="" disabled>{t(lang, 'selectCategory')}</option>
                    {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                    </select>
                    <Icons.ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none w-4 h-4"/>
                </div>
              </div>

              {/* Visibility Toggle */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{t(lang, 'visibilityLabel')}</label>
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => setVisibility('private')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all shadow-sm
                            ${visibility === 'private'
                                ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-600 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-600'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }
                        `}
                    >
                        <Icons.Lock size={16} />
                        {t(lang, 'private')}
                    </button>
                    <button
                        type="button"
                        onClick={() => setVisibility('public')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all shadow-sm
                            ${visibility === 'public'
                                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-600 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-600'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }
                        `}
                    >
                        <Icons.Globe size={16} />
                        {t(lang, 'public')}
                    </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{t(lang, 'descLabel')}</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="..."
                  rows={3}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none placeholder-slate-400 dark:placeholder-slate-600 resize-none shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{t(lang, 'tagsLabel')}</label>
                <div className="flex flex-wrap gap-2 mb-2 min-h-[38px] p-1">
                  {tags.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold border border-indigo-100 dark:border-indigo-500/20">
                      #{tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-indigo-800 dark:hover:text-white"><Icons.Close size={12}/></button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="Enter..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none placeholder-slate-400 dark:placeholder-slate-600 shadow-sm"
                />
              </div>
            </div>

            {/* Right Column: Content Editor (8 cols) */}
            <div className="md:col-span-8 flex flex-col h-full min-h-[400px]">
              <div className="mb-3">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t(lang, 'contentLabel')}</label>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="..."
                className="flex-1 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 text-slate-900 dark:text-white font-mono text-sm leading-relaxed focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none placeholder-slate-400 dark:placeholder-slate-600 shadow-sm"
                spellCheck={false}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-4 shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors"
          >
            {t(lang, 'cancelBtn')}
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-3 rounded-xl bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/20 dark:shadow-indigo-900/30 transition-all transform hover:translate-y-px flex items-center gap-2"
          >
            <Icons.Save size={18} />
            {t(lang, 'saveBtn')}
          </button>
        </div>
      </div>
    </div>
  );
};

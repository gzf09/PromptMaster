import React from 'react';
import { Prompt, Category, Language, User } from '../types';
import { Icons } from './Icon';
import { t } from '../utils/translations';

interface PromptListProps {
  prompts: Prompt[];
  categories: Category[];
  onEdit: (prompt: Prompt) => void;
  onDelete: (id: string) => void;
  onCopy: (content: string) => void;
  onToggleFavorite: (id: string) => void;
  lang: Language;
  currentUser: User;
}

export const PromptList: React.FC<PromptListProps> = ({
  prompts,
  categories,
  onEdit,
  onDelete,
  onCopy,
  onToggleFavorite,
  lang,
  currentUser
}) => {
  const [detailPrompt, setDetailPrompt] = React.useState<Prompt | null>(null);

  if (prompts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500 dark:text-slate-400">
        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
            <Icons.Folder size={40} className="opacity-50" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-200 mb-2">{t(lang, 'noPromptsTitle')}</h3>
        <p className="text-sm">{t(lang, 'noPromptsDesc')}</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
        {prompts.map((prompt) => (
          <PromptCard
            key={prompt.id}
            prompt={prompt}
            categories={categories}
            onEdit={onEdit}
            onDelete={onDelete}
            onCopy={onCopy}
            onToggleFavorite={onToggleFavorite}
            onViewDetail={setDetailPrompt}
            lang={lang}
            currentUser={currentUser}
          />
        ))}
      </div>

      {detailPrompt && (
        <PromptDetail
          prompt={detailPrompt}
          categories={categories}
          onClose={() => setDetailPrompt(null)}
          onCopy={onCopy}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleFavorite={onToggleFavorite}
          lang={lang}
          currentUser={currentUser}
        />
      )}
    </>
  );
};

interface PromptCardProps {
  prompt: Prompt;
  categories: Category[];
  onEdit: (prompt: Prompt) => void;
  onDelete: (id: string) => void;
  onCopy: (content: string) => void;
  onToggleFavorite: (id: string) => void;
  onViewDetail: (prompt: Prompt) => void;
  lang: Language;
  currentUser: User;
}

const PromptCard: React.FC<PromptCardProps> = ({ prompt, categories, onEdit, onDelete, onCopy, onToggleFavorite, onViewDetail, lang, currentUser }) => {
  const [copied, setCopied] = React.useState(false);
  const isGuest = currentUser.role === 'guest';

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopy(prompt.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Find category name
  const category = categories.find(c => c.id === prompt.categoryId);
  const categoryName = category ? category.name : t(lang, 'unknownCategory');

  // Truncate content for preview
  const preview = prompt.content.length > 150
    ? prompt.content.slice(0, 150) + '...'
    : prompt.content;

  const isOwner = prompt.userId === currentUser.id;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(t(lang, 'deleteConfirm'))) {
      onDelete(prompt.id);
    }
  };

  return (
    <div
      onClick={() => onViewDetail(prompt)}
      className={`group relative flex flex-col h-full p-5 rounded-2xl border transition-all duration-300 cursor-pointer
        bg-white dark:bg-slate-900
        ${isOwner
            ? 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500/30 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10'
            : 'border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-500/30 shadow-sm hover:shadow-xl hover:shadow-emerald-500/10'
        }
    `}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex flex-col gap-2 w-full">
            <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        {categoryName}
                    </span>
                    {prompt.visibility === 'public' && <Icons.Globe size={12} className="text-emerald-500" title={t(lang, 'public')} />}
                    {prompt.visibility === 'private' && <Icons.Lock size={12} className="text-slate-400" title={t(lang, 'private')} />}
                </div>
                {/* Author Badge if not owner */}
                {!isOwner && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                        <Icons.User size={10} className="text-slate-400"/>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{prompt.authorName}</span>
                    </div>
                )}
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight mt-1 line-clamp-1 pr-12">{prompt.title}</h3>
        </div>
      </div>

      {/* Action Bar (Top Right Overlay) */}
      {!isGuest && (
          <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-white/90 dark:bg-slate-800/90 backdrop-blur rounded-lg p-1 border border-slate-100 dark:border-slate-700 shadow-sm">
                <button
                    onClick={(e) => { e.stopPropagation(); onToggleFavorite(prompt.id); }}
                    className={`p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${prompt.isFavorite ? 'text-amber-500' : 'text-slate-400'}`}
                    title={t(lang, 'favorites')}
                >
                    <Icons.Star size={16} className={prompt.isFavorite ? "fill-amber-500" : ""} />
                </button>
                {isOwner && (
                    <>
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(prompt); }}
                            className="p-1.5 rounded-md text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            title={t(lang, 'editPrompt')}
                        >
                            <Icons.Edit size={16} />
                        </button>
                        <button
                            onClick={handleDelete}
                            className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            title="Delete"
                        >
                            <Icons.Trash size={16} />
                        </button>
                    </>
                )}
          </div>
      )}

      <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 leading-relaxed font-mono bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/50 p-4 rounded-xl flex-1 overflow-hidden">
        {preview}
      </p>

      <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex gap-2 overflow-hidden">
          {prompt.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-[10px] font-medium text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-md border border-indigo-100 dark:border-indigo-500/10 whitespace-nowrap">
              #{tag}
            </span>
          ))}
          {prompt.tags.length > 3 && (
            <span className="text-xs text-slate-400 py-1">+ {prompt.tags.length - 3}</span>
          )}
        </div>

        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all
            ${copied
              ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }
          `}
        >
          {copied ? <Icons.Check size={14} /> : <Icons.Copy size={14} />}
          {copied ? t(lang, 'copiedBtn') : t(lang, 'copyBtn')}
        </button>
      </div>
    </div>
  );
};

// --- Prompt Detail Modal ---

interface PromptDetailProps {
  prompt: Prompt;
  categories: Category[];
  onClose: () => void;
  onCopy: (content: string) => void;
  onEdit: (prompt: Prompt) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  lang: Language;
  currentUser: User;
}

const PromptDetail: React.FC<PromptDetailProps> = ({ prompt, categories, onClose, onCopy, onEdit, onDelete, onToggleFavorite, lang, currentUser }) => {
  const [copied, setCopied] = React.useState(false);
  const isOwner = prompt.userId === currentUser.id;
  const isGuest = currentUser.role === 'guest';

  const category = categories.find(c => c.id === prompt.categoryId);
  const categoryName = category ? category.name : t(lang, 'unknownCategory');

  const handleCopy = () => {
    onCopy(prompt.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = () => {
    if (confirm(t(lang, 'deleteConfirm'))) {
      onDelete(prompt.id);
      onClose();
    }
  };

  const createdDate = new Date(prompt.createdAt).toLocaleDateString();
  const updatedDate = new Date(prompt.updatedAt).toLocaleDateString();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-3xl max-h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between bg-white/50 dark:bg-slate-900/50 backdrop-blur shrink-0">
          <div className="flex-1 min-w-0 mr-4">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                {categoryName}
              </span>
              {prompt.visibility === 'public'
                ? <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><Icons.Globe size={10} />{t(lang, 'public')}</span>
                : <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center gap-1"><Icons.Lock size={10} />{t(lang, 'private')}</span>
              }
              {!isOwner && (
                <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Icons.User size={10} />{prompt.authorName}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">{prompt.title}</h2>
            {prompt.description && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{prompt.description}</p>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors shrink-0">
            <Icons.Close size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-slate-950">
          <pre className="whitespace-pre-wrap break-words text-sm leading-relaxed font-mono text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
            {prompt.content}
          </pre>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
          {/* Tags */}
          {prompt.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {prompt.tags.map(tag => (
                <span key={tag} className="text-xs font-medium text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 px-2.5 py-1 rounded-md border border-indigo-100 dark:border-indigo-500/10">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-400 dark:text-slate-500 space-x-4">
              <span>{t(lang, 'createdAt')}: {createdDate}</span>
              <span>{t(lang, 'updatedAt')}: {updatedDate}</span>
            </div>

            <div className="flex items-center gap-2">
              {!isGuest && (
                <button
                  onClick={() => onToggleFavorite(prompt.id)}
                  className={`p-2 rounded-lg transition-colors ${prompt.isFavorite ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  title={t(lang, 'favorites')}
                >
                  <Icons.Star size={18} className={prompt.isFavorite ? "fill-amber-500" : ""} />
                </button>
              )}
              {isOwner && (
                <>
                  <button
                    onClick={() => { onEdit(prompt); onClose(); }}
                    className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title={t(lang, 'editPrompt')}
                  >
                    <Icons.Edit size={18} />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title={t(lang, 'deleteUser')}
                  >
                    <Icons.Trash size={18} />
                  </button>
                </>
              )}
              <button
                onClick={handleCopy}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all
                  ${copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : 'bg-slate-900 dark:bg-indigo-600 text-white hover:bg-slate-800 dark:hover:bg-indigo-500'
                  }
                `}
              >
                {copied ? <Icons.Check size={16} /> : <Icons.Copy size={16} />}
                {copied ? t(lang, 'copiedBtn') : t(lang, 'copyBtn')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

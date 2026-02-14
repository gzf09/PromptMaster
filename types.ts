export type Language = 'zh' | 'en';
export type Theme = 'light' | 'dark';
export type UserRole = 'admin' | 'user' | 'guest';

export interface User {
  id: string;
  name: string;
  avatar: string; // Initials or simple string
  role: UserRole;
  password?: string; // Simulated password for frontend-only auth
  isFirstLogin?: boolean;
}

export interface Category {
  id: string;
  name: string;
  type: 'system' | 'user';
  icon?: string; // Icon name from lucide-react
  userId?: string; // Optional: if created by a specific user
}

export type Visibility = 'public' | 'private';

export interface Prompt {
  id: string;
  title: string;
  content: string;
  description?: string;
  categoryId: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  isFavorite: boolean;
  userId: string;        // Owner
  authorName: string;    // Display name
  visibility: Visibility; // 'public' or 'private'
}

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

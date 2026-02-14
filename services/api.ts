import { User, Prompt, Category, UserRole } from '../types';

const API_BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('promptmaster_token');
}

function setToken(token: string): void {
  localStorage.setItem('promptmaster_token', token);
}

function clearToken(): void {
  localStorage.removeItem('promptmaster_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  return res.json();
}

// Auth
export async function login(username: string, password: string): Promise<{ token: string; user: User }> {
  const data = await request<{ token: string; user: User }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  setToken(data.token);
  return data;
}

export async function getMe(): Promise<User> {
  return request<User>('/auth/me');
}

export async function changePassword(newPassword: string): Promise<{ token: string; user: User }> {
  const data = await request<{ token: string; user: User }>('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ newPassword }),
  });
  setToken(data.token);
  return data;
}

export function logout(): void {
  clearToken();
}

export function hasToken(): boolean {
  return !!getToken();
}

// Prompts
export async function fetchPrompts(): Promise<Prompt[]> {
  return request<Prompt[]>('/prompts');
}

export async function fetchPublicPrompts(): Promise<Prompt[]> {
  return request<Prompt[]>('/prompts/public');
}

export async function createPrompt(data: {
  title: string;
  content: string;
  description?: string;
  categoryId: string;
  tags?: string[];
  visibility?: string;
}): Promise<Prompt> {
  return request<Prompt>('/prompts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updatePrompt(id: string, data: {
  title?: string;
  content?: string;
  description?: string;
  categoryId?: string;
  tags?: string[];
  visibility?: string;
}): Promise<Prompt> {
  return request<Prompt>(`/prompts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deletePrompt(id: string): Promise<void> {
  await request<{ success: boolean }>(`/prompts/${id}`, {
    method: 'DELETE',
  });
}

export async function toggleFavorite(id: string): Promise<{ isFavorite: boolean }> {
  return request<{ isFavorite: boolean }>(`/prompts/${id}/favorite`, {
    method: 'POST',
  });
}

// Categories
export async function fetchCategories(): Promise<Category[]> {
  return request<Category[]>('/categories');
}

export async function createCategory(name: string, icon?: string): Promise<Category> {
  return request<Category>('/categories', {
    method: 'POST',
    body: JSON.stringify({ name, icon }),
  });
}

export async function deleteCategory(id: string): Promise<void> {
  await request<{ success: boolean }>(`/categories/${id}`, {
    method: 'DELETE',
  });
}

// Users
export async function fetchUsers(): Promise<User[]> {
  return request<User[]>('/users');
}

export async function createUser(name: string, role: UserRole): Promise<User> {
  return request<User>('/users', {
    method: 'POST',
    body: JSON.stringify({ name, role }),
  });
}

export async function deleteUser(id: string): Promise<void> {
  await request<{ success: boolean }>(`/users/${id}`, {
    method: 'DELETE',
  });
}

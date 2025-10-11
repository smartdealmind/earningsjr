const API = import.meta.env.VITE_API_BASE ?? '';

export async function api(path: string, init: RequestInit = {}) {
  const res = await fetch(API + path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
    ...init
  });
  return res;
}

export const Api = {
  me: () => api('/me').then(r => r.json()),
  templates: (age?: number) => api('/templates' + (age != null ? `?age=${age}` : '')).then(r => r.json()),
  createKid: (display_name: string, birthdate?: string, pin?: string) =>
    api('/kids', { method: 'POST', body: JSON.stringify({ display_name, birthdate, pin }) }).then(r => r.json()),
  createChoresFromTemplates: (templateIds: string[], kid_user_id?: string, due_at?: number) =>
    api('/chores', { method: 'POST', body: JSON.stringify({ from_template_ids: templateIds, kid_user_id, due_at }) }).then(r => r.json()),
  listChores: (status?: string) => api('/chores' + (status ? `?status=${status}` : '')).then(r => r.json()),
  approve: (id: string) => api(`/chores/${id}/approve`, { method: 'POST' }).then(r => r.json()),
  deny: (id: string) => api(`/chores/${id}/deny`, { method: 'POST' }).then(r => r.json())
};


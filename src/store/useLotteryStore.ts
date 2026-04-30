import { create } from 'zustand';

interface LotteryRecord {
  period: string;
  front_zone: string;
  back_zone: string;
  draw_date: string;
  created_at: string;
}

interface LotteryStats {
  frontHot: { number: number; count: number }[];
  backHot: { number: number; count: number }[];
  totalRecords: number;
}

interface LotteryStore {
  records: LotteryRecord[];
  stats: LotteryStats | null;
  loading: boolean;
  syncing: boolean;
  error: string | null;
  fetchLatest: (limit?: number) => Promise<void>;
  fetchStats: () => Promise<void>;
  syncData: () => Promise<{ syncedCount: number; message: string }>;
}

export const useLotteryStore = create<LotteryStore>((set) => ({
  records: [],
  stats: null,
  loading: false,
  syncing: false,
  error: null,
  
  fetchLatest: async (limit = 10) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/lottery/latest?limit=${limit}` : `/api/lottery/latest?limit=${limit}`);
      
      if (!res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const errJson = await res.json().catch(() => null);
          throw new Error(errJson?.error || `请求失败 (${res.status})`);
        }
        const text = await res.text().catch(() => '');
        throw new Error(`请求失败 (${res.status}): ${text.slice(0, 120)}`);
      }
      
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('接口返回格式错误，未连接到正确的后端服务');
      }

      const data = await res.json();
      if (data.success) {
        set({ records: data.data, loading: false });
      } else {
        set({ error: data.error, loading: false });
      }
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchStats: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/lottery/stats` : '/api/lottery/stats');
      
      if (!res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const errJson = await res.json().catch(() => null);
          throw new Error(errJson?.error || `请求失败 (${res.status})`);
        }
        const text = await res.text().catch(() => '');
        throw new Error(`请求失败 (${res.status}): ${text.slice(0, 120)}`);
      }
      
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('接口返回格式错误，未连接到正确的后端服务');
      }

      const data = await res.json();
      if (data.success) {
        set({ stats: data.data, loading: false });
      } else {
        set({ error: data.error, loading: false });
      }
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  syncData: async () => {
    set({ syncing: true, error: null });
    try {
      const res = await fetch(import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/lottery/sync` : '/api/lottery/sync', { method: 'POST' });
      
      if (!res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const errJson = await res.json().catch(() => null);
          throw new Error(errJson?.error || `请求失败 (${res.status})`);
        }
        const text = await res.text().catch(() => '');
        throw new Error(`请求失败 (${res.status}): ${text.slice(0, 120)}`);
      }
      
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('接口返回格式错误，未连接到正确的后端服务');
      }

      const data = await res.json();
      if (data.success) {
        set({ syncing: false });
        return data.data;
      } else {
        set({ error: data.error, syncing: false });
        throw new Error(data.error);
      }
    } catch (err: any) {
      set({ error: err.message, syncing: false });
      throw err;
    }
  }
}));

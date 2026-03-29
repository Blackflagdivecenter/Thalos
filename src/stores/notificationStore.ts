import { create } from 'zustand';
import { NotificationService } from '@/src/services/NotificationService';
import type { AppNotification } from '@/src/models';

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;

  load: () => Promise<void>;
  refreshCount: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  load: async () => {
    set({ loading: true });
    try {
      const [notifications, unreadCount] = await Promise.all([
        NotificationService.getNotifications(),
        NotificationService.getUnreadCount(),
      ]);
      set({ notifications, unreadCount });
    } catch (e) {
      console.warn('[NotificationStore] load error:', e);
    } finally {
      set({ loading: false });
    }
  },

  refreshCount: async () => {
    try {
      const unreadCount = await NotificationService.getUnreadCount();
      set({ unreadCount });
    } catch { /* silent */ }
  },

  markRead: async (id) => {
    try {
      await NotificationService.markRead(id);
      set(s => ({
        notifications: s.notifications.map(n => n.id === id ? { ...n, isRead: true } : n),
        unreadCount: Math.max(0, s.unreadCount - 1),
      }));
    } catch { /* silent */ }
  },

  markAllRead: async () => {
    try {
      await NotificationService.markAllRead();
      set(s => ({
        notifications: s.notifications.map(n => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch { /* silent */ }
  },
}));

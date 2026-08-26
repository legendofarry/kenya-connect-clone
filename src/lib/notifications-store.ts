import { useSyncExternalStore } from "react";

export type NotifyKind = "success" | "error" | "info" | "warning";

export type AppNotification = {
  id: string;
  kind: NotifyKind;
  title: string;
  description?: string | undefined;
  createdAt: number;
  read: boolean;
};

export type BannerNotification = AppNotification & { duration: number };

const STORAGE_KEY = "candid.notifications.v1";
const MAX_STORED = 60;

let notifications: AppNotification[] = [];
let banners: BannerNotification[] = [];
let hydrated = false;

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  hydrate();
  return () => listeners.delete(listener);
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppNotification[];
      if (Array.isArray(parsed)) {
        notifications = parsed.slice(0, MAX_STORED);
        emit();
      }
    }
  } catch {
    /* ignore corrupt storage */
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, MAX_STORED)));
  } catch {
    /* storage full or unavailable */
  }
}

function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function dismissBanner(id: string) {
  banners = banners.filter((b) => b.id !== id);
  emit();
}

export function pushNotification(
  kind: NotifyKind,
  title: string,
  options?: { description?: string; duration?: number; silent?: boolean; persist?: boolean },
) {
  const item: AppNotification = {
    id: newId(),
    kind,
    title,
    description: options?.description,
    createdAt: Date.now(),
    read: false,
  };

  if (options?.persist !== false) {
    notifications = [item, ...notifications].slice(0, MAX_STORED);
    persist();
  }

  if (!options?.silent) {
    banners = [{ ...item, duration: options?.duration ?? (kind === "error" ? 6500 : 4500) }, ...banners].slice(0, 3);
  }

  emit();
  return item.id;
}

export const notify = {
  success: (title: string, options?: { description?: string; duration?: number }) =>
    pushNotification("success", title, options),
  error: (title: string, options?: { description?: string; duration?: number }) =>
    pushNotification("error", title, options),
  info: (title: string, options?: { description?: string; duration?: number }) =>
    pushNotification("info", title, options),
  warning: (title: string, options?: { description?: string; duration?: number }) =>
    pushNotification("warning", title, options),
};

export function markAllRead() {
  notifications = notifications.map((n) => (n.read ? n : { ...n, read: true }));
  persist();
  emit();
}

export function markRead(id: string) {
  notifications = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
  persist();
  emit();
}

export function removeNotification(id: string) {
  notifications = notifications.filter((n) => n.id !== id);
  persist();
  emit();
}

export function clearNotifications() {
  notifications = [];
  persist();
  emit();
}

const EMPTY: AppNotification[] = [];
const EMPTY_BANNERS: BannerNotification[] = [];

export function useNotifications() {
  return useSyncExternalStore(
    subscribe,
    () => notifications,
    () => EMPTY,
  );
}

export function useBanners() {
  return useSyncExternalStore(
    subscribe,
    () => banners,
    () => EMPTY_BANNERS,
  );
}

export function useUnreadCount() {
  return useSyncExternalStore(
    subscribe,
    () => notifications.reduce((total, n) => total + (n.read ? 0 : 1), 0),
    () => 0,
  );
}

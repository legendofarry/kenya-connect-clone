import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Bell, CheckCircle2, CheckCheck, Info, Trash2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  clearNotifications,
  markAllRead,
  markRead,
  removeNotification,
  useNotifications,
  type NotifyKind,
} from "@/lib/notifications-store";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Candid" },
      {
        name: "description",
        content: "Every alert, reply and update from your Candid activity in one place.",
      },
      { property: "og:title", content: "Notifications — Candid" },
      {
        property: "og:description",
        content: "Every alert, reply and update from your Candid activity in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NotificationsPage,
});

const kindMeta: Record<NotifyKind, { icon: typeof Info; tint: string; label: string }> = {
  success: { icon: CheckCircle2, tint: "text-emerald-400", label: "Success" },
  error: { icon: XCircle, tint: "text-rose-400", label: "Problem" },
  warning: { icon: AlertTriangle, tint: "text-amber-400", label: "Heads up" },
  info: { icon: Info, tint: "text-primary", label: "Update" },
};

function timeAgo(ts: number) {
  const diff = Math.max(0, Date.now() - ts);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

function NotificationsPage() {
  const notifications = useNotifications();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="mx-auto max-w-2xl">
      <header className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <span className="absolute inset-0 -z-10 rounded-2xl bg-primary/20 blur-xl" />
          <div className="rounded-2xl border border-border bg-secondary/50 p-3">
            <Bell className="size-5 text-primary" />
          </div>
        </div>
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            {unread > 0 ? `${unread} unread` : "You're all caught up"}
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={markAllRead} disabled={unread === 0}>
            <CheckCheck className="size-4" /> Mark all read
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearNotifications}
            disabled={notifications.length === 0}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </header>

      <div className="mt-6 space-y-2">
        {notifications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <Bell className="mx-auto size-6 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">No notifications yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Alerts about your stories, comments and salary reports will show up here.
            </p>
          </div>
        ) : (
          notifications.map((n) => {
            const meta = kindMeta[n.kind];
            const Icon = meta.icon;
            return (
              <article
                key={n.id}
                onClick={() => markRead(n.id)}
                className={cn(
                  "group relative flex cursor-pointer items-start gap-3 overflow-hidden rounded-2xl border border-border p-4 transition-colors hover:bg-secondary/40",
                  !n.read && "bg-secondary/30",
                )}
              >
                {!n.read ? (
                  <span className="absolute inset-y-0 left-0 w-1 bg-primary" aria-hidden />
                ) : null}
                <span className={cn("mt-0.5 shrink-0", meta.tint)}>
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {meta.label}
                    </span>
                    <span className="text-[11px] text-muted-foreground">· {timeAgo(n.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-sm font-medium leading-snug">{n.title}</p>
                  {n.description ? (
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{n.description}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  aria-label="Remove notification"
                  onClick={(event) => {
                    event.stopPropagation();
                    removeNotification(n.id);
                  }}
                  className="rounded-full p-1 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                >
                  <Trash2 className="size-4" />
                </button>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}

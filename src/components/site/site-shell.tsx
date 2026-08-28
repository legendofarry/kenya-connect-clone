import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  Building2,
  Flame,
  Home,
  LogOut,
  PenLine,
  Search,
  Trophy,
  UserRound,
  Wallet,
} from "lucide-react";
import { BiometricGate } from "@/components/site/biometric-gate";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { SplashScreen } from "@/components/site/splash-screen";
import { RouteProgress } from "@/components/site/route-progress";
import { NotificationBanners } from "@/components/site/notification-banners";
import { useUnreadCount } from "@/lib/notifications-store";
import { useAuth } from "@/hooks/useAuth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";


const nav = [
  { to: "/", label: "Feed", icon: Home },
  { to: "/companies", label: "Companies", icon: Building2 },
  { to: "/leaderboards", label: "Leaderboards", icon: Trophy },
  { to: "/salaries", label: "Salaries", icon: Wallet },
  { to: "/search", label: "Search", icon: Search },
  { to: "/profile", label: "Profile", icon: UserRound },
] as const;

export function SiteShell({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const unread = useUnreadCount();
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <SplashScreen />
      <RouteProgress />
      <NotificationBanners />
      <header className="sticky top-0 z-40 border-b border-border glass-card">

        <div className="app-shell flex h-16 items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <Flame className="size-5 text-primary" />
            <span className="font-display text-lg font-semibold tracking-tight">Candid</span>
          </Link>

          <nav className="ml-6 hidden items-center gap-1 md:flex">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
                  pathname === item.to && "bg-secondary text-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link
              to="/notifications"
              aria-label="Notifications"
              className={cn(
                "relative inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
                pathname === "/notifications" && "bg-secondary text-foreground",
              )}
            >
              <Bell className="size-4" />
              {unread > 0 ? (
                <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                  {unread > 9 ? "9+" : unread}
                </span>
              ) : null}
            </Link>
            <Link
              to="/profile"
              aria-label="Profile and settings"
              className={cn(
                "inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
                pathname === "/profile" && "bg-secondary text-foreground",
              )}
            >
              <UserRound className="size-4" />
            </Link>
            <ThemeToggle />
            <Button asChild size="sm" className="glow-primary">
              <Link to="/post">
                <PenLine className="size-4" /> Post a story
              </Link>
            </Button>
            {user ? (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Sign out"
                onClick={() => setConfirmSignOut(true)}
              >
                <LogOut className="size-4" />
              </Button>
            ) : (
              <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
                <Link to="/auth">Sign in</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="app-shell pb-28 pt-6 md:pb-16">
        <BiometricGate>{children}</BiometricGate>
      </main>

      <footer className="border-t border-border py-10 text-sm text-muted-foreground">
        <div className="app-shell flex flex-wrap gap-x-6 gap-y-2">
          <Link to="/about" className="hover:text-foreground">
            About
          </Link>
          <Link to="/guidelines" className="hover:text-foreground">
            Community guidelines
          </Link>
          <Link to="/rights" className="hover:text-foreground">
            Safety &amp; your rights
          </Link>
          <Link to="/privacy" className="hover:text-foreground">
            Privacy &amp; disclaimer
          </Link>
          <span className="w-full pt-2 text-xs">
            Stories are personal opinions of anonymous contributors. Employers have a right of
            reply.
          </span>
        </div>
      </footer>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border glass-card md:hidden">
        <div className="grid grid-cols-6">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground transition-colors",
                  active && "text-primary",
                )}
              >
                <Icon className="size-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <AlertDialog open={confirmSignOut} onOpenChange={setConfirmSignOut}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out of Candid?</AlertDialogTitle>
            <AlertDialogDescription>
              You will need to sign in again to post stories, comment or vote.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay signed in</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmSignOut(false);
                void signOut();
              }}
            >
              Sign out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

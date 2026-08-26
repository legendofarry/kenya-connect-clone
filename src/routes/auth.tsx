import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  getAdditionalUserInfo,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { toast } from "sonner";
import { EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { firebaseAuth } from "@/integrations/firebase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in anonymously | Candid" },
      {
        name: "description",
        content:
          "Create a free Candid account to post exit stories, vote and comment. Your name and email are never shown — you appear only as an anonymous handle.",
      },
      { property: "og:title", content: "Sign in anonymously | Candid" },
      {
        property: "og:description",
        content: "Accounts keep the platform honest. Your identity stays hidden from everyone.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        await createUserWithEmailAndPassword(firebaseAuth, email, password);
        toast.success("Account created.");
      } else {
        await signInWithEmailAndPassword(firebaseAuth, email, password);
        toast.success("Signed in. You are anonymous to everyone else.");
      }
      navigate({ to: "/" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md animate-rise">
      <div className="glass-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-2 text-primary">
          <EyeOff className="size-5" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Anonymous by design
          </span>
        </div>
        <h1 className="mt-3 text-2xl font-semibold">
          {mode === "signin" ? "Sign in" : "Create an account"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Accounts stop spam and duplicate votes. Stories are shown under a random handle — never
          your email or name.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
            />
          </div>
          <Button type="submit" disabled={busy} className="w-full glow-primary">
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            {mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>

        <p className="mt-6 flex items-start gap-2 rounded-xl bg-secondary/60 p-3 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-verified" />
          Use a personal email, not your work email. We never publish emails, and employers cannot
          see who posted.
        </p>
      </div>
    </div>
  );
}

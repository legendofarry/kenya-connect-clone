import { Link } from "@tanstack/react-router";
import { ArrowBigUp, MapPin, MessageSquare, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type PublicStory = {
  id: string | null;
  title: string | null;
  body: string | null;
  company_name: string | null;
  company_slug: string | null;
  role_level: string | null;
  county: string | null;
  tenure: string | null;
  industry: string | null;
  upvotes: number | null;
  metoo: number | null;
  comment_count: number | null;
  created_at: string | null;
  reasons: string[] | null;
  would_work_again?: boolean | null;
};

export function reasonTone(reason: string) {
  return reason === "good exit" ? "verified" : "danger";
}

export function StoryCard({ story, index = 0 }: { story: PublicStory; index?: number }) {
  return (
    <article
      className="animate-rise rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition-transform hover:-translate-y-0.5"
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
    >
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {story.company_slug ? (
          <Link
            to="/companies/$slug"
            params={{ slug: story.company_slug }}
            className="font-semibold text-foreground hover:text-primary"
          >
            {story.company_name}
          </Link>
        ) : (
          <span className="font-semibold text-foreground">{story.company_name}</span>
        )}
        <span>·</span>
        <span>{story.industry}</span>
        <span className="inline-flex items-center gap-1">
          <MapPin className="size-3" />
          {story.county}
        </span>
        {story.tenure ? <span>· {story.tenure}</span> : null}
        {story.role_level ? <span>· {story.role_level}</span> : null}
      </div>

      <h3 className="mt-2 text-lg font-semibold leading-snug">
        {story.id ? (
          <Link to="/stories/$id" params={{ id: story.id }} className="hover:text-primary">
            {story.title}
          </Link>
        ) : (
          story.title
        )}
      </h3>

      <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{story.body}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {(story.reasons ?? []).map((reason) => (
          <Badge
            key={reason}
            variant="outline"
            className={
              reasonTone(reason) === "verified"
                ? "border-verified/40 text-verified"
                : "border-danger/40 text-danger"
            }
          >
            {reason}
          </Badge>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <ArrowBigUp className="size-4 text-primary" /> {story.upvotes ?? 0}
        </span>
        <span className="inline-flex items-center gap-1">
          <Users className="size-4" /> {story.metoo ?? 0} me too
        </span>
        <span className="inline-flex items-center gap-1">
          <MessageSquare className="size-4" /> {story.comment_count ?? 0}
        </span>
        <span className="ml-auto">Anonymous · {formatDate(story.created_at)}</span>
      </div>
    </article>
  );
}

export function formatDate(value: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

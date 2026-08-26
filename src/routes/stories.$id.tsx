import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowBigUp, Flag, MapPin, Users } from "lucide-react";
import { notify as toast } from "@/lib/notifications-store";
import { getStory } from "@/lib/public.functions";
import { addComment, castVote, submitReport } from "@/lib/actions.functions";
import { formatDate, reasonTone } from "@/components/site/story-card";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BackButton } from "@/components/site/back-button";

const storyQuery = (id: string) =>
  queryOptions({ queryKey: ["story", id], queryFn: () => getStory({ data: { id } }) });

export const Route = createFileRoute("/stories/$id")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(storyQuery(params.id));
    if (!data) throw notFound();
    return { title: data.story.title, company: data.story.company_name, body: data.story.body };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Story unavailable | Candid" }, { name: "robots", content: "noindex" }],
      };
    }
    const title = `${loaderData.title} — ${loaderData.company} | Candid`;
    const description = (loaderData.body ?? "").slice(0, 150);
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
      ],
    };
  },
  component: StoryPage,
});

function StoryPage() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(storyQuery(id));
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const vote = useServerFn(castVote);
  const comment = useServerFn(addComment);
  const report = useServerFn(submitReport);
  const [body, setBody] = useState("");

  const voteMutation = useMutation({
    mutationFn: (kind: "up" | "metoo") => vote({ data: { story_id: id, kind } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["story", id] }),
    onError: (error: Error) => toast.error(error.message),
  });

  const commentMutation = useMutation({
    mutationFn: () => comment({ data: { story_id: id, parent_id: null, body } }),
    onSuccess: () => {
      setBody("");
      toast.success("Comment posted anonymously");
      queryClient.invalidateQueries({ queryKey: ["story", id] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!data) return null;
  const { story, comments } = data;

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <BackButton fallback="/" />
      <div className="animate-fade">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {story.company_slug ? (
            <Link
              to="/companies/$slug"
              params={{ slug: story.company_slug }}
              className="font-semibold text-foreground hover:text-primary"
            >
              {story.company_name}
            </Link>
          ) : null}
          <span>· {story.industry}</span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3" /> {story.county}
          </span>
          <span>· {story.tenure}</span>
          <span>· {story.role_level}</span>
        </div>
        <h1 className="mt-3 text-3xl font-semibold leading-tight md:text-4xl">{story.title}</h1>
        <p className="mt-2 text-xs text-muted-foreground">
          Anonymous contributor · {formatDate(story.created_at)}
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
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

      <div className="whitespace-pre-line rounded-2xl border border-border bg-card p-6 leading-relaxed">
        {story.body}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          disabled={!user || voteMutation.isPending}
          onClick={() => voteMutation.mutate("up")}
        >
          <ArrowBigUp className="size-4 text-primary" /> Upvote {story.upvotes ?? 0}
        </Button>
        <Button
          variant="outline"
          disabled={!user || voteMutation.isPending}
          onClick={() => voteMutation.mutate("metoo")}
        >
          <Users className="size-4" /> This happened to me too {story.metoo ?? 0}
        </Button>
        <Button
          variant="ghost"
          className="ml-auto text-danger"
          disabled={!user}
          onClick={() =>
            report({
              data: { target_type: "story", target_id: id, reason: "user report", detail: null },
            })
              .then(() => toast.success("Report sent to moderators"))
              .catch((error: Error) => toast.error(error.message))
          }
        >
          <Flag className="size-4" /> Report
        </Button>
      </div>

      {!user ? (
        <p className="rounded-2xl border border-border p-4 text-sm text-muted-foreground">
          <Link to="/auth" className="font-medium text-primary">
            Sign in
          </Link>{" "}
          to upvote, add “me too” or comment. Your identity is never shown.
        </p>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{comments.length} comments</h2>
        {user ? (
          <div className="space-y-2">
            <Textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Add context, or share what happened to you. No names of individuals."
              rows={3}
            />
            <Button
              disabled={body.trim().length < 2 || commentMutation.isPending}
              onClick={() => commentMutation.mutate()}
            >
              Post anonymously
            </Button>
          </div>
        ) : null}

        <ul className="space-y-3">
          {comments.map((item) => (
            <li key={item.id} className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground">
                {item.author_handle} · {formatDate(item.created_at)}
              </p>
              <p className="mt-1.5 text-sm">{item.body}</p>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}

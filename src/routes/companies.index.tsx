import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { listCompanyScores } from "@/lib/public.functions";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const companiesQuery = queryOptions({
  queryKey: ["company-scores"],
  queryFn: () => listCompanyScores(),
});

export const Route = createFileRoute("/companies/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(companiesQuery),
  head: () => ({
    meta: [
      { title: "Kenyan company directory — culture scores & red flags | Candid" },
      {
        name: "description",
        content:
          "Search Kenyan employers by industry and county. See culture scores for pay punctuality, statutory compliance, respect, workload and growth before you accept an offer.",
      },
      { property: "og:title", content: "Kenyan company directory — culture scores & red flags" },
      {
        property: "og:description",
        content: "Every employer tagged on Candid, with scores and AI-researched profiles.",
      },
    ],
  }),
  component: CompaniesPage,
});

type SortKey = "az" | "score" | "discussed";

function CompaniesPage() {
  const { data } = useSuspenseQuery(companiesQuery);
  const [q, setQ] = useState("");
  const [industry, setIndustry] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("discussed");

  const industries = useMemo(
    () => [...new Set(data.companies.map((c) => c.industry).filter(Boolean))].sort() as string[],
    [data.companies],
  );

  const rows = useMemo(() => {
    let list = data.companies.filter((c) =>
      q ? (c.name ?? "").toLowerCase().includes(q.toLowerCase()) : true,
    );
    if (industry) list = list.filter((c) => c.industry === industry);
    return [...list].sort((a, b) => {
      if (sort === "az") return (a.name ?? "").localeCompare(b.name ?? "");
      if (sort === "score") return Number(b.overall ?? 0) - Number(a.overall ?? 0);
      return Number(b.story_count ?? 0) - Number(a.story_count ?? 0);
    });
  }, [data.companies, q, industry, sort]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold md:text-4xl">Company directory</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Every employer Kenyans have tagged here, with culture scores from anonymous ratings and
          AI-researched background.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Search employers"
            className="pl-9"
          />
        </div>
        {(["discussed", "score", "az"] as SortKey[]).map((key) => (
          <button
            key={key}
            onClick={() => setSort(key)}
            className={cn(
              "rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground",
              sort === key && "border-primary/50 bg-primary/10 text-foreground",
            )}
          >
            {key === "discussed" ? "Most discussed" : key === "score" ? "Best rated" : "A–Z"}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {industries.map((option) => (
          <button
            key={option}
            onClick={() => setIndustry(industry === option ? null : option)}
            className={cn(
              "rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground",
              industry === option && "border-primary/50 bg-primary/10 text-foreground",
            )}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {rows.map((company, index) => (
          <Link
            key={company.company_id}
            to="/companies/$slug"
            params={{ slug: company.slug ?? "" }}
            className="animate-rise rounded-2xl border border-border bg-card p-5 transition-transform hover:-translate-y-0.5"
            style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">{company.name}</h2>
                <p className="text-xs text-muted-foreground">
                  {company.industry} · {company.county}
                </p>
              </div>
              <ScoreBadge value={company.overall} />
            </div>
            {company.descriptor ? (
              <p className="mt-3 text-sm text-muted-foreground">{company.descriptor}</p>
            ) : null}
            <p className="mt-3 text-xs text-muted-foreground">
              {Number(company.story_count ?? 0)} stories · {Number(company.rating_count ?? 0)}{" "}
              ratings
              {company.would_work_again_pct !== null
                ? ` · ${Math.round(Number(company.would_work_again_pct))}% would work here again`
                : ""}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function ScoreBadge({ value }: { value: number | string | null }) {
  if (value === null) {
    return <span className="rounded-full border border-border px-2 py-1 text-xs">No score</span>;
  }
  const score = Number(value);
  const tone = score >= 3.5 ? "text-verified" : score >= 2.5 ? "text-primary" : "text-danger";
  return (
    <span
      className={cn("rounded-full border border-border px-2.5 py-1 text-sm font-semibold", tone)}
    >
      {score.toFixed(1)}/5
    </span>
  );
}

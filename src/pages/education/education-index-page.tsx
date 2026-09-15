import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { EDUCATION_ARTICLES } from "@/data/education";

function EducationIndexPage() {
  useEffect(() => {
    document.title = "Education — SmartCapital";
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Education"
        description="Editorial, jargon-free explainers on how major asset classes actually work — written to inform, not to sell."
      />

      <div className="grid gap-5 sm:grid-cols-2">
        {EDUCATION_ARTICLES.map((article, index) => (
          <Link
            key={article.slug}
            to={`/education/${article.slug}`}
            className="group flex flex-col justify-between gap-6 rounded-xl border border-border bg-surface p-6 transition-colors hover:border-primary/40"
          >
            <div className="space-y-2.5">
              <span className="font-mono text-xs text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
              <h2 className="text-xl font-semibold tracking-tight text-foreground">{article.title}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{article.tagline}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
              Read the guide
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default EducationIndexPage;

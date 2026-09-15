import { useEffect } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getEducationArticle } from "@/data/education";

function EducationArticlePage({ slugOverride }: { slugOverride?: string }) {
  const { slug: paramsSlug = "" } = useParams();
  const activeSlug = slugOverride || paramsSlug;
  const article = getEducationArticle(activeSlug);

  useEffect(() => {
    if (article) document.title = `${article.title} — Education — SmartCapital`;
  }, [article]);

  if (!article) return <Navigate to="/education" replace />;

  return (
    <article className="mx-auto max-w-3xl space-y-10 pb-10">
      <div className="space-y-4">
        <Link to="/education" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to Education
        </Link>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{article.title}</h1>
          <p className="text-[15px] leading-relaxed text-muted-foreground">{article.tagline}</p>
        </div>
      </div>

      <Section title="What it is">
        <p className="text-[15px] leading-relaxed text-muted-foreground">{article.whatItIs}</p>
      </Section>

      <Section title="How it works">
        <ol className="space-y-3">
          {article.howItWorks.map((step, i) => (
            <li key={i} className="flex gap-3.5 text-[15px] leading-relaxed text-muted-foreground">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-xs font-semibold text-foreground">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Types">
        <div className="space-y-5">
          {article.types.map((type) => (
            <div key={type.name} className="border-l-2 border-primary/30 pl-4">
              <h3 className="text-base font-semibold text-foreground">{type.name}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{type.description}</p>
            </div>
          ))}
        </div>
      </Section>

      <div className="grid gap-8 sm:grid-cols-2">
        <Section title="Potential benefits">
          <ul className="space-y-2.5">
            {article.benefits.map((benefit, i) => (
              <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-success" />
                {benefit}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Risks">
          <ul className="space-y-2.5">
            {article.risks.map((risk, i) => (
              <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-destructive" />
                {risk}
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <Section title="Terminology">
        <dl className="divide-y divide-border rounded-lg border border-border">
          {article.terminology.map((item) => (
            <div key={item.term} className="grid gap-1 px-4 py-3.5 sm:grid-cols-[160px_1fr] sm:gap-4">
              <dt className="text-sm font-semibold text-foreground">{item.term}</dt>
              <dd className="text-sm leading-relaxed text-muted-foreground">{item.definition}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section title="Important considerations">
        <ul className="space-y-2.5">
          {article.considerations.map((item, i) => (
            <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
              {item}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Frequently asked questions">
        <div className="space-y-5">
          {article.faq.map((item) => (
            <div key={item.question}>
              <h3 className="text-[15px] font-semibold text-foreground">{item.question}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
            </div>
          ))}
        </div>
      </Section>

      <Alert variant="warning">
        <AlertTitle className="flex items-center gap-2">
          Educational content only <Badge variant="warning">Not financial advice</Badge>
        </AlertTitle>
        <AlertDescription>
          This guide is for general education and does not constitute personalized investment, legal, or tax advice.
          Consider your own circumstances and consult a licensed professional before making investment decisions.
        </AlertDescription>
      </Alert>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
      {children}
    </section>
  );
}

export default EducationArticlePage;

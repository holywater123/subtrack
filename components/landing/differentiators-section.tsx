interface Point {
  title: string;
  description: string;
}

const POINTS: Point[] = [
  {
    title: "All in one place",
    description:
      "No more juggling five apps and a spreadsheet - subscriptions, spending, debt, and net worth in a single dashboard.",
  },
  {
    title: "AI that knows your numbers",
    description:
      "Every answer is grounded in your actual data. If it doesn't know, it says so - never a guess dressed up as advice.",
  },
  {
    title: "Your data, your database",
    description:
      "Gauge runs on your own Supabase project - not a third-party data warehouse, not ad-funded.",
  },
];

export function DifferentiatorsSection() {
  return (
    <section className="border-border border-t">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-4 py-16 sm:grid-cols-3">
        {POINTS.map((point) => (
          <div key={point.title}>
            <h3 className="font-medium">{point.title}</h3>
            <p className="text-muted-foreground mt-2 text-sm">
              {point.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

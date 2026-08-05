interface Row {
  bank: string;
  gauge: string;
}

const ROWS: Row[] = [
  {
    bank: "Spending is one tap, no friction, no visible cost.",
    gauge: "Tracking is a typed sentence, logged in seconds - no excuses.",
  },
  {
    bank: "Tracking is buried in statements and confusing balances, once a month.",
    gauge: "Spending gets a warning before you go over, not a shock after.",
  },
  {
    bank: "You find out you're in trouble after it's already happened.",
    gauge: "You see it coming, every time.",
  },
];

export function DifferentiatorsSection() {
  return (
    <section className="border-border border-t">
      <div className="mx-auto max-w-4xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-5xl font-black tracking-tight text-balance sm:text-7xl">
            FXCK THE SYSTEM
          </p>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
            Banks made spending easy. We&apos;re making tracking easier.
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">
            The whole system is built so spending feels effortless and
            tracking feels like a chore - that&apos;s not an accident, it&apos;s
            how debt happens without you noticing.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              What banks do
            </p>
            <ul className="mt-4 flex flex-col gap-4">
              {ROWS.map((row) => (
                <li key={row.bank} className="text-sm">
                  {row.bank}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-primary text-xs font-medium tracking-wide uppercase">
              What Gauge does
            </p>
            <ul className="mt-4 flex flex-col gap-4">
              {ROWS.map((row) => (
                <li key={row.gauge} className="text-sm font-medium">
                  {row.gauge}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

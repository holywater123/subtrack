// Rotates daily - encouraging habits beyond just cutting spend: building
// income, staying disciplined, investing consistently.
export const FINANCE_QUOTES = [
  "Saving protects what you have. Building income grows what's possible.",
  "Discipline beats motivation - a small habit repeated daily outlasts a big effort done once.",
  "Don't just cut expenses - invest the difference in skills that raise your income.",
  "A budget isn't a cage. It's what lets you say yes to the big things later.",
  "Every ringgit you track today is a decision your future self doesn't have to make in a panic.",
  "Income is a skill you can grow. Treat it like one.",
  "Consistency compounds - in savings, in skills, in habits.",
  "The goal isn't to spend less forever. It's to earn and manage well enough that you don't have to worry.",
  "Net worth is built in the boring months, not the exciting ones.",
  "Pay attention to your money before it has to fight for your attention.",
  "A little tracked today beats a lot ignored until it's a crisis.",
  "Your income ceiling matters more long-term than your expense floor.",
  "Debt paid down is a return you don't have to chase in the market.",
  "Financial discipline is just kindness to your future self.",
  "Diversify how you earn, not just how you save.",
] as const;

function dayOfYear(date: Date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86_400_000);
}

export function quoteForDate(date: Date): string {
  const index = dayOfYear(date) % FINANCE_QUOTES.length;
  return FINANCE_QUOTES[index];
}

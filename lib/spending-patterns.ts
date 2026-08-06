// Detects recurring, frequent spends purely from the user's own recent
// history - no fixed/hardcoded category list, no schedule assumptions. It
// only ever proposes a *draft* the user reviews and can fully edit before
// anything is saved (same "review before it lands" contract as scanReceipt
// and parseQuickEntry) - it never inserts anything itself.

export interface ExpenseForPattern {
  amount: number;
  currency: string;
  category: string;
  note: string;
  spent_on: string; // YYYY-MM-DD
}

export interface SpendingSuggestion {
  category: string;
  amount: number;
  currency: string;
  note: string;
  occurrences: number;
  lastSpentOn: string;
}

// Wide enough that a genuinely monthly-cadence bill (rent, a subscription
// paid as a manual expense, etc.) can actually reach MIN_OCCURRENCES within
// the window - 45 days only ever fits 1-2 monthly occurrences, which made
// that case mathematically undetectable despite being the motivating
// example. 120 days comfortably fits 3+ even with irregular billing dates.
const LOOKBACK_DAYS = 120;
const MIN_OCCURRENCES = 3;

function daysAgo(date: Date, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

// Groups expenses that look like "the same kind of spend" - same category,
// and same note when one was typed (falls back to category alone for
// note-less entries, e.g. someone who never types a note but always logs
// "food" at roughly the same amount). Then ranks groups by how often they
// recur, most frequent first, so what counts as "a pattern" adapts to each
// user's actual habits rather than a fixed rule like "once a month" or
// "daily" - a rent-like once-a-month bill and a daily coffee both surface
// here if they recur often enough, purely because the data says so.
export function computeSpendingSuggestions(
  expenses: ExpenseForPattern[],
  today: Date = new Date()
): SpendingSuggestion[] {
  const cutoff = daysAgo(today, LOOKBACK_DAYS);
  const todayStr = today.toISOString().slice(0, 10);
  const recent = expenses.filter((e) => e.spent_on >= cutoff);

  const groups = new Map<string, ExpenseForPattern[]>();
  for (const e of recent) {
    // Currency is part of the identity, not just a display detail - the
    // same category+note logged in two currencies (e.g. a trip) isn't "the
    // same kind of spend" for suggestion purposes, and merging them would
    // let a mode-amount computed across currencies pair the wrong number
    // with the wrong currency.
    const key = `${e.category}::${e.currency}::${e.note.trim().toLowerCase()}`;
    const list = groups.get(key);
    if (list) list.push(e);
    else groups.set(key, [e]);
  }

  const suggestions: SpendingSuggestion[] = [];
  for (const list of groups.values()) {
    if (list.length < MIN_OCCURRENCES) continue;
    // Already logged today - nothing useful to suggest right now.
    if (list.some((e) => e.spent_on === todayStr)) continue;

    const sorted = [...list].sort((a, b) =>
      a.spent_on < b.spent_on ? 1 : -1
    );
    const last = sorted[0];

    // Most frequent amount ("mode"), not the average - a single unusually
    // large or small entry in the group shouldn't skew what gets
    // suggested; what they usually pay is more useful than a blended mean.
    const amountCounts = new Map<number, number>();
    for (const e of list) {
      amountCounts.set(e.amount, (amountCounts.get(e.amount) ?? 0) + 1);
    }
    let modeAmount = last.amount;
    let modeCount = 0;
    for (const [amount, count] of amountCounts) {
      if (count > modeCount) {
        modeAmount = amount;
        modeCount = count;
      }
    }

    suggestions.push({
      category: last.category,
      amount: modeAmount,
      currency: last.currency,
      note: last.note,
      occurrences: list.length,
      lastSpentOn: last.spent_on,
    });
  }

  suggestions.sort((a, b) => {
    if (b.occurrences !== a.occurrences) return b.occurrences - a.occurrences;
    return a.lastSpentOn < b.lastSpentOn ? 1 : -1;
  });

  return suggestions;
}

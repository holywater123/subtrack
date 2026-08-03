import { createClient } from "@/lib/supabase/server";

const MAX_RECEIPT_AGE_DAYS = 45;

// Lazily expires old receipt uploads (called from the Expenses page on
// load) rather than running on a schedule - fine for a personal app, no
// cron job to configure.
export async function cleanupExpiredReceipts() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const cutoff = new Date(
    Date.now() - MAX_RECEIPT_AGE_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: expired } = await supabase
    .from("expenses")
    .select("id, receipt_path")
    .eq("user_id", user.id)
    .not("receipt_path", "is", null)
    .lt("receipt_uploaded_at", cutoff);

  if (!expired || expired.length === 0) return;

  const paths = expired
    .map((e) => e.receipt_path)
    .filter((p): p is string => Boolean(p));

  if (paths.length > 0) {
    await supabase.storage.from("receipts").remove(paths);
  }

  await supabase
    .from("expenses")
    .update({ receipt_path: null, receipt_uploaded_at: null })
    .in(
      "id",
      expired.map((e) => e.id)
    );
}

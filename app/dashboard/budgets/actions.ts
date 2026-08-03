"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CATEGORY_VALUES } from "@/lib/categories";

type ActionResult = { error: string } | { success: true };

export async function setBudget(
  category: string,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  if (!CATEGORY_VALUES.includes(category)) {
    return { error: "Invalid category." };
  }

  const amount = Number(formData.get("amount"));
  if (!Number.isFinite(amount) || amount < 0) {
    return { error: "Enter a valid amount." };
  }

  // Setting the amount to 0 clears the budget for this category.
  if (amount === 0) {
    const { error } = await supabase
      .from("budgets")
      .delete()
      .eq("user_id", user.id)
      .eq("category", category);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("budgets")
      .upsert(
        { user_id: user.id, category, monthly_amount: amount },
        { onConflict: "user_id,category" }
      );
    if (error) return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/budgets");
  return { success: true };
}

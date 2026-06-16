"use server";

import { supabase } from "../supabase";

export type AlertInterestResponse = {
  success: boolean;
  error?: string;
};

export async function submitAlertInterest(
  email: string,
  locale: "en" | "ne",
  sourcePage: string
): Promise<AlertInterestResponse> {
  if (!email || !email.includes("@")) {
    return { success: false, error: "Please enter a valid email address." };
  }

  try {
    const { error } = await supabase
      .from("alert_interest")
      .upsert(
        { email, locale, source_page: sourcePage },
        { onConflict: "email", ignoreDuplicates: true }
      );

    if (error) {
      console.error("[submitAlertInterest] DB Upsert error:", error.message);
      return { success: false, error: "Database error. Please try again." };
    }

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[submitAlertInterest] Unexpected error:", msg);
    return { success: false, error: "Server error. Please try again." };
  }
}

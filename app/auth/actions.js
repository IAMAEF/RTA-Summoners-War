"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export async function signUp(formData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (error) return { error: error.message };
  redirect("/login?checkEmail=1");
}

export async function signIn(formData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (error) return { error: error.message };
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

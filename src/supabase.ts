import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
const key = import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as
  string | undefined;
const accountEmail = import.meta.env.NEXT_PUBLIC_AUTH_EMAIL as
  string | undefined;
const accountUsername = import.meta.env.NEXT_PUBLIC_AUTH_USERNAME as
  string | undefined;

export const supabaseConfigured = Boolean(url && key);
export const supabase = supabaseConfigured
  ? createClient(url!, key!, {
      auth: {
        // A versioned key prevents an invalid legacy refresh token from
        // triggering an endless retry loop after an auth configuration change.
        storageKey: "maja-auth-session-v2",
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export async function signIn(username: string, password: string) {
  if (!supabase) return "Supabase no está configurado.";
  if (!accountEmail || !accountUsername)
    return "La cuenta de acceso no está configurada.";
  if (username.trim().toLowerCase() !== accountUsername.toLowerCase())
    return "Usuario o contraseña incorrectos.";
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: accountEmail,
      password,
    });
    if (error?.code === "email_not_confirmed")
      return "La cuenta todavía debe confirmarse en Supabase.";
    return error ? "Usuario o contraseña incorrectos." : null;
  } catch {
    return "No se pudo conectar con Supabase. Revisa que el proyecto esté activo y que la URL sea correcta.";
  }
}

export async function signOut() {
  await supabase?.auth.signOut();
}

export async function loadRemoteStore<T>(userId: string) {
  if (!supabase)
    return { data: null as T | null, error: "Supabase no está configurado." };
  const { data, error } = await supabase
    .from("maja_state")
    .select("data")
    .eq("id", userId)
    .maybeSingle();
  return {
    data: (data?.data as T | undefined) ?? null,
    error: error?.message ?? null,
  };
}

export async function saveRemoteStore(data: unknown, userId: string) {
  if (!supabase) return "Supabase no está configurado.";
  const { error } = await supabase.from("maja_state").upsert({
    id: userId,
    data,
    updated_at: new Date().toISOString(),
  });
  return error?.message ?? null;
}

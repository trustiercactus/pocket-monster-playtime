import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Criaturitas" },
      {
        name: "description",
        content: "Zona de personas adultas: entra con tu cuenta para guardar el progreso del juego.",
      },
      { property: "og:title", content: "Entrar — Criaturitas" },
      {
        property: "og:description",
        content: "Accede para guardar niveles y criaturas desbloqueadas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/jugar", replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate({ to: "/jugar", replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    if (mode === "up") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) setMsg(error.message);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg(error.message);
    }
    setBusy(false);
  }

  return (
    <main className="min-h-screen bg-sky flex flex-col items-center justify-center gap-6 px-6 py-10">
      <h1 className="text-3xl font-black text-ink">Zona de adultos 🔒</h1>
      <p className="text-center text-ink/70 max-w-xs">
        Entra para guardar el progreso del peque en la nube.
      </p>

      <form onSubmit={submit} className="w-full max-w-sm flex flex-col gap-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Correo"
          className="rounded-2xl bg-white px-5 py-4 text-lg text-ink outline-none"
        />
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña (la que tú quieras)"
          className="rounded-2xl bg-white px-5 py-4 text-lg text-ink outline-none"
        />
        <p className="px-2 text-sm text-ink/60">
          Vale cualquier cosa fácil de recordar, solo 6 caracteres mínimo.
        </p>

        <button
          type="submit"
          disabled={busy}
          className="rounded-3xl bg-green px-6 py-5 text-2xl font-black text-white shadow-[0_6px_0_rgba(0,0,0,0.2)] active:translate-y-1 disabled:opacity-60"
        >
          {mode === "in" ? "Entrar" : "Crear cuenta"}
        </button>
      </form>

      {msg && <p className="max-w-sm text-center text-ink">{msg}</p>}

      <button
        onClick={() => {
          setMode(mode === "in" ? "up" : "in");
          setMsg(null);
        }}
        className="text-ink/70 underline"
      >
        {mode === "in" ? "No tengo cuenta" : "Ya tengo cuenta"}
      </button>
    </main>
  );
}

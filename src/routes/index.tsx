import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import flami from "@/assets/flami.png";
import aquip from "@/assets/aquip.png";
import hojito from "@/assets/hojito.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Criaturitas — Juego de batallas para peques" },
      {
        name: "description",
        content:
          "Juego por turnos con botones enormes para niños de 4 años: gana batallas, sube de nivel y desbloquea criaturas.",
      },
      { property: "og:title", content: "Criaturitas — Juego de batallas para peques" },
      {
        property: "og:description",
        content: "Batallas sencillas, criaturas adorables y niveles para niños pequeños.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/jugar", replace: true });
      else setChecked(true);
    });
  }, [navigate]);

  return (
    <main className="min-h-screen bg-sky flex flex-col items-center justify-between px-5 py-10 text-center">
      <div className="flex flex-col items-center gap-4">
        <h1 className="font-black text-5xl leading-none text-ink drop-shadow-[0_4px_0_rgba(255,255,255,0.6)]">
          CRIATURITAS
        </h1>
        <div className="flex items-end gap-1">
          <img src={hojito} alt="Hojito, criatura planta" className="w-24 drop-shadow-xl" />
          <img src={flami} alt="Flami, criatura de fuego" className="w-32 drop-shadow-xl" />
          <img src={aquip} alt="Aquip, criatura de agua" className="w-24 drop-shadow-xl" />
        </div>
      </div>

      {checked && (
        <Link
          to="/auth"
          className="w-full max-w-sm rounded-[2rem] bg-orange px-6 py-8 text-4xl font-black text-white shadow-[0_10px_0_rgba(0,0,0,0.2)] active:translate-y-1 active:shadow-[0_4px_0_rgba(0,0,0,0.2)]"
        >
          ▶ JUGAR
        </Link>
      )}
    </main>
  );
}

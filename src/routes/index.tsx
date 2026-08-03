import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import flami from "@/assets/flami.png";
import aquip from "@/assets/aquip.png";
import hojito from "@/assets/hojito.png";
import trainer from "@/assets/trainer.png";
import fondo from "@/assets/portada-fondo.jpg";
import { Scenery } from "@/components/Scenery";
import { LiveSprite } from "@/components/LiveSprite";

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

const SAVE_KEY = "criaturitas-partida";

function Index() {
  const [ajustes, setAjustes] = useState(false);
  const navigate = useNavigate();

  const cambiarNombre = () => {
    try {
      const raw = window.localStorage.getItem(SAVE_KEY);
      const data = raw ? JSON.parse(raw) : {};
      window.localStorage.setItem(SAVE_KEY, JSON.stringify({ ...data, name: "" }));
    } catch {
      /* sin guardado */
    }
    navigate({ to: "/jugar" });
  };

  const borrarTodo = () => {
    try {
      window.localStorage.removeItem(SAVE_KEY);
    } catch {
      /* sin guardado */
    }
    setAjustes(false);
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      <img
        src={fondo}
        alt="Pradera con casita, castillo, montañas y arcoíris"
        width={1024}
        height={1536}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-sky/20 via-transparent to-green/30" />
      <Scenery dense />

      <div className="relative flex min-h-screen flex-col items-center px-4 pt-4 pb-6 text-center">
        <button
          type="button"
          aria-label="Ajustes"
          onClick={() => setAjustes(true)}
          className="btn-bounce absolute left-4 top-4 flex h-16 w-16 items-center justify-center rounded-full border-[5px] border-white bg-blue text-3xl shadow-[0_6px_0_rgba(0,0,0,0.25)]"
        >
          ⚙️
        </button>

        <div className="title-bob mt-20 flex flex-col items-center gap-2">
          <h1 className="text-[3.25rem] font-black leading-none tracking-tight text-yellow [text-shadow:0_0_0_#fff,3px_3px_0_var(--arcade-ink),-3px_3px_0_var(--arcade-ink),3px_-3px_0_var(--arcade-ink),-3px_-3px_0_var(--arcade-ink),0_10px_0_rgba(0,0,0,0.3)]">
            CRIATURITAS
          </h1>
          <p className="rounded-full border-4 border-white bg-orange px-5 py-1.5 text-sm font-black uppercase tracking-wide text-white shadow-[0_5px_0_rgba(0,0,0,0.22)]">
            ¡Tu aventura comienza!
          </p>
        </div>

        <div className="relative mt-auto flex w-full items-end justify-center gap-0.5">
          <LiveSprite
            src={hojito}
            alt="Hojito, criatura planta"
            motion="sway"
            delay={0.2}
            className="w-24 drop-shadow-2xl"
          />
          <LiveSprite
            src={trainer}
            alt="Daniel, tu entrenador"
            motion="hop"
            className="w-36 drop-shadow-2xl"
          />
          <LiveSprite
            src={flami}
            alt="Flami, criatura de fuego"
            motion="breathe"
            delay={0.5}
            className="w-24 drop-shadow-2xl"
          />
          <LiveSprite
            src={aquip}
            alt="Aquip, criatura de agua"
            motion="sway"
            delay={0.9}
            className="w-24 drop-shadow-2xl"
          />
        </div>

        <div className="mt-6 flex w-full max-w-sm flex-col items-center gap-4">
          <Link
            to="/jugar"
            aria-label="Jugar"
            className="btn-bounce btn-pulse flex w-full items-center justify-center gap-3 rounded-[2.5rem] border-[6px] border-white bg-orange px-6 py-6 text-4xl font-black text-white shadow-[0_12px_0_rgba(0,0,0,0.25)]"
          >
            <span aria-hidden="true">▶️</span> JUGAR
          </Link>
          <Link
            to="/coleccion"
            aria-label="Colección"
            className="btn-bounce flex w-11/12 items-center justify-center gap-3 rounded-[2rem] border-[5px] border-white bg-blue px-5 py-4 text-2xl font-black text-white shadow-[0_9px_0_rgba(0,0,0,0.25)]"
          >
            <span aria-hidden="true">📘</span> COLECCIÓN
          </Link>
        </div>
      </div>

      {ajustes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 px-6">
          <div className="screen-in w-full max-w-xs rounded-[2rem] border-[6px] border-white bg-sky p-5 text-center shadow-[0_12px_0_rgba(0,0,0,0.25)]">
            <p className="mb-4 text-5xl" aria-hidden="true">
              ⚙️
            </p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={cambiarNombre}
                aria-label="Cambiar nombre"
                className="btn-bounce rounded-[1.5rem] border-4 border-white bg-green px-4 py-4 text-3xl font-black text-white shadow-[0_7px_0_rgba(0,0,0,0.2)]"
              >
                ✏️
              </button>
              <button
                type="button"
                onClick={borrarTodo}
                aria-label="Empezar de nuevo"
                className="btn-bounce rounded-[1.5rem] border-4 border-white bg-orange px-4 py-4 text-3xl font-black text-white shadow-[0_7px_0_rgba(0,0,0,0.2)]"
              >
                🔄
              </button>
              <button
                type="button"
                onClick={() => setAjustes(false)}
                aria-label="Cerrar"
                className="btn-bounce rounded-[1.5rem] border-4 border-white bg-blue px-4 py-4 text-3xl font-black text-white shadow-[0_7px_0_rgba(0,0,0,0.2)]"
              >
                ✅
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

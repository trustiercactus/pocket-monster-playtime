import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import flami from "@/assets/flami.png";
import aquip from "@/assets/aquip.png";
import hojito from "@/assets/hojito.png";
import trainer from "@/assets/trainer.png";
import fondo from "@/assets/portada-fondo.jpg";
import { Scenery } from "@/components/Scenery";
import { LiveSprite } from "@/components/LiveSprite";
import {
  loadOpciones,
  setOpcion,
  playMusic,
  sfx,
  OPTS_DEFAULT,
  type Opciones,
} from "@/lib/audio";


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
  const [confirmar, setConfirmar] = useState(false);
  const [creditos, setCreditos] = useState(false);
  const [opciones, setOpciones] = useState<Opciones>(OPTS_DEFAULT);

  useEffect(() => {
    setOpciones(loadOpciones());
    playMusic("inicio");
  }, []);

  const toggle = (key: keyof Opciones) => {
    setOpciones((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      setOpcion(key, next[key]);
      return next;
    });
    sfx("tap");
  };

  const borrarTodo = () => {
    try {
      window.localStorage.removeItem(SAVE_KEY);
    } catch {
      /* sin guardado */
    }
    sfx("cerrar");
    setConfirmar(false);
    setAjustes(false);
  };



  return (
    <main className="safe-pad relative h-[100dvh] overflow-hidden">
      <img
        src={fondo}
        alt="Pradera con casita, castillo, montañas y arcoíris"
        width={1024}
        height={1536}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-sky/20 via-transparent to-green/30" />
      <Scenery dense />

      <div className="relative flex h-full flex-col items-center px-2 text-center">
        <button
          type="button"
          aria-label="Ajustes"
          onClick={() => {
            sfx("abrir");
            setAjustes(true);
          }}
          className="btn-bounce absolute left-4 top-4 flex h-16 w-16 items-center justify-center rounded-full border-[5px] border-white bg-blue text-3xl shadow-[0_6px_0_rgba(0,0,0,0.25)]"
        >
          ⚙️
        </button>

        <div className="title-bob mt-[12vh] flex flex-col items-center gap-2">
          <h1 className="text-[min(3.25rem,13vw)] font-black leading-none tracking-tight text-yellow [text-shadow:0_0_0_#fff,3px_3px_0_var(--arcade-ink),-3px_3px_0_var(--arcade-ink),3px_-3px_0_var(--arcade-ink),-3px_-3px_0_var(--arcade-ink),0_10px_0_rgba(0,0,0,0.3)]">
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
            onClick={() => sfx("tap")}
            aria-label="Jugar"
            className="btn-3d btn-pulse flex w-full items-center justify-center gap-3 border-[6px] border-white bg-orange px-6 py-6 text-4xl font-black text-white shadow-[0_14px_0_rgba(0,0,0,0.28),0_20px_26px_rgba(0,0,0,0.28),inset_0_-6px_0_rgba(0,0,0,0.18)] [text-shadow:0_3px_0_rgba(0,0,0,0.28)]"
          >
            <span aria-hidden="true" className="text-5xl drop-shadow-[0_3px_0_rgba(0,0,0,0.25)]">
              ▶️
            </span>{" "}
            JUGAR
          </Link>
          <Link
            to="/coleccion"
            onClick={() => sfx("tap")}
            aria-label="Colección"
            className="btn-3d flex w-11/12 items-center justify-center gap-3 rounded-[2rem] border-[5px] border-white bg-blue px-5 py-4 text-2xl font-black text-white shadow-[0_11px_0_rgba(0,0,0,0.28),0_16px_22px_rgba(0,0,0,0.25),inset_0_-5px_0_rgba(0,0,0,0.16)] [text-shadow:0_3px_0_rgba(0,0,0,0.25)]"
          >
            <span aria-hidden="true" className="text-4xl drop-shadow-[0_3px_0_rgba(0,0,0,0.25)]">
              📘
            </span>{" "}
            COLECCIÓN
          </Link>
        </div>
      </div>

      {ajustes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 px-6">
          <div className="screen-in w-full max-w-xs rounded-[2rem] border-[6px] border-white bg-sky p-5 text-center shadow-[0_14px_0_rgba(0,0,0,0.25)]">
            <p className="mb-4 text-5xl" aria-hidden="true">
              ⚙️
            </p>
            <div className="flex flex-col gap-3">
              {(
                [
                  ["musica", "🎵", "Música"],
                  ["efectos", "🔊", "Efectos de sonido"],
                  ["vibracion", "📳", "Vibración"],
                ] as const

              ).map(([key, icon, label]) => (
                <button
                  key={key}
                  type="button"
                  role="switch"
                  aria-checked={opciones[key]}
                  aria-label={label}
                  onClick={() => toggle(key)}
                  className="btn-3d flex items-center justify-between gap-3 rounded-[1.5rem] border-4 border-white bg-blue px-4 py-3 shadow-[0_8px_0_rgba(0,0,0,0.22)]"
                >
                  <span aria-hidden="true" className="text-4xl">
                    {icon}
                  </span>
                  <span
                    className={`toggle-pill ${opciones[key] ? "bg-green" : "bg-ink/40"}`}
                    aria-hidden="true"
                  >
                    <span
                      className="toggle-knob"
                      style={{ transform: `translateX(${opciones[key] ? "2.15rem" : "0.15rem"})` }}
                    />
                  </span>
                </button>
              ))}

              {confirmar ? (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={borrarTodo}
                    aria-label="Sí, reiniciar"
                    className="btn-3d flex-1 rounded-[1.5rem] border-4 border-white bg-orange px-4 py-4 text-3xl shadow-[0_8px_0_rgba(0,0,0,0.22)]"
                  >
                    ✅
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmar(false)}
                    aria-label="No reiniciar"
                    className="btn-3d flex-1 rounded-[1.5rem] border-4 border-white bg-blue px-4 py-4 text-3xl shadow-[0_8px_0_rgba(0,0,0,0.22)]"
                  >
                    ❌
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmar(true)}
                  aria-label="Reiniciar partida"
                  className="btn-3d rounded-[1.5rem] border-4 border-white bg-orange px-4 py-4 text-3xl shadow-[0_8px_0_rgba(0,0,0,0.22)]"
                >
                  🔄
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  sfx("cerrar");
                  setAjustes(false);
                }}
                aria-label="Cerrar"
                className="btn-3d rounded-[1.5rem] border-4 border-white bg-green px-4 py-4 text-3xl shadow-[0_8px_0_rgba(0,0,0,0.22)]"
              >
                ✅
              </button>

              <button
                type="button"
                onClick={() => setCreditos((v) => !v)}
                aria-label="Créditos"
                className="mt-1 text-xs font-black uppercase tracking-wide text-ink/70"
              >
                ❤️ Créditos
              </button>
              {creditos && (
                <p className="pop-in text-xs font-bold text-ink/70">
                  Criaturitas · hecho con cariño para Daniel
                </p>
              )}
            </div>
          </div>
        </div>
      )}

    </main>
  );
}

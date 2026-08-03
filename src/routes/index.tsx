import { createFileRoute, Link } from "@tanstack/react-router";
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

function Index() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <img
        src={fondo}
        alt="Pradera con árboles, flores y arcoíris"
        width={1536}
        height={1024}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-sky/10 via-transparent to-green/25" />
      <Scenery dense />

      <div className="relative flex min-h-screen flex-col items-center justify-between px-5 py-8 text-center">
        <h1 className="title-bob font-black text-6xl leading-none text-white [text-shadow:0_4px_0_var(--arcade-orange),0_8px_0_rgba(0,0,0,0.25)]">
          CRIATURITAS
        </h1>

        <div className="relative flex items-end justify-center gap-1">
          <LiveSprite
            src={hojito}
            alt="Hojito, criatura planta"
            motion="sway"
            delay={0.2}
            className="w-24 drop-shadow-2xl"
          />
          <LiveSprite
            src={trainer}
            alt="Tu entrenador"
            motion="hop"
            className="w-40 drop-shadow-2xl"
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

        <Link
          to="/jugar"
          aria-label="Jugar ya"
          className="btn-bounce btn-pulse w-full max-w-sm rounded-[2.5rem] border-[6px] border-white bg-orange px-6 py-8 text-5xl font-black text-white shadow-[0_12px_0_rgba(0,0,0,0.25)]"
        >
          ▶️
        </Link>
      </div>
    </main>
  );
}

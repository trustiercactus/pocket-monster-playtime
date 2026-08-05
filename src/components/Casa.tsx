import { sfx } from "@/lib/audio";
import { useState } from "react";
import { COLLECTION, TYPE_EMOJI, getCreature, type Creature } from "@/lib/creatures";
import {
  CARE_TO_HATCH,
  EGG_COLOR,
  EGG_EMOJI,
  STAGE_CLASS,
  eggStage,
  hatchFrom,
  type Egg,
} from "@/lib/eggs";
import { PetSprite } from "@/components/PetSprite";
import { LiveSprite } from "@/components/LiveSprite";
import trainerImg from "@/assets/trainer.png";
import casaImg from "@/assets/casa-fondo.jpg";

function EggShape({ egg, big = false }: { egg: Egg; big?: boolean }) {
  const stage = eggStage(egg.care);
  return (
    <span
      className={`relative inline-flex items-center justify-center ${STAGE_CLASS[stage]}`}
      aria-hidden="true"
    >
      <span
        className={`flex items-center justify-center rounded-[50%_50%_50%_50%/60%_60%_40%_40%] border-4 border-white shadow-[0_6px_0_rgba(0,0,0,0.15)] ${
          big ? "h-[16vh] w-[12vh] text-4xl" : "h-20 w-16 text-2xl"
        }`}
        style={{ backgroundColor: EGG_COLOR[egg.element] }}
      >
        {EGG_EMOJI[egg.element]}
      </span>
      {stage !== "nuevo" && (
        <span className={`absolute ${big ? "text-4xl" : "text-2xl"} opacity-80`}>
          {stage === "grietas" ? "⚡" : stage === "mueve" ? "💗" : "✨"}
        </span>
      )}
    </span>
  );
}

export function Casa({
  eggs,
  unlocked,
  onEggs,
  onHatch,
  onCollection,
  onBack,
}: {
  eggs: Egg[];
  unlocked: string[];
  onEggs: (next: Egg[]) => void;
  onHatch: (c: Creature) => void;
  onCollection: () => void;
  onBack: () => void;
}) {
  const [selected, setSelected] = useState(0);
  const [fx, setFx] = useState<string | null>(null);

  const amigos = COLLECTION.filter((c) => unlocked.includes(c.id)).slice(0, 6);
  const egg = eggs[selected];

  function care(icon: string) {
    if (!egg) return;
    setFx(icon);
    window.setTimeout(() => setFx(null), 800);
    const care = egg.care + 1;
    if (care >= CARE_TO_HATCH) {
      onEggs(eggs.filter((e) => e.id !== egg.id));
      setSelected(0);
      onHatch(hatchFrom(egg.element, unlocked));
      return;
    }
    onEggs(eggs.map((e) => (e.id === egg.id ? { ...e, care } : e)));
  }

  return (
    <div className="screen-in relative flex h-full min-h-0 w-full flex-col items-center gap-2 overflow-hidden">
      <img
        src={casaImg}
        alt=""
        width={1536}
        height={1024}
        loading="lazy"
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full rounded-[2rem] object-cover opacity-90"
      />

      <div className="flex w-full shrink-0 items-center justify-between">
        <button
          onClick={() => {
            sfx("cerrar");
            onBack();
          }}
          className="btn-bounce rounded-full border-4 border-white bg-white px-5 py-3 text-3xl shadow-[0_5px_0_rgba(0,0,0,0.15)]"
          aria-label="Volver al mapa"
        >
          ⬅️
        </button>
        <span className="rounded-full bg-white/90 px-4 py-2 text-3xl">🏠</span>
        <button
          onClick={() => {
            sfx("abrir");
            onCollection();
          }}
          className="btn-bounce btn-pulse rounded-full border-4 border-white bg-yellow px-5 py-3 text-3xl shadow-[0_5px_0_rgba(0,0,0,0.15)]"
          aria-label="Abrir la colección"
        >
          📖
        </button>
      </div>

      {/* Criaturas jugando en casa */}
      <div className="flex w-full max-w-sm flex-wrap items-end justify-center gap-1 rounded-[2rem] bg-white/60 p-3">
        <LiveSprite src={trainerImg} alt="Tu entrenador" motion="hop" className="w-20" />
        {amigos.map((c, i) => (
          <PetSprite
            key={c.id}
            src={c.image}
            alt={c.name}
            motion={i % 3 === 0 ? "hop" : i % 3 === 1 ? "sway" : "breathe"}
            delay={(i % 5) * 0.3}
            className="w-[13vw] max-w-16"
          />
        ))}
      </div>

      {/* Huevos */}
      {eggs.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-[2rem] bg-white/85 px-6 py-5">
          <span className="float-soft text-6xl">🥚</span>
          <span className="text-4xl">⚔️➡️🥚</span>
        </div>
      ) : (
        <div className="flex w-full max-w-sm flex-col items-center gap-3 rounded-[2rem] bg-white/85 p-4">
          <div className="flex flex-wrap items-center justify-center gap-3">
            {eggs.map((e, i) => (
              <button
                key={e.id}
                onClick={() => {
                  sfx("tap");
                  setSelected(i);
                }}
                aria-label={`Huevo ${EGG_EMOJI[e.element]}`}
                className={`btn-bounce rounded-3xl p-1 ${
                  i === selected ? "bg-yellow/60 ring-4 ring-white" : ""
                }`}
              >
                <EggShape egg={e} />
              </button>
            ))}
          </div>

          {egg && (
            <>
              <div className="relative flex h-[18vh] items-center justify-center">
                <EggShape egg={egg} big />
                {fx && (
                  <span className="pop-in absolute -top-1 text-5xl">{fx}</span>
                )}
              </div>
              <div className="flex w-full items-center gap-1" aria-hidden="true">
                {Array.from({ length: CARE_TO_HATCH }).map((_, i) => (
                  <span
                    key={i}
                    className={`h-4 flex-1 rounded-full ${i < egg.care ? "bg-orange" : "bg-black/10"}`}
                  />
                ))}
              </div>
              <div className="flex w-full gap-3">
                {[
                  { icon: "❤️", label: "Dar cariño", color: "var(--arcade-orange)" },
                  { icon: "🍎", label: "Dar de comer", color: "var(--arcade-green)" },
                  { icon: "✨", label: "Jugar", color: "var(--arcade-blue)" },
                ].map((b) => (
                  <button
                    key={b.icon}
                    onClick={() => {
                      sfx("tap");
                      care(b.icon);
                    }}
                    aria-label={b.label}
                    style={{ backgroundColor: b.color }}
                    className="btn-bounce min-h-[11vh] flex-1 rounded-[1.75rem] border-4 border-white text-4xl shadow-[0_8px_0_rgba(0,0,0,0.2)]"
                  >
                    {b.icon}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-2xl">
        {TYPE_EMOJI[getCreature(unlocked[0] ?? "flami").type]} {unlocked.length}
      </div>
    </div>
  );
}

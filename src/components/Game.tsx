import { useCallback, useEffect, useState } from "react";
import {
  CREATURES,
  TYPE_EMOJI,
  TYPE_COLOR,
  XP_PER_LEVEL,
  LEGENDARY_ID,
  getCreature,
  type Creature,
} from "@/lib/creatures";
import { AREAS, type Area } from "@/lib/areas";
import { Scenery } from "@/components/Scenery";
import { Casa } from "@/components/Casa";
import { MapaMundo } from "@/components/MapaMundo";
import { Combate } from "@/components/Combate";
import { FinalScreen } from "@/components/FinalScreen";
import { randomEgg, type Egg } from "@/lib/eggs";
import { LiveSprite } from "@/components/LiveSprite";
import trainerImg from "@/assets/trainer.png";
import fondoImg from "@/assets/portada-fondo.jpg";

export type Progress = {
  name: string;
  level: number;
  xp: number;
  unlocked: string[];
  companion: string;
  wins: number;
  eggs: Egg[];
  zonesDone: string[];
  legendary: boolean;
};

type Screen = "mapa" | "casa" | "coleccion" | "elegir" | "batalla" | "final";

const MAX_HP = 5;
const SAVE_KEY = "criaturitas-partida";

const INITIAL: Progress = {
  name: "",
  level: 1,
  xp: 0,
  unlocked: ["flami"],
  companion: "flami",
  wins: 0,
  eggs: [],
  zonesDone: [],
  legendary: false,
};


function Confetti() {
  const bits = ["⭐", "🎉", "✨", "🌟", "🎊", "💫"];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {Array.from({ length: 22 }).map((_, i) => (
        <span
          key={i}
          className="absolute text-3xl"
          style={{
            left: `${(i * 37) % 96}%`,
            animation: `confetti-fall ${1.6 + (i % 5) * 0.35}s linear ${(i % 7) * 0.18}s infinite`,
          }}
        >
          {bits[i % bits.length]}
        </span>
      ))}
    </div>
  );
}


export function Game({ initialScreen = "mapa" }: { initialScreen?: Screen } = {}) {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [screen, setScreen] = useState<Screen>(initialScreen);
  const [area, setArea] = useState<Area>(AREAS[0] as Area);
  const [fighter, setFighter] = useState<string | null>(null);
  const [captured, setCaptured] = useState<Creature | null>(null);
  /** aventura completada: la colección vuelve a la pantalla final */
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SAVE_KEY);
      const loaded = raw ? { ...INITIAL, ...(JSON.parse(raw) as Progress) } : INITIAL;
      setProgress({ ...loaded, eggs: loaded.eggs ?? [], zonesDone: loaded.zonesDone ?? [] });
    } catch {
      setProgress(INITIAL);
    }
  }, []);

  const save = useCallback((next: Progress) => {
    setProgress(next);
    try {
      window.localStorage.setItem(SAVE_KEY, JSON.stringify(next));
    } catch {
      /* sin guardado */
    }
  }, []);

  if (!progress) {
    return (
      <main className="min-h-screen bg-sky flex items-center justify-center text-5xl">⏳</main>
    );
  }

  if (!progress.name) {
    return (
      <main className="relative min-h-screen overflow-hidden px-5">
        <img
          src={fondoImg}
          alt=""
          width={1536}
          height={1024}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <Scenery dense />
        <div className="relative flex min-h-screen items-center justify-center">
          <NombreForm onDone={(name) => save({ ...progress, name })} />
        </div>
      </main>
    );
  }

  const companion = getCreature(fighter ?? progress.companion);

  function finishBattle(won: boolean) {
    if (!progress) return;
    let nuevo: Creature | null = null;
    if (won) {
      const xp = progress.xp + 1;
      const levelUp = xp >= XP_PER_LEVEL;
      const level = levelUp ? progress.level + 1 : progress.level;
      const zonesDone = progress.zonesDone.includes(area.id)
        ? progress.zonesDone
        : [...progress.zonesDone, area.id];
      const guardian = getCreature(area.guardian);
      const unlocked = progress.unlocked.includes(guardian.id)
        ? progress.unlocked
        : [...progress.unlocked, guardian.id];
      nuevo = progress.unlocked.includes(guardian.id) ? null : guardian;
      const eggs =
        progress.eggs.length < 3 ? [...progress.eggs, randomEgg()] : progress.eggs;
      save({
        ...progress,
        level,
        xp: levelUp ? 0 : xp,
        unlocked,
        zonesDone,
        wins: progress.wins + 1,
        eggs,
      });
    }
    if (won && area.boss) {
      // la aventura termina: nunca se vuelve al mapa
      setEnded(true);
      setScreen("final");
      return;
    }
    setScreen("mapa");
    if (nuevo) setCaptured(nuevo);
  }

  if (screen === "mapa") {
    return (
      <main className="relative h-[100dvh] w-full overflow-hidden bg-sky">
        <MapaMundo
          name={progress.name}
          zonesDone={progress.zonesDone}
          legendary={progress.legendary}
          hasEggs={progress.eggs.length > 0}
          onArea={(a) => {
            setArea(a);
            // en el combate final entra por defecto la criatura legendaria
            if (a.boss && progress.unlocked.includes(LEGENDARY_ID)) {
              setFighter(LEGENDARY_ID);
              save({ ...progress, companion: LEGENDARY_ID });
            }
            setScreen("elegir");
          }}
          onCollection={() => setScreen("coleccion")}
          onHome={() => setScreen("casa")}
          onSettings={() => {
            window.location.href = "/";
          }}
          onLegendary={() => {
            save({
              ...progress,
              legendary: true,
              companion: LEGENDARY_ID,
              unlocked: progress.unlocked.includes(LEGENDARY_ID)
                ? progress.unlocked
                : [...progress.unlocked, LEGENDARY_ID],
            });
          }}
        />
        {captured && <Captura creature={captured} onClose={() => setCaptured(null)} />}
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-sky px-4 py-5 pb-16">
      <img
        src={fondoImg}
        alt=""
        width={1536}
        height={1024}
        loading="lazy"
        className="fixed inset-0 h-full w-full object-cover opacity-25"
      />
      <Scenery />
      <div className="relative">

      {screen === "casa" && (
        <Casa
          eggs={progress.eggs}
          unlocked={progress.unlocked}
          onEggs={(eggs) => save({ ...progress, eggs })}
          onHatch={(c) => {
            if (!progress.unlocked.includes(c.id)) {
              save({ ...progress, unlocked: [...progress.unlocked, c.id] });
            }
            setCaptured(c);
          }}
          onCollection={() => setScreen("coleccion")}
          onBack={() => setScreen("mapa")}
        />
      )}
      {screen === "coleccion" && (
        <Coleccion
          progress={progress}
          onPick={(id) => save({ ...progress, companion: id })}
          onBack={() => setScreen(ended ? "final" : "mapa")}
        />
      )}
      {screen === "final" && (
        <FinalScreen
          name={progress.name}
          unlocked={progress.unlocked}
          onCollection={() => setScreen("coleccion")}
          onNewGame={() => {
            setEnded(false);
            setFighter(null);
            setArea(AREAS[0] as Area);
            save({ ...INITIAL, name: progress.name });
            setScreen("mapa");
          }}
        />
      )}
      {screen === "elegir" && (
        <Elegir
          progress={progress}
          area={area}
          onPick={(id) => {
            setFighter(id);
            save({ ...progress, companion: id });
            setScreen("batalla");
          }}
          onBack={() => setScreen("mapa")}
        />
      )}
      {screen === "batalla" && (
        <Combate
          area={area}
          companion={companion}
          zonesDone={progress.zonesDone}
          onFinish={finishBattle}
          onBack={() => setScreen("mapa")}
        />
      )}

      {captured && <Captura creature={captured} onClose={() => setCaptured(null)} />}
      </div>
    </main>
  );
}

function NombreForm({ onDone }: { onDone: (name: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const n = value.trim();
        if (n) onDone(n.slice(0, 14));
      }}
      className="screen-in flex w-full max-w-sm flex-col items-center gap-5 text-center"
    >
      <LiveSprite src={trainerImg} alt="Tu entrenador" motion="hop" className="w-40" />
      <p className="text-4xl font-black text-ink">👋</p>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label="Tu nombre"
        placeholder="Daniel"
        autoFocus
        className="w-full rounded-[1.75rem] bg-white px-5 py-6 text-center text-4xl font-black text-ink shadow-[0_8px_0_rgba(0,0,0,0.15)] outline-none"
      />
      <button
        type="submit"
        disabled={!value.trim()}
        className="btn-bounce w-full rounded-[2rem] border-4 border-white bg-orange px-6 py-7 text-4xl font-black text-white shadow-[0_10px_0_rgba(0,0,0,0.2)] disabled:opacity-50"
      >
        ✅
      </button>
    </form>
  );
}




function Coleccion({
  progress,
  onPick,
  onBack,
}: {
  progress: Progress;
  onPick: (id: string) => void;
  onBack: () => void;
}) {
  const pct = Math.round((progress.unlocked.length / CREATURES.length) * 100);
  return (
    <div className="screen-in flex flex-col items-center gap-4">
      <div className="flex w-full max-w-sm items-center gap-3">
        <button
          onClick={onBack}
          className="btn-bounce rounded-full border-4 border-white bg-white px-5 py-3 text-3xl shadow-[0_5px_0_rgba(0,0,0,0.15)]"
          aria-label="Volver"
        >
          ⬅️
        </button>
        <div
          className="relative h-12 flex-1 overflow-hidden rounded-full bg-white shadow-[0_5px_0_rgba(0,0,0,0.12)]"
          role="progressbar"
          aria-valuenow={progress.unlocked.length}
          aria-valuemin={0}
          aria-valuemax={CREATURES.length}
          aria-label="Criaturas conseguidas"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-yellow via-orange to-green transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-2xl font-black text-ink">
            🐣 {progress.unlocked.length}/{CREATURES.length}
          </span>
        </div>
      </div>

      <div className="grid w-full max-w-sm grid-cols-2 gap-3">
        {CREATURES.map((c, i) => {
          const owned = progress.unlocked.includes(c.id);
          const active = progress.companion === c.id;
          return (
            <button
              key={c.id}
              onClick={() => owned && onPick(c.id)}
              aria-label={owned ? c.name : "Criatura bloqueada"}
              style={
                c.legendary && owned
                  ? undefined
                  : { borderColor: active ? TYPE_COLOR[c.type] : "transparent" }
              }
              className={`pop-in relative flex flex-col items-center gap-1 rounded-3xl border-[6px] bg-white/95 p-3 shadow-[0_6px_0_rgba(0,0,0,0.12)] ${
                owned ? "btn-bounce" : ""
              } ${c.legendary && owned ? "rainbow-frame" : ""}`}
            >
              {c.legendary && owned && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border-2 border-white bg-gradient-to-r from-yellow via-orange to-green px-2 py-[2px] text-[0.7rem] font-black text-white shadow">
                  ✨ LEGENDARIA
                </span>
              )}
              <LiveSprite
                src={c.image}
                alt={owned ? c.name : ""}
                dim={!owned}
                motion={i % 3 === 0 ? "sway" : i % 3 === 1 ? "breathe" : "float"}
                delay={(i % 5) * 0.3}
                className="w-24"
              />
              <span className="text-xl font-black text-ink">
                {owned ? `${TYPE_EMOJI[c.type]} ${c.name}` : "🔒"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Elegir({
  progress,
  area,
  onPick,
  onBack,
}: {
  progress: Progress;
  area: Area;
  onPick: (id: string) => void;
  onBack: () => void;
}) {
  const owned = CREATURES.filter((c) => progress.unlocked.includes(c.id));
  // en el combate final, la legendaria va primero y ya viene elegida
  const mine = area.boss
    ? [...owned].sort((a, b) => Number(!!b.legendary) - Number(!!a.legendary))
    : owned;
  return (
    <div className="screen-in flex flex-col items-center gap-4">
      <div className="flex w-full items-center justify-between">
        <button
          onClick={onBack}
          className="btn-bounce rounded-full border-4 border-white bg-white px-5 py-3 text-3xl shadow-[0_5px_0_rgba(0,0,0,0.15)]"
          aria-label="Volver"
        >
          ⬅️
        </button>
        <img src={area.image} alt={area.name} className="float-soft h-20 object-contain" />
      </div>

      <div className="flex items-center gap-3">
        <LiveSprite src={trainerImg} alt="Tu entrenador" motion="hop" className="w-24" />
        <span className="wiggle text-5xl">👉</span>
      </div>

      <div className="grid w-full max-w-sm grid-cols-3 gap-3">
        {mine.map((c, i) => (
          <button
            key={c.id}
            onClick={() => onPick(c.id)}
            aria-label={c.name}
            style={c.legendary ? undefined : { borderColor: TYPE_COLOR[c.type] }}
            className={`pop-in btn-bounce relative flex flex-col items-center rounded-3xl border-[6px] bg-white/95 p-2 shadow-[0_6px_0_rgba(0,0,0,0.12)] ${
              c.legendary ? "rainbow-frame" : ""
            } ${progress.companion === c.id ? "ring-4 ring-yellow" : ""}`}
          >
            <LiveSprite
              src={c.image}
              alt=""
              motion={i % 2 === 0 ? "breathe" : "sway"}
              delay={(i % 4) * 0.25}
              className="w-20"
            />
            <span className="text-2xl">{TYPE_EMOJI[c.type]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Captura({ creature, onClose }: { creature: Creature; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-ink/70 px-6">
      <Confetti />
      <img src={creature.image} alt={creature.name} className="pop-in hop w-56 drop-shadow-2xl" />
      <p className="text-4xl font-black text-white">
        {TYPE_EMOJI[creature.type]} {creature.name}
      </p>
      <LiveSprite src={trainerImg} alt="" motion="hop" className="w-28" />
      <button
        onClick={onClose}
        aria-label="Continuar"
        className="btn-bounce btn-pulse w-full max-w-sm rounded-[2rem] border-4 border-white bg-orange px-6 py-7 text-4xl font-black text-white shadow-[0_10px_0_rgba(0,0,0,0.25)]"
      >
        ✅
      </button>
    </div>
  );
}

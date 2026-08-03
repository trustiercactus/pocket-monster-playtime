import { useCallback, useEffect, useState } from "react";
import {
  CREATURES,
  TYPE_EMOJI,
  TYPE_COLOR,
  XP_PER_LEVEL,
  getCreature,
  randomRival,
  type Creature,
} from "@/lib/creatures";
import { AREAS, type Area } from "@/lib/areas";
import { Scenery } from "@/components/Scenery";
import { Casa } from "@/components/Casa";
import { MapaMundo } from "@/components/MapaMundo";
import { randomEgg, type Egg } from "@/lib/eggs";
import { LiveSprite } from "@/components/LiveSprite";
import trainerImg from "@/assets/trainer.png";
import rivalTrainerImg from "@/assets/rival-trainer.png";
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

type Screen = "mapa" | "casa" | "coleccion" | "elegir" | "batalla";

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

function Hearts({ n, max = MAX_HP }: { n: number; max?: number }) {
  return (
    <div className="flex gap-1 text-2xl leading-none" aria-label={`${n} vidas`}>
      {Array.from({ length: max }).map((_, i) => (
        <span key={i}>{i < n ? "❤️" : "🤍"}</span>
      ))}
    </div>
  );
}

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

function BigButton({
  onClick,
  color,
  children,
  disabled,
  label,
}: {
  onClick: () => void;
  color: string;
  children: React.ReactNode;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      style={{ backgroundColor: color }}
      className="btn-bounce min-h-[92px] flex-1 rounded-[1.75rem] border-4 border-white px-4 py-4 text-4xl font-black text-white shadow-[0_8px_0_rgba(0,0,0,0.2)] disabled:opacity-50"
    >
      {children}
    </button>
  );
}

export function Game({ initialScreen = "mapa" }: { initialScreen?: Screen } = {}) {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [screen, setScreen] = useState<Screen>(initialScreen);
  const [area, setArea] = useState<Area>(AREAS[0] as Area);
  const [fighter, setFighter] = useState<string | null>(null);
  const [captured, setCaptured] = useState<Creature | null>(null);

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
              unlocked: progress.unlocked.includes("estrelin")
                ? progress.unlocked
                : [...progress.unlocked, "estrelin"],
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
          onBack={() => setScreen("mapa")}
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
        <Batalla
          progress={progress}
          area={area}
          companion={companion}
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
              style={{ borderColor: active ? TYPE_COLOR[c.type] : "transparent" }}
              className={`pop-in flex flex-col items-center gap-1 rounded-3xl border-[6px] bg-white/95 p-3 shadow-[0_6px_0_rgba(0,0,0,0.12)] ${
                owned ? "btn-bounce" : ""
              }`}
            >
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
  const mine = CREATURES.filter((c) => progress.unlocked.includes(c.id));
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
            style={{ borderColor: TYPE_COLOR[c.type] }}
            className="pop-in btn-bounce flex flex-col items-center rounded-3xl border-[6px] bg-white/95 p-2 shadow-[0_6px_0_rgba(0,0,0,0.12)]"
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

function Batalla({
  progress,
  area,
  companion,
  onFinish,
  onBack,
}: {
  progress: Progress;
  area: Area;
  companion: Creature;
  onFinish: (won: boolean) => void;
  onBack: () => void;
}) {
  const [rival] = useState(() => randomRival(companion.id));
  const [rivalTeam] = useState(() =>
    Array.from({ length: 2 }, () => randomRival(companion.id)),
  );
  const [myHp, setMyHp] = useState(MAX_HP);
  const [rivalHp, setRivalHp] = useState(MAX_HP);
  const [fx, setFx] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<"win" | "lose" | null>(null);

  const myTeam = CREATURES.filter(
    (c) => progress.unlocked.includes(c.id) && c.id !== companion.id,
  ).slice(0, 2);

  function turn(kind: "fuerte" | "rapido" | "curar") {
    if (busy || result) return;
    setBusy(true);
    let my = myHp;
    let rh = rivalHp;

    if (kind === "fuerte") {
      const hit = Math.random() < 0.6 ? 2 : 1;
      rh -= hit;
      setFx("💥");
    } else if (kind === "rapido") {
      rh -= 1;
      setFx("⚡");
    } else {
      my = Math.min(MAX_HP, my + 1);
      setFx("💚");
    }
    setRivalHp(Math.max(0, rh));
    setMyHp(my);

    setTimeout(() => {
      if (rh <= 0) {
        setFx("🎉");
        setResult("win");
        setBusy(false);
        return;
      }
      const dmg = Math.random() < 0.5 ? 1 : 0;
      const after = Math.max(0, my - dmg);
      setMyHp(after);
      setFx(dmg ? "😵" : "😅");
      setTimeout(() => {
        setFx(null);
        if (after <= 0) setResult("lose");
        setBusy(false);
      }, 600);
    }, 700);
  }

  if (result) {
    return (
      <div className="screen-in relative flex min-h-[85vh] flex-col items-center justify-center gap-6 text-center">
        {result === "win" && <Confetti />}
        <div className="text-8xl pop-in">{result === "win" ? "🎉" : "🤗"}</div>
        <LiveSprite src={trainerImg} alt="" motion="hop" className="w-32" />
        <LiveSprite src={companion.image} alt={companion.name} motion="sway" className="w-40" />
        <button
          onClick={() => onFinish(result === "win")}
          aria-label="Continuar"
          className="btn-bounce btn-pulse w-full max-w-sm rounded-[2rem] border-4 border-white bg-orange px-6 py-7 text-4xl font-black text-white shadow-[0_10px_0_rgba(0,0,0,0.2)]"
        >
          ✅
        </button>
      </div>
    );
  }

  return (
    <div className="screen-in flex min-h-[90vh] flex-col justify-between">
      <div className="flex items-start justify-between">
        <button
          onClick={onBack}
          className="btn-bounce rounded-full border-4 border-white bg-white px-4 py-2 text-2xl shadow-[0_5px_0_rgba(0,0,0,0.15)]"
          aria-label="Volver"
        >
          ⬅️
        </button>
        <img src={area.image} alt={area.name} className="float-soft h-16 object-contain" />
      </div>

      {/* Rival: entrenadora a la derecha con sus criaturas detrás */}
      <div className="flex items-end justify-end gap-1">
        <div className="flex flex-col items-end gap-1">
          <Hearts n={rivalHp} />
          <LiveSprite
            src={rival.image}
            alt={rival.name}
            motion="breathe"
            className="w-24 drop-shadow-xl"
          />
        </div>
        <div className="flex flex-col gap-1">
          {rivalTeam.map((c, i) => (
            <LiveSprite
              key={i}
              src={c.image}
              alt=""
              motion="sway"
              delay={i * 0.4}
              className="w-12 opacity-70"
            />
          ))}
        </div>
        <LiveSprite src={rivalTrainerImg} alt="Entrenadora rival" motion="hop" className="w-20" />
      </div>

      <div className="text-center text-7xl h-24">
        <span className="pop-in inline-block" key={fx ?? "none"}>
          {fx}
        </span>
      </div>

      {/* Jugador: entrenador a la izquierda con sus criaturas detrás */}
      <div className="flex items-end gap-1">
        <LiveSprite src={trainerImg} alt="Tu entrenador" motion="hop" className="w-24" />
        <div className="flex flex-col gap-1">
          {myTeam.map((c, i) => (
            <LiveSprite
              key={c.id}
              src={c.image}
              alt=""
              motion="sway"
              delay={i * 0.4}
              className="w-12 opacity-70"
            />
          ))}
        </div>
        <div className="flex flex-col items-start gap-1">
          <LiveSprite
            src={companion.image}
            alt={companion.name}
            motion="breathe"
            className="w-32 drop-shadow-xl"
          />
          <Hearts n={myHp} />
        </div>
      </div>


      <div className="mt-4 flex gap-3">
        <BigButton
          label="Golpe fuerte"
          color="var(--arcade-orange)"
          onClick={() => turn("fuerte")}
          disabled={busy}
        >
          💥
        </BigButton>
        <BigButton
          label="Golpe rápido"
          color="var(--arcade-blue)"
          onClick={() => turn("rapido")}
          disabled={busy}
        >
          ⚡
        </BigButton>
        <BigButton
          label="Curarse"
          color="var(--arcade-green)"
          onClick={() => turn("curar")}
          disabled={busy}
        >
          💚
        </BigButton>
      </div>
    </div>
  );
}

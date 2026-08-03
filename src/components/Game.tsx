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
import { LiveSprite } from "@/components/LiveSprite";
import trainerImg from "@/assets/trainer.png";
import rivalTrainerImg from "@/assets/rival-trainer.png";

export type Progress = {
  name: string;
  level: number;
  xp: number;
  unlocked: string[];
  companion: string;
  wins: number;
};

type Screen = "mapa" | "coleccion" | "elegir" | "batalla";

const MAX_HP = 5;
const SAVE_KEY = "criaturitas-partida";

const INITIAL: Progress = {
  name: "",
  level: 1,
  xp: 0,
  unlocked: ["flami", "aquip", "hojito"],
  companion: "flami",
  wins: 0,
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

export function Game() {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [screen, setScreen] = useState<Screen>("mapa");
  const [area, setArea] = useState<Area>(AREAS[0] as Area);
  const [fighter, setFighter] = useState<string | null>(null);
  const [captured, setCaptured] = useState<Creature | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SAVE_KEY);
      setProgress(raw ? { ...INITIAL, ...(JSON.parse(raw) as Progress) } : INITIAL);
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
      <main className="min-h-screen bg-sky flex items-center justify-center px-5">
        <NombreForm onDone={(name) => save({ ...progress, name })} />
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
      const newOnes = CREATURES.filter(
        (c) => c.unlockLevel <= level && !progress.unlocked.includes(c.id),
      );
      nuevo = newOnes[0] ?? null;
      save({
        ...progress,
        level,
        xp: levelUp ? 0 : xp,
        unlocked: [...progress.unlocked, ...newOnes.map((c) => c.id)],
        wins: progress.wins + 1,
      });
    }
    setScreen("mapa");
    if (nuevo) setCaptured(nuevo);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-sky px-4 py-5 pb-16">
      <Scenery />
      <div className="relative">
      {screen === "mapa" && (
        <Mapa
          progress={progress}
          onArea={(a) => {
            setArea(a);
            setScreen("elegir");
          }}
          onTeam={() => setScreen("coleccion")}
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

function Mapa({
  progress,
  onArea,
  onTeam,
}: {
  progress: Progress;
  onArea: (a: Area) => void;
  onTeam: () => void;
}) {
  return (
    <div className="screen-in flex flex-col items-center gap-4">
      <div className="flex w-full items-center justify-between">
        <span className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-2xl font-black text-ink">
          <img src={trainerImg} alt="" className="h-9 w-9 object-contain" />⭐ {progress.level}
        </span>
        <span className="text-2xl">{"🏆".repeat(Math.min(progress.wins, 5)) || "🏆"}</span>
      </div>

      <div className="relative flex w-full max-w-sm flex-col gap-3">
        {AREAS.map((a, i) => {
          const open = progress.wins >= a.winsNeeded;
          const left = i % 2 === 0;
          return (
            <div key={a.id} className="flex flex-col items-center">
              {i > 0 && (
                <div className="flex h-8 flex-col justify-center text-3xl leading-none opacity-70">
                  ⚪
                </div>
              )}
              <button
                onClick={() => open && onArea(a)}
                aria-label={open ? a.name : `${a.name} bloqueada`}
                style={{ borderColor: open ? a.color : "transparent" }}
                className={`flex w-[86%] items-center gap-3 rounded-[2rem] border-[6px] bg-white/95 p-3 shadow-[0_8px_0_rgba(0,0,0,0.12)] ${
                  left ? "self-start" : "self-end flex-row-reverse"
                } ${open ? "btn-bounce" : "opacity-60"}`}
              >
                <img
                  src={a.image}
                  alt={a.name}
                  loading="lazy"
                  className={`h-24 w-24 object-contain ${open ? "float-soft" : "grayscale opacity-40"}`}
                  style={{ animationDelay: `${i * 0.3}s` }}
                />
                <span className={`text-5xl ${open ? "wiggle inline-block" : ""}`}>
                  {open ? a.emoji : "🔒"}
                </span>
                {open && <span className="twinkle text-2xl">✨</span>}
              </button>
            </div>
          );
        })}
      </div>

      <button
        onClick={onTeam}
        aria-label="Mi colección"
        className="btn-bounce btn-pulse w-full max-w-sm rounded-[2rem] border-4 border-white bg-green px-6 py-6 text-4xl font-black text-white shadow-[0_8px_0_rgba(0,0,0,0.2)]"
      >
        🐣
      </button>
    </div>
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
        <img src={trainerImg} alt="" className="w-32 wiggle" />
        <img src={companion.image} alt={companion.name} className="w-40 float-soft" />
        <button
          onClick={() => onFinish(result === "win")}
          aria-label="Continuar"
          className="w-full max-w-sm rounded-[2rem] bg-orange px-6 py-7 text-4xl font-black text-white shadow-[0_10px_0_rgba(0,0,0,0.2)] active:translate-y-1"
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
          className="rounded-full bg-white px-4 py-2 text-2xl shadow-[0_5px_0_rgba(0,0,0,0.15)] active:translate-y-1"
          aria-label="Volver"
        >
          ⬅️
        </button>
        <img src={area.image} alt={area.name} className="h-16 object-contain opacity-80" />
      </div>

      {/* Rival: entrenadora a la derecha con sus criaturas detrás */}
      <div className="flex items-end justify-end gap-1">
        <div className="flex flex-col items-end gap-1">
          <Hearts n={rivalHp} />
          <img src={rival.image} alt={rival.name} className="w-24 drop-shadow-xl float-soft" />
        </div>
        <div className="flex flex-col gap-1">
          {rivalTeam.map((c, i) => (
            <img key={i} src={c.image} alt="" className="w-12 opacity-70" />
          ))}
        </div>
        <img src={rivalTrainerImg} alt="Entrenadora rival" className="w-20" />
      </div>

      <div className="text-center text-7xl h-24">{fx}</div>

      {/* Jugador: entrenador a la izquierda con sus criaturas detrás */}
      <div className="flex items-end gap-1">
        <img src={trainerImg} alt="Tu entrenador" className="w-24" />
        <div className="flex flex-col gap-1">
          {myTeam.map((c) => (
            <img key={c.id} src={c.image} alt="" className="w-12 opacity-70" />
          ))}
        </div>
        <div className="flex flex-col items-start gap-1">
          <img
            src={companion.image}
            alt={companion.name}
            className="w-32 drop-shadow-xl float-soft"
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

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import {
  CREATURES,
  TYPE_EMOJI,
  TYPE_COLOR,
  XP_PER_LEVEL,
  getCreature,
  randomRival,
  type Creature,
} from "@/lib/creatures";

export type Progress = {
  level: number;
  xp: number;
  unlocked: string[];
  companion: string;
  wins: number;
};

type Screen = "menu" | "equipo" | "batalla";

const MAX_HP = 5;
const GUEST_KEY = "criaturitas-invitado";

const INITIAL: Progress = {
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
      className="min-h-[92px] flex-1 rounded-[1.75rem] px-4 py-4 text-4xl font-black text-white shadow-[0_8px_0_rgba(0,0,0,0.2)] active:translate-y-1 active:shadow-[0_3px_0_rgba(0,0,0,0.2)] disabled:opacity-50"
    >
      {children}
    </button>
  );
}

export function Game({ mode }: { mode: "cloud" | "invitado" }) {
  const navigate = useNavigate();
  const [progress, setProgress] = useState<Progress | null>(null);
  const [screen, setScreen] = useState<Screen>("menu");

  useEffect(() => {
    (async () => {
      if (mode === "invitado") {
        try {
          const raw = window.localStorage.getItem(GUEST_KEY);
          setProgress(raw ? { ...INITIAL, ...(JSON.parse(raw) as Progress) } : INITIAL);
        } catch {
          setProgress(INITIAL);
        }
        return;
      }
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return;
      const { data } = await supabase
        .from("game_progress")
        .select("level, xp, unlocked, companion, wins")
        .eq("user_id", uid)
        .maybeSingle();
      setProgress(data ? (data as Progress) : INITIAL);
    })();
  }, [mode]);

  const save = useCallback(
    async (next: Progress) => {
      setProgress(next);
      if (mode === "invitado") {
        try {
          window.localStorage.setItem(GUEST_KEY, JSON.stringify(next));
        } catch {
          /* sin guardado */
        }
        return;
      }
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return;
      await supabase.from("game_progress").upsert({ user_id: uid, ...next });
    },
    [mode],
  );

  if (!progress) {
    return (
      <main className="min-h-screen bg-sky flex items-center justify-center text-5xl">⏳</main>
    );
  }

  const companion = getCreature(progress.companion);

  return (
    <main className="min-h-screen bg-sky px-4 py-5">
      {screen === "menu" && (
        <Menu
          progress={progress}
          companion={companion}
          guest={mode === "invitado"}
          onPlay={() => setScreen("batalla")}
          onTeam={() => setScreen("equipo")}
          onExit={async () => {
            if (mode === "cloud") await supabase.auth.signOut();
            navigate({ to: "/", replace: true });
          }}
        />
      )}
      {screen === "equipo" && (
        <Equipo
          progress={progress}
          onPick={(id) => save({ ...progress, companion: id })}
          onBack={() => setScreen("menu")}
        />
      )}
      {screen === "batalla" && (
        <Batalla
          companion={companion}
          onFinish={(won) => {
            if (won) {
              const xp = progress.xp + 1;
              const levelUp = xp >= XP_PER_LEVEL;
              const level = levelUp ? progress.level + 1 : progress.level;
              const newOnes = CREATURES.filter(
                (c) => c.unlockLevel <= level && !progress.unlocked.includes(c.id),
              ).map((c) => c.id);
              save({
                level,
                xp: levelUp ? 0 : xp,
                unlocked: [...progress.unlocked, ...newOnes],
                companion: progress.companion,
                wins: progress.wins + 1,
              });
            }
            setScreen("menu");
          }}
          onBack={() => setScreen("menu")}
        />
      )}
    </main>
  );
}

function Menu({
  progress,
  companion,
  guest,
  onPlay,
  onTeam,
  onExit,
}: {
  progress: Progress;
  companion: Creature;
  guest: boolean;
  onPlay: () => void;
  onTeam: () => void;
  onExit: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex w-full items-center justify-between">
        <span className="rounded-full bg-white px-4 py-2 text-2xl font-black text-ink">
          ⭐ {progress.level}
        </span>
        <span className="text-2xl">{"🏆".repeat(Math.min(progress.wins, 5)) || "🏆"}</span>
      </div>

      <img
        src={companion.image}
        alt={companion.name}
        className="w-56 animate-[bounce_2.2s_ease-in-out_infinite] drop-shadow-2xl"
      />
      <p className="text-3xl font-black text-ink">
        {TYPE_EMOJI[companion.type]} {companion.name}
      </p>

      <div className="flex w-full max-w-sm gap-1">
        {Array.from({ length: XP_PER_LEVEL }).map((_, i) => (
          <div
            key={i}
            className="h-5 flex-1 rounded-full"
            style={{ backgroundColor: i < progress.xp ? "var(--arcade-yellow)" : "#ffffff" }}
          />
        ))}
      </div>

      <button
        onClick={onPlay}
        className="w-full max-w-sm rounded-[2rem] bg-orange px-6 py-8 text-4xl font-black text-white shadow-[0_10px_0_rgba(0,0,0,0.2)] active:translate-y-1"
      >
        ⚔️ LUCHAR
      </button>
      <button
        onClick={onTeam}
        className="w-full max-w-sm rounded-[2rem] bg-green px-6 py-6 text-3xl font-black text-white shadow-[0_8px_0_rgba(0,0,0,0.2)] active:translate-y-1"
      >
        🐣 MIS AMIGOS
      </button>
      {guest && <p className="text-sm text-ink/60">Modo invitado: se guarda solo en este aparato</p>}
      <button onClick={onExit} className="mt-1 text-ink/60 underline">
        Salir
      </button>
    </div>
  );
}

function Equipo({
  progress,
  onPick,
  onBack,
}: {
  progress: Progress;
  onPick: (id: string) => void;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={onBack}
        className="self-start rounded-full bg-white px-5 py-3 text-3xl shadow-[0_5px_0_rgba(0,0,0,0.15)]"
        aria-label="Volver"
      >
        ⬅️
      </button>
      <div className="grid w-full max-w-sm grid-cols-2 gap-3">
        {CREATURES.map((c) => {
          const owned = progress.unlocked.includes(c.id);
          const active = progress.companion === c.id;
          return (
            <button
              key={c.id}
              onClick={() => owned && onPick(c.id)}
              aria-label={owned ? c.name : "Criatura bloqueada"}
              style={{ borderColor: active ? TYPE_COLOR[c.type] : "transparent" }}
              className="flex flex-col items-center gap-1 rounded-3xl border-[6px] bg-white p-3 shadow-[0_6px_0_rgba(0,0,0,0.12)] active:translate-y-1"
            >
              <img
                src={c.image}
                alt={c.name}
                className={owned ? "w-24" : "w-24 opacity-25 grayscale"}
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

function Batalla({
  companion,
  onFinish,
  onBack,
}: {
  companion: Creature;
  onFinish: (won: boolean) => void;
  onBack: () => void;
}) {
  const [rival] = useState(() => randomRival(companion.id));
  const [myHp, setMyHp] = useState(MAX_HP);
  const [rivalHp, setRivalHp] = useState(MAX_HP);
  const [fx, setFx] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<"win" | "lose" | null>(null);

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
      <div className="flex min-h-[85vh] flex-col items-center justify-center gap-6 text-center">
        <div className="text-8xl">{result === "win" ? "🎉" : "🤗"}</div>
        <p className="text-4xl font-black text-ink">{result === "win" ? "¡GANASTE!" : "¡CASI!"}</p>
        <img src={companion.image} alt={companion.name} className="w-48" />
        <button
          onClick={() => onFinish(result === "win")}
          className="w-full max-w-sm rounded-[2rem] bg-orange px-6 py-7 text-3xl font-black text-white shadow-[0_10px_0_rgba(0,0,0,0.2)] active:translate-y-1"
        >
          ✅ SEGUIR
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[90vh] flex-col justify-between">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="rounded-full bg-white px-4 py-2 text-2xl shadow-[0_5px_0_rgba(0,0,0,0.15)]"
          aria-label="Volver"
        >
          ⬅️
        </button>
        <div className="flex flex-col items-end gap-1">
          <Hearts n={rivalHp} />
          <img src={rival.image} alt={rival.name} className="w-28 drop-shadow-xl" />
        </div>
      </div>

      <div className="text-center text-7xl h-24">{fx}</div>

      <div className="flex flex-col items-start gap-1">
        <img src={companion.image} alt={companion.name} className="w-40 drop-shadow-xl" />
        <Hearts n={myHp} />
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

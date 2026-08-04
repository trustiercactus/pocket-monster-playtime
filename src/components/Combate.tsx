import { useCallback, useEffect, useRef, useState } from "react";
import { getCreature, type Creature } from "@/lib/creatures";
import type { Area } from "@/lib/areas";
import { LiveSprite } from "@/components/LiveSprite";

const MAX_HP = 5;
const SUPER_CHARGE = 3;

/** icono de ataque según el tipo/zona de la criatura */
function attackIcon(c: Creature, area: Area): string {
  if (area.id === "nieve") return "❄️";
  if (area.id === "volcan") return "🔥";
  if (area.id === "desierto") return "🪨";
  switch (c.type) {
    case "fuego":
      return "🔥";
    case "agua":
      return "💧";
    case "planta":
      return "🍃";
    default:
      return "⚡";
  }
}

function speak(text: string) {
  try {
    const s = window.speechSynthesis;
    if (!s) return;
    s.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "es-ES";
    u.rate = 0.9;
    u.pitch = 1.3;
    s.speak(u);
  } catch {
    /* sin voz */
  }
}

function boom(strong: boolean) {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = strong ? "sawtooth" : "triangle";
    o.frequency.setValueAtTime(strong ? 180 : 520, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(strong ? 40 : 220, ctx.currentTime + 0.35);
    g.gain.setValueAtTime(strong ? 0.35 : 0.18, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.42);
  } catch {
    /* sin sonido */
  }
}

/** corazones que nunca desaparecen de golpe: rebotan, se encogen y destellan */
function Hearts({ n, big }: { n: number; big?: boolean }) {
  const [shown, setShown] = useState(n);
  const [losing, setLosing] = useState<number[]>([]);

  useEffect(() => {
    if (n === shown) return;
    if (n > shown) {
      setShown(n);
      return;
    }
    const idx = Array.from({ length: shown - n }, (_, i) => shown - 1 - i);
    setLosing(idx);
    const t = window.setTimeout(() => {
      setShown(n);
      setLosing([]);
    }, 520);
    return () => clearTimeout(t);
  }, [n, shown]);

  return (
    <div
      className={`flex justify-center gap-1 leading-none ${big ? "text-4xl" : "text-3xl"}`}
      aria-label={`${n} de ${MAX_HP} vidas`}
    >
      {Array.from({ length: MAX_HP }).map((_, i) => {
        const lost = losing.includes(i);
        const full = i < shown;
        return (
          <span
            key={i}
            className={
              lost
                ? "heart-lose inline-block"
                : full
                  ? "heart-beat inline-block"
                  : "inline-block opacity-70"
            }
          >
            {full ? "❤️" : "🤍"}
          </span>
        );
      })}
    </div>
  );
}

/** ambiente vivo del bioma: hojas, copos, humo, olas... */
function AmbientLayer({ area }: { area: Area }) {
  const kindClass = { fall: "amb-fall", rise: "amb-rise", drift: "amb-drift" } as const;
  const items = Array.from({ length: 16 }, (_, i) => {
    const a = area.ambient[i % area.ambient.length]!;
    return { a, i };
  });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {items.map(({ a, i }) => (
        <span
          key={i}
          className={`absolute ${kindClass[a.kind]}`}
          style={{
            left: `${(i * 37) % 96}%`,
            top: `${(i * 53) % 88}%`,
            fontSize: `${1.1 + ((i * 7) % 5) * 0.28}rem`,
            animationDelay: `${(i % 8) * 0.9}s`,
            animationDuration: `${5 + (i % 5)}s`,
            opacity: 0.85,
          }}
        >
          {a.emoji}
        </span>
      ))}
    </div>
  );
}

/** botón enorme circular */
function RoundButton({
  onClick,
  disabled,
  label,
  color,
  size = "big",
  className = "",
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  label: string;
  color: string;
  size?: "big" | "huge";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      style={{ background: color }}
      className={`btn-bounce grid place-items-center rounded-full border-[6px] border-white text-white shadow-[0_10px_0_rgba(0,0,0,0.28)] disabled:opacity-60 ${
        size === "huge" ? "h-28 w-28 text-6xl" : "h-24 w-24 text-5xl"
      } ${className}`}
    >
      {children}
    </button>
  );
}

type Fx = { id: number; emoji: string; big?: boolean };

export function Combate({
  area,
  companion,
  onFinish,
  onBack,
}: {
  area: Area;
  companion: Creature;
  onFinish: (won: boolean) => void;
  onBack: () => void;
}) {
  const guardian = getCreature(area.guardian);
  const [guardHp, setGuardHp] = useState(MAX_HP);
  const [myHp, setMyHp] = useState(MAX_HP);
  const [heals, setHeals] = useState(2);
  const [charge, setCharge] = useState(0);
  const [busy, setBusy] = useState(false);
  const [hitGuard, setHitGuard] = useState(false);
  const [hitMe, setHitMe] = useState(false);
  const [lungeMe, setLungeMe] = useState(false);
  const [lungeGuard, setLungeGuard] = useState(false);
  const [shake, setShake] = useState(false);
  const [micro, setMicro] = useState(false);
  const [ring, setRing] = useState(false);
  const [flyHeart, setFlyHeart] = useState(false);
  const [fx, setFx] = useState<Fx[]>([]);
  /** 0 = luchando, 1..5 fases del final feliz */
  const [ending, setEnding] = useState(0);
  const timers = useRef<number[]>([]);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function pop(emoji: string, big = false) {
    const id = Date.now() + Math.random();
    setFx((f) => [...f, { id, emoji, big }]);
    later(() => setFx((f) => f.filter((x) => x.id !== id)), 900);
  }

  function guardianTurn(current: number) {
    later(() => {
      setLungeGuard(true);
      later(() => setLungeGuard(false), 560);
      later(() => {
        setHitMe(true);
        setMicro(true);
        boom(false);
        pop("💨");
        // nunca puede perder: el último corazón no se quita
        setMyHp(Math.max(1, current - 1));
        later(() => setMicro(false), 300);
        later(() => setHitMe(false), 500);
        later(() => setBusy(false), 700);
      }, 260);
    }, 620);
  }

  function damage(amount: number, icon: string, strong: boolean) {
    if (busy || ending) return;
    setBusy(true);
    setLungeMe(true);
    later(() => setLungeMe(false), 560);

    later(() => {
      boom(strong);
      pop(icon, strong);
      setHitGuard(true);
      if (strong) {
        setRing(true);
        setShake(true);
        later(() => setRing(false), 720);
        later(() => setShake(false), 600);
        for (let i = 0; i < 14; i++)
          later(() => pop(["✨", "💥", "⭐", "🌟"][i % 4] as string), i * 45);
      } else {
        setMicro(true);
        later(() => setMicro(false), 300);
      }
      const next = Math.max(0, guardHp - amount);
      setGuardHp(next);
      later(() => setHitGuard(false), 500);

      if (next === 0) {
        later(() => startEnding(), 800);
        return;
      }
      guardianTurn(myHp);
    }, 260);
  }

  function normalAttack() {
    if (busy || ending) return;
    setCharge((c) => Math.min(SUPER_CHARGE, c + 1));
    damage(1, attackIcon(companion, area), false);
  }

  function superAttack() {
    if (charge < SUPER_CHARGE) return;
    setCharge(0);
    damage(2, "💥", true);
  }

  function heal() {
    if (busy || ending || heals <= 0 || myHp >= MAX_HP) {
      if (!busy && !ending && heals > 0) {
        // vida llena: no gasta nada, solo brillo
        pop("✨");
      }
      return;
    }
    setBusy(true);
    setHeals((h) => h - 1);
    setFlyHeart(true);
    later(() => {
      setFlyHeart(false);
      setMyHp((v) => Math.min(MAX_HP, v + 1));
      setBusy(false);
    }, 900);
  }

  function startEnding() {
    setEnding(1); // sorprendido
    later(() => setEnding(2), 900); // sonríe y brilla
    later(() => setEnding(3), 1900); // esmeralda
    later(() => {
      setEnding(4); // poké ball
      speak("¡Ahora es tu amigo!");
    }, 2900);
    later(() => setEnding(5), 4200); // entra en la ball
    later(() => onFinish(true), 5600);
  }

  const healColor = heals === 2 ? "var(--arcade-green)" : heals === 1 ? "#9fe3a8" : "#b9b9b9";
  const chargeReady = charge >= SUPER_CHARGE;
  const chargePct = (charge / SUPER_CHARGE) * 100;

  return (
    <div
      className={`fixed inset-0 z-40 overflow-hidden ${shake ? "screen-shake" : micro ? "micro-shake" : ""}`}
      style={{ touchAction: "manipulation" }}
    >
      {/* Fondo de la zona a pantalla completa */}
      <img
        src={area.image}
        alt=""
        className="absolute inset-0 h-full w-full scale-105 object-cover"
      />
      <div className="absolute inset-0 bg-white/5" />

      {/* ambiente vivo del bioma */}
      <AmbientLayer area={area} />

      {/* efectos flotantes */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {fx.map((f, i) => (
          <span
            key={f.id}
            className="fx-pop absolute"
            style={{
              left: `${20 + ((i * 23) % 60)}%`,
              top: `${25 + ((i * 17) % 35)}%`,
              fontSize: f.big ? "5rem" : "3.5rem",
            }}
          >
            {f.emoji}
          </span>
        ))}
        {ring && (
          <span
            className="boom-ring absolute left-1/2 top-[38%] h-40 w-40 rounded-full border-8 border-white/90"
            style={{ boxShadow: "0 0 40px rgba(255,255,255,0.9)" }}
          />
        )}
      </div>

      <div className="relative flex h-full flex-col px-4 pb-10 pt-3">
        {/* SUPERIOR */}
        <div className="relative flex items-start">
          <button
            onClick={onBack}
            aria-label="Volver"
            className="btn-bounce rounded-full border-4 border-white bg-white/95 px-4 py-2 text-2xl shadow-[0_5px_0_rgba(0,0,0,0.2)]"
          >
            ⬅️
          </button>
          <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col items-center gap-1">
            <span className="rounded-full border-4 border-white bg-ink/70 px-4 py-1 text-xl font-black text-white">
              {guardian.name} Guardián
            </span>
            <Hearts n={guardHp} />
          </div>
        </div>

        {/* ZONA DE COMBATE: los dos muy cerca */}
        <div className="flex flex-1 flex-col items-center justify-center gap-1">
          {/* GUARDIÁN */}
          <div className="relative flex justify-center">
            <div className={`${hitGuard ? "hit-shake" : ""} ${lungeGuard ? "lunge-down" : ""}`}>
              <LiveSprite
                src={guardian.image}
                alt={guardian.name}
                motion="float"
                className={`w-52 drop-shadow-2xl transition-all duration-500 ${
                  ending >= 2 ? "friend-glow" : ""
                } ${ending === 1 ? "surprise-jump" : ""} ${ending >= 5 ? "into-ball" : ""}`}
              />
              {/* ojos malvados mientras está hechizado */}
              {ending < 2 && (
                <>
                  <span className="evil-eye absolute left-[38%] top-[34%]" />
                  <span className="evil-eye absolute left-[54%] top-[34%]" />
                </>
              )}
              {ending >= 2 && <span className="absolute -right-2 top-2 text-5xl pop-in">😊</span>}
              {ending === 1 && <span className="absolute -right-2 top-0 text-5xl pop-in">😲</span>}
            </div>
            {ending >= 3 && (
              <span
                className="gem-drop absolute -top-2 text-6xl"
                style={{ color: area.gem, filter: `drop-shadow(0 0 16px ${area.gem})` }}
              >
                💎
              </span>
            )}
            {ending >= 4 && <span className="ball-in absolute bottom-0 text-7xl">⚪</span>}
          </div>

          {/* CRIATURA DEL JUGADOR */}
          <div className="relative -mt-3 flex flex-col items-center gap-1">
            {flyHeart && <span className="heal-fly absolute -top-4 text-5xl">💚</span>}
            <div className={`${hitMe ? "hit-shake" : ""} ${lungeMe ? "lunge-up" : ""}`}>
              <LiveSprite
                src={companion.image}
                alt={companion.name}
                motion="breathe"
                className="w-40 drop-shadow-2xl"
              />
            </div>
            <Hearts n={myHp} big />
          </div>
        </div>

        {/* BOTONES */}
        <div className="mt-2 flex items-center justify-center gap-5">
          <RoundButton
            label="Atacar"
            color="var(--arcade-orange)"
            onClick={normalAttack}
            disabled={busy || ending > 0}
            size="huge"
          >
            {attackIcon(companion, area)}
          </RoundButton>

          <RoundButton
            label="Curar"
            color={healColor}
            onClick={heal}
            disabled={busy || ending > 0 || heals === 0}
          >
            <span
              className="relative inline-block text-5xl"
              style={{
                filter:
                  heals === 0
                    ? "grayscale(1) brightness(0.9)"
                    : heals === 1
                      ? "grayscale(0.5)"
                      : "none",
              }}
            >
              💚
            </span>
          </RoundButton>

          <RoundButton
            label="Superataque"
            color="var(--arcade-yellow)"
            onClick={superAttack}
            disabled={busy || ending > 0 || !chargeReady}
            size="huge"
            className={chargeReady ? "btn-pulse star-ready" : ""}
          >
            <span className="relative grid h-16 w-16 place-items-center">
              <span className="absolute inset-0 grid place-items-center text-6xl opacity-40">
                ⭐
              </span>
              <span
                className="absolute inset-0 grid place-items-center overflow-hidden text-6xl"
                style={{ clipPath: `inset(${100 - chargePct}% 0 0 0)` }}
              >
                ⭐
              </span>
              {chargeReady && (
                <span className="absolute -right-1 -top-1 text-2xl twinkle">✨</span>
              )}
            </span>
          </RoundButton>
        </div>
      </div>
    </div>
  );
}

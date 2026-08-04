import { useCallback, useEffect, useRef, useState } from "react";
import { getCreature, type Creature } from "@/lib/creatures";
import type { Area } from "@/lib/areas";
import { LiveSprite } from "@/components/LiveSprite";
import mapaFondo from "@/assets/mapa-vertical.jpg";

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
      className={`flex justify-center gap-2 leading-none ${big ? "text-5xl" : "text-4xl"}`}
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

/** botón enorme circular, degradado continuo y destello al pulsar */
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
  const [flash, setFlash] = useState(0);

  return (
    <button
      onClick={() => {
        if (disabled) return;
        setFlash((f) => f + 1);
        onClick();
      }}
      disabled={disabled}
      aria-label={label}
      style={{
        background: `radial-gradient(circle at 50% 22%, color-mix(in oklab, ${color} 65%, white), ${color} 62%, color-mix(in oklab, ${color} 72%, black))`,
      }}
      className={`btn-orb ${flash ? "orb-bounce" : ""} grid place-items-center rounded-full border-[6px] border-white text-white shadow-[0_10px_0_rgba(0,0,0,0.28)] disabled:opacity-60 ${
        size === "huge" ? "h-28 w-28 text-6xl" : "h-24 w-24 text-5xl"
      } ${className}`}
    >
      <span className="relative z-10 grid place-items-center drop-shadow-[0_3px_0_rgba(0,0,0,0.25)]">
        {children}
      </span>
      {flash > 0 && (
        <span
          key={flash}
          className="orb-flash pointer-events-none absolute inset-0 rounded-full bg-white/70"
          aria-hidden="true"
        />
      )}
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
      {/* El mismo mapa, con la cámara ampliada sobre esta zona */}
      <div
        className="battle-zoom absolute inset-0"
        style={{
          backgroundImage: `url(${mapaFondo})`,
          backgroundSize: "cover",
          backgroundPosition: `${area.x}% ${area.y}%`,
        }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-white/10" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(circle at 50% 45%, transparent 40%, ${area.color}22 75%, rgba(20,26,40,0.35) 100%)`,
        }}
        aria-hidden="true"
      />


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

      <div className="relative flex h-full flex-col px-3 pb-10 pt-2">
        {/* SUPERIOR — mismo lenguaje visual que el mapa */}
        <div className="relative flex items-start">
          <button
            onClick={onBack}
            aria-label="Volver"
            style={{ backgroundColor: area.color }}
            className="btn-bounce btn-3d z-10 grid h-11 w-11 place-items-center rounded-full border-[3px] border-white text-xl text-white shadow-[0_5px_0_rgba(0,0,0,0.35)]"
          >
            <span className="drop-shadow-[0_2px_0_rgba(0,0,0,0.35)]">⬅️</span>
          </button>
          <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col items-center gap-1">
            <span className="flex items-center gap-2 rounded-full border-4 border-white/90 bg-ink/85 px-4 py-1 text-lg font-black tracking-wide text-white shadow-[0_6px_0_rgba(0,0,0,0.4)]">
              <span>{area.emoji}</span>
              {guardian.name}
              <span
                className="grid h-6 w-6 place-items-center rounded-full border-2 border-white/90"
                style={{
                  background: `radial-gradient(circle at 50% 28%, ${area.gem}, rgba(0,0,0,0.3))`,
                }}
                aria-hidden="true"
              />
            </span>
            <Hearts n={guardHp} />
          </div>
        </div>

        {/* ZONA DE COMBATE: los dos muy cerca, protagonistas */}
        <div className="flex flex-1 flex-col items-center justify-center gap-0">
          {/* GUARDIÁN */}
          <div className="relative flex justify-center">
            <span
              className="pointer-events-none absolute -bottom-1 left-1/2 h-4 w-32 -translate-x-1/2 rounded-[50%] blur-[4px]"
              style={{ background: "rgba(0,0,0,0.3)" }}
              aria-hidden="true"
            />
            <div
              className={`${hitGuard ? "hit-shake knockback-up" : ""} ${lungeGuard ? "lunge-down" : ""}`}
            >
              <LiveSprite
                src={guardian.image}
                alt={guardian.name}
                motion="float"
                className={`w-56 drop-shadow-[0_10px_10px_rgba(0,0,0,0.45)] transition-all duration-500 ${
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
              {hitGuard && ending === 0 && (
                <span className="pop-in absolute -left-2 top-2 text-5xl">😖</span>
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
          <div className="relative -mt-6 flex flex-col items-center gap-1">
            {flyHeart && <span className="heal-fly absolute -top-4 text-5xl">💚</span>}
            <span
              className="pointer-events-none absolute bottom-12 left-1/2 h-4 w-28 -translate-x-1/2 rounded-[50%] blur-[4px]"
              style={{ background: "rgba(0,0,0,0.3)" }}
              aria-hidden="true"
            />
            <div className={`tail-wag ${hitMe ? "hit-shake knockback-down" : ""} ${lungeMe ? "lunge-up" : ""}`}>
              <LiveSprite
                src={companion.image}
                alt={companion.name}
                motion="breathe"
                className="w-44 drop-shadow-[0_10px_10px_rgba(0,0,0,0.45)]"
              />
              {hitMe && <span className="pop-in absolute -right-2 top-2 text-4xl">😖</span>}
            </div>
            <Hearts n={myHp} big />
          </div>
        </div>


        {/* BOTONES */}
        <div className="mt-2 flex items-center justify-center gap-7">
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
            <span className="relative inline-grid h-14 w-14 place-items-center">
              {/* corazón gris de base */}
              <span
                className="absolute inset-0 grid place-items-center text-5xl"
                style={{ filter: "grayscale(1) brightness(0.85)" }}
              >
                💚
              </span>
              {/* parte verde restante: 100% → 50% → 0% */}
              <span
                className="absolute inset-0 grid place-items-center overflow-hidden text-5xl"
                style={{ clipPath: `inset(0 ${100 - heals * 50}% 0 0)` }}
              >
                💚
              </span>
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
            {/* borde dorado que se ilumina con la carga */}
            <span
              className="pointer-events-none absolute -inset-[6px] rounded-full"
              style={{
                background: `conic-gradient(from -90deg, #ffd54a 0 ${chargePct}%, rgba(255,255,255,0.35) ${chargePct}% 100%)`,
                mask: "radial-gradient(circle, transparent 60%, #000 62%)",
                WebkitMask: "radial-gradient(circle, transparent 60%, #000 62%)",
                filter: chargeReady ? "drop-shadow(0 0 10px #ffd54a)" : "none",
              }}
              aria-hidden="true"
            />
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

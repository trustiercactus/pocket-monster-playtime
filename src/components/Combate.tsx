import { useCallback, useEffect, useRef, useState } from "react";
import { getCreature, type Creature } from "@/lib/creatures";
import { GEM_ZONES, type Area } from "@/lib/areas";
import { LiveSprite } from "@/components/LiveSprite";
import { Gema } from "@/components/Gema";
import mapaFondo from "@/assets/mapa-vertical.jpg";
import { narrar, playMusic, sfx, musicPause } from "@/lib/audio";

const MAX_HP = 5;
const SUPER_CHARGE = 3;
const GEM_GAP = 34;

/** barra superior de esmeraldas, igual que en el mapa */
function GemBar({ zonesDone, filling }: { zonesDone: string[]; filling: string | null }) {
  return (
    <div className="pointer-events-none absolute left-1/2 top-1 z-30 flex -translate-x-1/2 items-center rounded-full border-4 border-white/90 bg-ink/85 px-2 py-1 shadow-[0_6px_0_rgba(0,0,0,0.4)]">
      {GEM_ZONES.map((z) => {
        const on = zonesDone.includes(z.id) || filling === z.id;
        return (
          <span
            key={z.id}
            className="relative grid place-items-center"
            style={{ width: GEM_GAP, height: 34 }}
          >
            <svg width="28" height="32" viewBox="0 0 24 28" aria-hidden="true">
              <path
                d="M7 2h10l5 6v12l-5 6H7l-5-6V8z"
                fill="rgba(255,255,255,0.92)"
                stroke="#ffffff"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
            </svg>
            {on && (
              <span
                className={`${filling === z.id ? "socket-fill" : ""} absolute inset-0 grid place-items-center`}
              >
                <Gema color={z.gem} cut={z.gemCut} size={24} />
                {filling === z.id && (
                  <span className="socket-flash absolute -inset-2 rounded-full bg-white" />
                )}
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

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
  void narrar(text);
}

function boom(strong: boolean) {
  sfx(strong ? "super" : "ataque");
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

/** botón circular único: aro de carga opcional, brillo de juguete, sin marcos dobles */
function RoundButton({
  onClick,
  disabled,
  label,
  color,
  charge,
  ready,
  invite,
  hint,
  inviteDelay = 0,
  className = "",
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  label: string;
  color: string;
  /** 0..1 — dibuja el aro de carga en el propio borde del botón */
  charge?: number;
  ready?: boolean;
  /** es el turno del niño: rebota y brilla invitando a pulsar */
  invite?: boolean;
  /** flecha simpática que señala este botón */
  hint?: boolean;
  inviteDelay?: number;
  className?: string;
  children: React.ReactNode;
}) {
  const [flash, setFlash] = useState(0);
  const pct = Math.round((charge ?? 0) * 100);

  return (
    <div className="relative">
      {hint && (
        <span
          className="hint-arrow pointer-events-none absolute -top-12 left-1/2 z-20 text-4xl drop-shadow-[0_3px_0_rgba(0,0,0,0.35)]"
          aria-hidden="true"
        >
          👇
        </span>
      )}
      <button
        onClick={() => {
          if (disabled) return;
          setFlash((f) => f + 1);
          onClick();
        }}
        disabled={disabled}
        aria-label={label}
        style={{
          background: `radial-gradient(circle at 50% 20%, color-mix(in oklab, ${color} 62%, white), ${color} 60%, color-mix(in oklab, ${color} 78%, black))`,
          animationDelay: invite ? `${inviteDelay}ms` : undefined,
        }}
        className={`btn-orb ${flash ? "orb-bounce" : ""} ${ready ? "orb-ready" : invite ? "turn-bob turn-glow" : ""} relative grid h-24 w-24 place-items-center rounded-full border-[3px] border-white/90 text-5xl text-white shadow-[0_6px_14px_rgba(0,0,0,0.28)] disabled:opacity-55 ${className}`}
      >
        {charge !== undefined && (
          <span
            className="pointer-events-none absolute -inset-[7px] rounded-full"
            style={{
              background: ready
                ? "conic-gradient(from -90deg, #ffe27a, #ffb300 40%, #ffe27a 70%, #ffb300)"
                : `conic-gradient(from -90deg, #ffd54a 0 ${pct}%, rgba(255,255,255,0.32) ${pct}% 100%)`,
              mask: "radial-gradient(circle, transparent 78%, #000 79%)",
              WebkitMask: "radial-gradient(circle, transparent 78%, #000 79%)",
              filter: ready ? "drop-shadow(0 0 10px rgba(255,200,60,0.95))" : "none",
            }}
            aria-hidden="true"
          />
        )}
        <span className="relative z-10 grid place-items-center drop-shadow-[0_2px_2px_rgba(0,0,0,0.28)]">
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
    </div>
  );
}


type Fx = { id: number; emoji: string; big?: boolean };

export function Combate({
  area,
  companion,
  zonesDone = [],
  onFinish,
  onBack,
}: {
  area: Area;
  companion: Creature;
  zonesDone?: string[];
  onFinish: (won: boolean) => void;
  onBack: () => void;
}) {
  const guardian = getCreature(area.guardian);
  const gemIndex = GEM_ZONES.findIndex((z) => z.id === area.id);
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

  useEffect(() => {
    playMusic("combate");
    return () => playMusic("mapa");
  }, []);

  /** es el turno del niño: los botones invitan a pulsar (sin texto) */
  const miTurno = !busy && ending === 0;
  /** primer combate: una flecha simpática señala el ataque */
  const [hint, setHint] = useState(false);
  useEffect(() => {
    try {
      setHint(!window.localStorage.getItem("criaturitas-primer-combate"));
    } catch {
      setHint(false);
    }
  }, []);
  const firstTurn = useRef(true);
  useEffect(() => {
    if (!miTurno) return;
    if (firstTurn.current) {
      firstTurn.current = false;
      return;
    }
    sfx("turno");
  }, [miTurno]);


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
        sfx("dano");
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
    if (hint) {
      setHint(false);
      try {
        window.localStorage.setItem("criaturitas-primer-combate", "1");
      } catch {
        /* sin guardado */
      }
    }

    setCharge((c) => {
      const n = Math.min(SUPER_CHARGE, c + 1);
      if (n > c) sfx("cargar");
      return n;
    });
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
    sfx("curar");
    setFlyHeart(true);
    later(() => {
      setFlyHeart(false);
      setMyHp((v) => Math.min(MAX_HP, v + 1));
      setBusy(false);
    }, 900);
  }

  function startEnding() {
    setEnding(1); // sorprendido
    if (area.boss) {
      musicPause(500);
      sfx("jefe");
    } else {
      sfx("desbloqueo");
    }
    later(() => {
      setEnding(2); // sonríe y brilla
      speak(area.boss ? "¡Muy bien! ¡Has salvado el Reino!" : "¡Muy bien! ¡Ya es tu amiga!");
    }, 900);
    later(() => setEnding(3), 2100); // desaparece entre partículas de luz
    if (area.boss) {
      // el jefe final se deshace en humo oscuro y la pantalla se llena de luz
      later(() => onFinish(true), 4200);
      return;
    }
    later(() => setEnding(4), 3000); // aparece su esmeralda girando
    later(() => setEnding(5), 4400); // vuela hacia la barra
    later(() => {
      setEnding(6); // entra en su hueco
      sfx("esmeralda");
    }, 5400);
    later(() => onFinish(true), 6600);
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

      {/* el jefe final se deshace y la pantalla se llena de luz */}
      {area.boss && ending >= 3 && (
        <span className="final-flash pointer-events-none absolute inset-0 z-40 bg-white" aria-hidden="true" />
      )}

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

      {/* barra de esmeraldas y la nueva esmeralda volando a su hueco */}
      {ending >= 4 && gemIndex >= 0 && (
        <>
          <GemBar zonesDone={zonesDone} filling={ending >= 6 ? area.id : null} />
          {ending < 6 && (
            <div
              className="pointer-events-none absolute z-40"
              style={{
                left:
                  ending >= 5
                    ? `calc(50% + ${(gemIndex - (GEM_ZONES.length - 1) / 2) * GEM_GAP}px)`
                    : "50%",
                top: ending >= 5 ? "18px" : "42%",
                transform:
                  ending >= 5 ? "translate(-50%, 0) scale(0.85)" : "translate(-50%, -50%) scale(2)",
                transition:
                  "left 0.95s cubic-bezier(0.5,-0.1,0.4,1.25), top 0.95s cubic-bezier(0.5,-0.1,0.4,1.25), transform 0.95s ease",
                filter: `drop-shadow(0 0 22px ${area.gem})`,
              }}
              aria-hidden="true"
            >
              {ending >= 5 && (
                <span
                  className="gem-trail absolute left-1/2 top-1/2 h-28 w-2 -translate-x-1/2 origin-top rounded-full blur-[3px]"
                  style={{ background: `linear-gradient(to bottom, ${area.gem}, transparent)` }}
                />
              )}
              <span className={ending === 4 ? "gem-reveal block" : "block"}>
                <Gema color={area.gem} cut={area.gemCut} size={44} spin />
              </span>
            </div>
          )}
        </>
      )}

      <div className="relative flex h-full flex-col px-3 pb-10 pt-2">

        {/* SUPERIOR — mismo lenguaje visual que el mapa */}
        <div className="relative flex items-start">
          <button
            onClick={() => {
              sfx("cerrar");
              onBack();
            }}
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
              <Gema color={area.gem} cut={area.gemCut} size={22} />
            </span>
            <Hearts n={guardHp} />
          </div>
        </div>

        {/* ZONA DE COMBATE: los dos muy cerca, protagonistas */}
        <div className="flex flex-1 flex-col items-center justify-center gap-0">
          {/* GUARDIÁN */}
          <div className="relative flex justify-center">
            {area.boss && (
              <span
                className="boss-aura pointer-events-none absolute -inset-10 rounded-full blur-2xl"
                style={{
                  background:
                    "radial-gradient(circle, rgba(122,47,242,0.8), rgba(30,8,55,0.5) 55%, transparent 75%)",
                }}
                aria-hidden="true"
              />
            )}
            <span
              className={`pointer-events-none absolute -bottom-1 left-1/2 h-4 -translate-x-1/2 rounded-[50%] blur-[4px] ${
                area.boss ? "w-40" : "w-32"
              }`}
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
                className={`${area.boss ? "w-64" : "w-52"} drop-shadow-[0_10px_10px_rgba(0,0,0,0.45)] transition-all duration-500 ${
                  ending >= 2 ? "friend-glow" : ""
                } ${ending === 1 ? "surprise-jump" : ""} ${ending >= 3 ? "guard-dissolve" : ""}`}
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
              {ending === 2 && <span className="absolute -right-2 top-2 text-5xl pop-in">😊</span>}
              {ending === 1 && <span className="absolute -right-2 top-0 text-5xl pop-in">😲</span>}
            </div>

            {/* partículas de luz (o humo oscuro para el jefe) al desaparecer */}
            {ending >= 3 && ending < 5 && (
              <span className="pointer-events-none absolute inset-0" aria-hidden="true">
                {Array.from({ length: area.boss ? 20 : 14 }).map((_, i) => (
                  <span
                    key={i}
                    className={`${area.boss && i % 2 === 0 ? "smoke-out" : "sparkle-up"} absolute text-2xl`}
                    style={{
                      left: `${8 + ((i * 29) % 84)}%`,
                      top: `${20 + ((i * 17) % 60)}%`,
                      animationDelay: `${i * 0.08}s`,
                      filter: `drop-shadow(0 0 8px ${area.gem})`,
                    }}
                  >
                    {area.boss ? (i % 2 === 0 ? "💨" : "✨") : "✨"}
                  </span>
                ))}
              </span>
            )}
          </div>


          {/* CRIATURA DEL JUGADOR */}
          <div className="relative -mt-6 flex flex-col items-center gap-1">
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
                className="w-40 drop-shadow-[0_10px_10px_rgba(0,0,0,0.45)]"
              />
              {hitMe && <span className="pop-in absolute -right-2 top-2 text-4xl">😖</span>}
            </div>
            <Hearts n={myHp} big />
          </div>
        </div>


        {/* BOTONES */}
        <div className="relative mt-2 flex items-center justify-center gap-7">
          {flyHeart && (
            <span
              className="heal-to-bar pointer-events-none absolute left-1/2 top-0 z-20 text-5xl drop-shadow-[0_0_14px_rgba(120,255,160,0.9)]"
              aria-hidden="true"
            >
              💚
            </span>
          )}
          <RoundButton
            label="Atacar"
            color="var(--arcade-orange)"
            onClick={normalAttack}
            disabled={busy || ending > 0}
          >
            {attackIcon(companion, area)}
          </RoundButton>

          <RoundButton
            label="Curar"
            color={healColor}
            onClick={heal}
            disabled={busy || ending > 0 || heals === 0}
          >
            <span className="relative inline-grid h-12 w-12 place-items-center">
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
            charge={chargePct / 100}
            ready={chargeReady}
          >
            <span className={chargeReady ? "star-ready" : "opacity-90"}>⭐</span>
          </RoundButton>

        </div>
      </div>
    </div>
  );
}

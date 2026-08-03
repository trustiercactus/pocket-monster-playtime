import { useEffect, useMemo, useRef, useState } from "react";
import { AREAS, GEM_ZONES, TERRAIN, type Area } from "@/lib/areas";
import { getCreature } from "@/lib/creatures";
import mapaFondo from "@/assets/mapa-vertical.jpg";
import legendariaImg from "@/assets/legendaria.png";


const OPTS_KEY = "criaturitas-opciones";

function soundOn() {
  try {
    const raw = window.localStorage.getItem(OPTS_KEY);
    return raw ? (JSON.parse(raw).sonidos ?? true) : true;
  } catch {
    return true;
  }
}

function say(text: string) {
  try {
    if (!soundOn()) return;
    const s = window.speechSynthesis;
    if (!s) return;
    s.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "es-ES";
    u.rate = 0.85;
    u.pitch = 1.3;
    s.speak(u);
  } catch {
    /* sin voz */
  }
}

/** Hueco de corona: cavidad blanca 3D que espera su esmeralda */
function GemSocket({ color, on }: { color: string; on: boolean }) {
  return (
    <span className="relative grid h-9 w-8 place-items-center">
      <svg width="30" height="34" viewBox="0 0 24 28" aria-hidden="true">
        <path
          d="M7 2h10l5 6v12l-5 6H7l-5-6V8z"
          fill="url(#socket)"
          stroke="#ffffff"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <defs>
          <linearGradient id="socket" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="60%" stopColor="#f4f8ff" />
            <stop offset="100%" stopColor="#dbe6f7" />
          </linearGradient>
        </defs>
      </svg>
      {!on && (
        <>
          <span className="socket-shine pointer-events-none absolute inset-[6px] rounded-full bg-white blur-[2px]" />
          <span
            className="twinkle pointer-events-none absolute -inset-[2px] rounded-full"
            style={{ boxShadow: "0 0 12px 3px rgba(255,255,255,0.85)" }}
          />
        </>
      )}
      {on && (
        <span className="gem-drop absolute inset-0 grid place-items-center">
          <svg width="26" height="30" viewBox="0 0 24 28" aria-hidden="true">
            <path
              d="M7 2h10l5 6v12l-5 6H7l-5-6V8z"
              fill={color}
              stroke="rgba(255,255,255,0.9)"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path d="M7 2l5 12L7 26z" fill="rgba(255,255,255,0.45)" />
            <path d="M17 2l-5 12 5 12z" fill="rgba(0,0,0,0.15)" />
          </svg>
          <span
            className="twinkle pointer-events-none absolute -inset-1 rounded-full"
            style={{ boxShadow: `0 0 14px 4px ${color}` }}
          />
        </span>
      )}
    </span>
  );
}

function RoundButton({
  onClick,
  label,
  icon,
  color,
}: {
  onClick: () => void;
  label: string;
  icon: string;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{ backgroundColor: color }}
      className="btn-bounce btn-3d grid h-11 w-11 place-items-center rounded-full border-[3px] border-white text-xl text-white shadow-[0_5px_0_rgba(0,0,0,0.35)]"
    >
      <span className="drop-shadow-[0_2px_0_rgba(0,0,0,0.35)]">{icon}</span>
    </button>
  );
}

/** piedras pequeñas del sendero, con el terreno propio de la zona */
function PathStones({ a, b, lit }: { a: Area; b: Area; lit: boolean }) {
  const stones = 7;
  const t = TERRAIN[a.terrain];
  return (
    <>
      {Array.from({ length: stones }).map((_, i) => {
        const k = (i + 1) / (stones + 1);
        const x = a.x + (b.x - a.x) * k;
        const y = a.y + (b.y - a.y) * k;
        const size = 8 + Math.sin(k * Math.PI) * 3;
        return (
          <span
            key={i}
            className={`absolute -translate-x-1/2 -translate-y-1/2 border ${lit ? "stone-pulse" : ""}`}
            style={{
              left: `${x}%`,
              top: `${y}%`,
              width: size,
              height: size * 0.78,
              borderRadius: t.round,
              animationDelay: `${i * 0.14}s`,
              background: t.fill,
              borderColor: t.border,
              opacity: lit ? 1 : 0.78,
              boxShadow: lit
                ? "0 2px 0 rgba(0,0,0,0.25), inset 0 1px 1px rgba(255,255,255,0.7), 0 0 8px rgba(255,236,160,0.85)"
                : "0 2px 0 rgba(0,0,0,0.22), inset 0 1px 1px rgba(255,255,255,0.6)",
            }}
            aria-hidden="true"
          />
        );
      })}
    </>
  );
}

/** ambiente vivo del bioma alrededor de la zona */
function Ambiente({ area }: { area: Area }) {
  return (
    <span className="pointer-events-none absolute -inset-8 overflow-visible" aria-hidden="true">
      {area.ambient.map((p, i) => (
        <span
          key={i}
          className={`absolute text-sm ${
            p.kind === "fall" ? "amb-fall" : p.kind === "rise" ? "amb-rise" : "amb-drift"
          }`}
          style={{
            left: `${18 + i * 46}%`,
            top: `${i % 2 === 0 ? 8 : 46}%`,
            animationDelay: `${i * 1.6}s`,
            opacity: 0.85,
          }}
        >
          {p.emoji}
        </span>
      ))}
    </span>
  );
}


export function MapaMundo({
  name,
  zonesDone,
  legendary,
  onArea,
  onCollection,
  onSettings,
  onLegendary,
}: {
  name: string;
  zonesDone: string[];
  legendary: boolean;
  onArea: (a: Area) => void;
  onCollection: () => void;
  onHome?: () => void;
  onSettings: () => void;
  onLegendary: () => void;
  hasEggs?: boolean;
}) {
  const [cine, setCine] = useState(false);
  const [sound, setSound] = useState(true);
  const [flying, setFlying] = useState<{ color: string; phase: 0 | 1 } | null>(null);
  const prevDone = useRef<string[]>(zonesDone);
  const scroller = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const added = zonesDone.find((id) => !prevDone.current.includes(id));
    prevDone.current = zonesDone;
    if (!added) return;
    const zone = GEM_ZONES.find((z) => z.id === added);
    if (!zone) return;
    setFlying({ color: zone.gem, phase: 0 });
    const t1 = setTimeout(() => setFlying((f) => (f ? { ...f, phase: 1 } : f)), 80);
    const t2 = setTimeout(() => setFlying(null), 1500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [zonesDone]);


  const allGems = GEM_ZONES.every((z) => zonesDone.includes(z.id));

  const isOpen = (a: Area, i: number) =>
    a.boss ? allGems : i === 0 || zonesDone.includes(AREAS[i - 1]!.id) || zonesDone.includes(a.id);

  const nextZone = useMemo(() => {
    for (const a of AREAS) {
      if (a.boss) return allGems ? a : undefined;
      if (!zonesDone.includes(a.id)) return a;
    }
    return undefined;
  }, [zonesDone, allGems]);

  useEffect(() => {
    setSound(soundOn());
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      nextRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 350);
    return () => clearTimeout(t);
  }, [zonesDone.length]);

  useEffect(() => {
    if (allGems && !legendary) setCine(true);
  }, [allGems, legendary]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (nextZone) say(`¡Vamos ${name}! Toca ${nextZone.name}.`);
    }, 1100);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextZone?.id]);

  const toggleSound = () => {
    const next = !sound;
    setSound(next);
    try {
      const raw = window.localStorage.getItem(OPTS_KEY);
      const prev = raw ? JSON.parse(raw) : {};
      window.localStorage.setItem(OPTS_KEY, JSON.stringify({ ...prev, sonidos: next }));
    } catch {
      /* sin guardado */
    }
    if (next && nextZone) say(`Toca ${nextZone.name}.`);
    else window.speechSynthesis?.cancel();
  };

  return (
    <div className="fixed inset-0 z-0 bg-[#8fd8ff]">
      <div ref={scroller} className="h-full w-full overflow-y-auto overflow-x-hidden">
        <div className="relative h-[240vh] min-h-[1400px] w-full">
          <img
            src={mapaFondo}
            alt=""
            width={768}
            height={1920}
            className="absolute inset-0 h-full w-full object-cover"
          />

          {/* sendero de piedras */}
          {AREAS.slice(0, -1).map((a, i) => (
            <PathStones key={a.id} a={a} b={AREAS[i + 1]!} lit={zonesDone.includes(a.id)} />
          ))}

          {/* zonas */}
          {AREAS.map((a, i) => {
            const done = zonesDone.includes(a.id);
            const open = isOpen(a, i);
            const isNext = nextZone?.id === a.id;
            const guardian = getCreature(a.guardian);
            return (
              <div
                key={a.id}
                ref={isNext ? nextRef : undefined}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${a.x}%`, top: `${a.y}%` }}
              >
                {done && (
                  <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                    {a.particles.map((p, k) => (
                      <span
                        key={k}
                        className="sparkle-up absolute text-2xl"
                        style={{ left: `${k * 34}%`, animationDelay: `${k * 0.7}s` }}
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => open && onArea(a)}
                  aria-label={open ? a.name : `${a.name} bloqueada`}
                  disabled={!open}
                  className={`relative flex flex-col items-center ${open ? "btn-bounce" : ""} ${
                    isNext ? "node-bob" : ""
                  }`}
                >
                  {/* niebla mágica del hechizo (suave, sin oscurecer) */}
                  {!done && (
                    <span
                      className="fog-drift pointer-events-none absolute -inset-4 rounded-full blur-md"
                      style={{
                        background:
                          "radial-gradient(circle, rgba(235,240,255,0.55), rgba(180,190,255,0.18) 60%, transparent 75%)",
                      }}
                      aria-hidden="true"
                    />
                  )}
                  {!done && (
                    <span
                      className="dark-aura pointer-events-none absolute left-1/2 top-2 h-20 w-20 -translate-x-1/2 rounded-full blur-sm"
                      style={{
                        background:
                          "radial-gradient(circle, rgba(140,110,220,0.3), transparent 70%)",
                      }}
                      aria-hidden="true"
                    />
                  )}


                  {/* guardián */}
                  <span className="relative -mb-3">
                    <img
                      src={guardian.image}
                      alt=""
                      loading="lazy"
                      className="h-20 w-20 object-contain drop-shadow-[0_5px_5px_rgba(0,0,0,0.45)]"
                      style={{
                        filter: done
                          ? "saturate(1.15) brightness(1.05)"
                          : "saturate(0.88) brightness(0.98)",
                        transition: "filter 0.6s ease",
                      }}
                    />
                    {!done && (
                      <>
                        <span className="absolute left-[34%] top-[42%] h-[6px] w-[6px] rounded-full bg-[#ff3b3b] shadow-[0_0_8px_#ff2b2b]" />
                        <span className="absolute left-[56%] top-[42%] h-[6px] w-[6px] rounded-full bg-[#ff3b3b] shadow-[0_0_8px_#ff2b2b]" />
                      </>
                    )}
                    {done && (
                      <span className="absolute -right-1 -top-1 text-xl drop-shadow">😊</span>
                    )}
                  </span>

                  {/* medallón */}
                  <span
                    className="grid h-11 w-24 place-items-center rounded-[50%] border-4 shadow-[0_7px_0_rgba(0,0,0,0.4)]"
                    style={{
                      background: `radial-gradient(circle at 50% 28%, ${a.gem}, rgba(0,0,0,0.28))`,
                      borderColor: "#ffffffee",
                      filter: open ? "none" : "saturate(0.6) brightness(0.85)",
                    }}
                  >
                    <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-white/90 bg-ink/70 text-lg font-black text-white">
                      {open ? i + 1 : "🔒"}
                    </span>
                  </span>

                  <span
                    className="-mt-1 rounded-lg border-2 border-white/80 px-2 py-[2px] text-[0.7rem] font-black uppercase tracking-wider text-white shadow-[0_3px_0_rgba(0,0,0,0.35)]"
                    style={{ backgroundColor: "rgba(28,36,52,0.92)" }}
                  >
                    {a.name}
                  </span>

                  {isNext && (
                    <span className="arrow-point absolute -top-11 left-1/2 -translate-x-1/2 text-4xl drop-shadow-[0_3px_2px_rgba(0,0,0,0.4)]">
                      👇
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* corona de esmeraldas */}
      <div className="pointer-events-none absolute left-1/2 top-2 z-20 flex -translate-x-1/2 items-center gap-[2px] rounded-full border-4 border-white/90 bg-ink/85 px-3 py-1 shadow-[0_6px_0_rgba(0,0,0,0.4)]">
        {GEM_ZONES.map((z) => (
          <GemSocket key={z.id} color={z.gem} on={zonesDone.includes(z.id)} />
        ))}
      </div>

      {/* esmeralda que vuela hasta la corona */}
      {flying && (
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 z-30"
          style={{
            transform:
              flying.phase === 0
                ? "translate(-50%, -50%) scale(1.8)"
                : "translate(-50%, calc(-50vh + 22px)) scale(0.9)",
            opacity: flying.phase === 0 ? 1 : 0.95,
            transition: "transform 1s cubic-bezier(0.5, -0.2, 0.4, 1.3), opacity 1s ease",
          }}
          aria-hidden="true"
        >
          <GemSocket color={flying.color} on />
        </div>
      )}

      {/* botones permanentes */}
      <div className="absolute left-3 top-16 z-20 flex flex-row items-center gap-3">
        <RoundButton onClick={onSettings} label="Opciones" icon="⚙️" color="var(--arcade-blue)" />
        <RoundButton
          onClick={toggleSound}
          label={sound ? "Silenciar" : "Activar sonido"}
          icon={sound ? "🔊" : "🔇"}
          color="var(--arcade-green)"
        />
        <RoundButton
          onClick={onCollection}
          label="Colección"
          icon="🎒"
          color="var(--arcade-yellow)"
        />
      </div>


      {cine && (
        <Cinematica
          onDone={() => {
            setCine(false);
            onLegendary();
          }}
        />
      )}
    </div>
  );
}

function Cinematica({ onDone }: { onDone: () => void }) {
  const [fase, setFase] = useState<0 | 1 | 2>(0);
  useEffect(() => {
    const t1 = setTimeout(() => setFase(1), 1900);
    const t2 = setTimeout(() => setFase(2), 3200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);
  return (
    <div className="absolute inset-0 z-30 grid place-items-center bg-ink/80">
      <div className="relative grid place-items-center">
        {fase === 0 &&
          GEM_ZONES.map((z, i) => {
            const ang = (i / GEM_ZONES.length) * Math.PI * 2;
            return (
              <span
                key={z.id}
                className="gem-fly absolute"
                style={
                  {
                    "--gx": `${Math.cos(ang) * 120}px`,
                    "--gy": `${Math.sin(ang) * 120}px`,
                  } as React.CSSProperties
                }
              >
                <GemSocket color={z.gem} on />
              </span>
            );
          })}
        {fase === 1 && (
          <div className="big-gem-in text-9xl drop-shadow-[0_0_40px_rgba(120,255,200,0.9)]">💎</div>
        )}
        {fase === 2 && (
          <div className="flex flex-col items-center gap-5">
            <img
              src={legendariaImg}
              alt="Criaturita legendaria"
              width={768}
              height={768}
              className="pop-in hop w-52 drop-shadow-2xl"
            />
            <button
              onClick={onDone}
              aria-label="Continuar"
              className="btn-bounce rounded-[2rem] border-4 border-white bg-orange px-10 py-6 text-4xl font-black text-white shadow-[0_10px_0_rgba(0,0,0,0.25)]"
            >
              ✅
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { AREAS, GEM_ZONES, TERRAIN, type Area } from "@/lib/areas";
import { getCreature } from "@/lib/creatures";
import mapaFondo from "@/assets/mapa-vertical.jpg";
import legendariaImg from "@/assets/legendaria.png";
import { Gema, type GemCut } from "@/components/Gema";
import {
  narrar,
  playMusic,
  musicPause,
  sfx,
  getOpciones,
  setOpcion,
  loadOpciones,
} from "@/lib/audio";


function say(text: string, once?: string) {
  void narrar(text, once ? { once, delay: 400 } : { delay: 400 });
}

/** Hueco de corona: cavidad blanca 3D que espera SU esmeralda */
function GemSocket({
  color,
  cut,
  on,
  justFilled,
}: {
  color: string;
  cut: GemCut;
  on: boolean;
  justFilled?: boolean;
}) {
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
        <span
          className={`${justFilled ? "socket-fill" : "gem-drop"} absolute inset-0 grid place-items-center`}
        >
          <Gema color={color} cut={cut} size={26} />
          <span
            className="twinkle pointer-events-none absolute -inset-1 rounded-full"
            style={{ boxShadow: `0 0 14px 4px ${color}` }}
          />
          {justFilled && (
            <span
              className="socket-flash pointer-events-none absolute -inset-2 rounded-full bg-white"
              aria-hidden="true"
            />
          )}
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
  const [justFilled, setJustFilled] = useState<string | null>(null);
  /** vista: "mapa" = todo el reino, "mundo" = escenario propio de la zona */
  const [vista, setVista] = useState<"mapa" | "mundo">("mapa");
  const [sweep, setSweep] = useState(false);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<string | null>(null);
  const prevDone = useRef<string[]>(zonesDone);
  const scroller = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);


  useEffect(() => {
    const added = zonesDone.find((id) => !prevDone.current.includes(id));
    prevDone.current = zonesDone;
    if (!added) return;
    setJustFilled(added);
    sfx("esmeralda");
    void narrar("¡Has conseguido una nueva esmeralda!", { delay: 450 });
    const t = setTimeout(() => setJustFilled(null), 1200);
    return () => clearTimeout(t);
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
    const o = loadOpciones();
    setSound(o.musica || o.efectos || o.narrador);
    playMusic("mapa");
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      /* el mapa completo cabe en pantalla: no hace falta desplazar */
    }, 350);
    return () => clearTimeout(t);
  }, [zonesDone.length]);

  useEffect(() => {
    if (allGems && !legendary) setCine(true);
  }, [allGems, legendary]);

  /** transición cinematográfica mapa general → escenario del mundo */
  const irAlMundo = (id: string) => {
    setFocusId(id);
    setSweep(true);
    sfx("abrir");
    try {
      navigator.vibrate?.(30);
    } catch {
      /* sin vibración */
    }
    timers.current.push(setTimeout(() => setVista("mundo"), 470));
    timers.current.push(setTimeout(() => setSweep(false), 980));
  };

  const volverAlMapa = () => {
    setSweep(true);
    timers.current.push(setTimeout(() => setVista("mapa"), 470));
    timers.current.push(setTimeout(() => setSweep(false), 980));
  };

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
    },
    [],
  );

  /** intro: se ve todo el reino unos segundos y luego entramos en la zona actual */
  const introRef = useRef(false);
  useEffect(() => {
    if (introRef.current) return;
    introRef.current = true;
    const t = setTimeout(() => {
      const target = nextZone ?? AREAS[0]!;
      irAlMundo(target.id);
    }, 2600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** al conseguir una esmeralda: mapa general, revelar la siguiente zona y entrar en ella */
  const doneCount = zonesDone.length;
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    setVista("mapa");
    try {
      navigator.vibrate?.(40);
    } catch {
      /* sin vibración */
    }
    const t1 = setTimeout(() => setRevealed(nextZone?.id ?? null), 1800);
    const t2 = setTimeout(() => {
      if (nextZone) irAlMundo(nextZone.id);
    }, 3200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doneCount]);

  const mundoArea = AREAS.find((a) => a.id === focusId) ?? nextZone ?? AREAS[0]!;


  useEffect(() => {
    const t = setTimeout(() => {
      if (nextZone) say(`¡Vamos ${name}! Toca ${nextZone.name}.`, `zona-${nextZone.id}`);
    }, 3400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextZone?.id]);


  const toggleSound = () => {
    const next = !sound;
    setSound(next);
    (["musica", "efectos", "narrador"] as const).forEach((k) => setOpcion(k, next));
    if (next) {
      playMusic("mapa");
      if (nextZone) say(`Toca ${nextZone.name}.`);
    }
  };

  return (
    <div className="fixed inset-0 z-0 bg-[#8fd8ff]">
      <div ref={scroller} className="h-full w-full overflow-hidden">
        <div className="map-in relative h-full w-full">
          <img
            src={mapaFondo}
            alt=""
            width={768}
            height={1920}
            className="absolute inset-0 h-full w-full object-cover"
          />
        <div className="absolute inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+2.6rem)] top-[calc(env(safe-area-inset-top)+6rem)]">


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
                className="absolute -translate-x-1/2 -translate-y-1/2 scale-[0.62] sm:scale-75"
                style={{ left: `${a.x}%`, top: `${a.y}%` }}
              >
                <Ambiente area={a} />

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
                  onClick={() => {
                    if (!open) return;
                    sfx("tap");
                    if (a.boss) void narrar("¡Ha llegado el momento de salvar el Reino!", { delay: 400 });
                    onArea(a);
                  }}
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
                          "radial-gradient(circle, rgba(235,240,255,0.45), rgba(180,190,255,0.14) 60%, transparent 75%)",
                      }}
                      aria-hidden="true"
                    />
                  )}

                  {/* velo de nubes de las zonas aún bloqueadas: se disipa con magia al desbloquearse */}
                  {(!open || revealed === a.id) && (
                    <span
                      className={`pointer-events-none absolute -inset-6 grid place-items-center ${
                        revealed === a.id ? "cloud-veil-out" : "cloud-veil-idle"
                      }`}
                      aria-hidden="true"
                    >
                      <span className="absolute inset-0 rounded-[50%] bg-white/70 blur-md" />
                      <span className="absolute -left-2 top-1 text-2xl opacity-90">☁️</span>
                      <span className="absolute -right-2 bottom-2 text-2xl opacity-90">☁️</span>
                    </span>
                  )}

                  {/* la zona recién revelada brilla un instante */}
                  {revealed === a.id && (
                    <span className="zone-reveal pointer-events-none absolute inset-0" aria-hidden="true" />
                  )}


                  {/* guardián integrado en su terreno */}
                  <span className="relative grid place-items-center">
                    {a.boss && (
                      <span
                        className="boss-aura pointer-events-none absolute -inset-8 rounded-full blur-xl"
                        style={{
                          background:
                            "radial-gradient(circle, rgba(122,47,242,0.85), rgba(40,10,70,0.55) 55%, transparent 75%)",
                        }}
                        aria-hidden="true"
                      />
                    )}
                    {a.boss && (
                      <span
                        className="goal-beacon pointer-events-none absolute left-1/2 top-1/2 h-40 w-40 rounded-full blur-2xl"
                        style={{
                          background:
                            "radial-gradient(circle, rgba(255,79,216,0.55), rgba(122,47,242,0.35) 55%, transparent 75%)",
                        }}
                        aria-hidden="true"
                      />
                    )}

                    <span
                      className={`pointer-events-none absolute bottom-1 left-1/2 h-3 -translate-x-1/2 rounded-[50%] blur-[3px] ${
                        a.boss ? "w-28" : "w-16"
                      }`}
                      style={{ background: "rgba(0,0,0,0.28)" }}
                      aria-hidden="true"
                    />
                    <img
                      src={guardian.image}
                      alt=""
                      loading="lazy"
                      className={`relative object-contain drop-shadow-[0_5px_5px_rgba(0,0,0,0.4)] ${
                        a.boss ? "h-36 w-36" : "h-20 w-20"
                      }`}
                      style={{
                        filter: done
                          ? "saturate(1.2) brightness(1.06)"
                          : a.boss
                            ? "saturate(1.1) brightness(0.8) contrast(1.1)"
                            : "saturate(0.82) brightness(0.96)",
                        transition: "filter 0.6s ease",
                      }}
                    />
                    {!done && (
                      <>
                        <span className="absolute left-[34%] top-[42%] h-[5px] w-[7px] rounded-[50%] bg-[#ff5c5c] shadow-[0_0_7px_#ff2b2b]" />
                        <span className="absolute left-[57%] top-[42%] h-[5px] w-[7px] rounded-[50%] bg-[#ff5c5c] shadow-[0_0_7px_#ff2b2b]" />
                      </>
                    )}

                    {done && (
                      <span className="pop-in absolute -right-1 -top-1 text-xl drop-shadow">😊</span>
                    )}
                  </span>




                  {/* medallón */}
                  <span
                    className={`-mt-2 grid place-items-center rounded-[50%] border-4 shadow-[0_6px_0_rgba(0,0,0,0.38)] ${
                      a.boss ? "h-12 w-[108px]" : "h-10 w-[84px]"
                    }`}
                    style={{
                      background: a.boss
                        ? "radial-gradient(circle at 50% 28%, #a24bff, #2a1046)"
                        : `radial-gradient(circle at 50% 28%, ${a.gem}, rgba(0,0,0,0.28))`,
                      borderColor: "#ffffffee",
                      filter: open ? "none" : "saturate(0.75) brightness(0.9)",
                    }}
                  >
                    <span
                      className={`grid place-items-center rounded-full border-2 border-white/90 bg-ink/70 font-black text-white ${
                        a.boss ? "h-9 w-9 text-xl" : "h-7 w-7 text-base"
                      }`}
                    >
                      {a.boss ? "👑" : open ? i + 1 : "🔒"}
                    </span>
                  </span>

                  <span
                    className={`-mt-1 rounded-full border-2 border-white/90 font-black tracking-wide text-white shadow-[0_3px_0_rgba(0,0,0,0.3)] ${
                      a.boss ? "px-4 py-1 text-[0.9rem]" : "px-3 py-[3px] text-[0.68rem]"
                    }`}
                    style={{
                      backgroundColor: a.boss ? "rgba(24,10,40,0.92)" : "rgba(24,32,48,0.78)",
                      backdropFilter: "blur(2px)",
                    }}
                  >
                    {a.emoji} {a.name}
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

      </div>

      {/* corona de esmeraldas */}
      <div className="pointer-events-none absolute left-1/2 top-[calc(env(safe-area-inset-top)+0.4rem)] z-20 flex -translate-x-1/2 items-center gap-[2px] rounded-full border-4 border-white/90 bg-ink/85 px-3 py-1 shadow-[0_6px_0_rgba(0,0,0,0.4)]">
        {GEM_ZONES.map((z) => (
          <GemSocket
            key={z.id}
            color={z.gem}
            cut={z.gemCut}
            on={zonesDone.includes(z.id)}
            justFilled={justFilled === z.id}
          />
        ))}
      </div>


      {/* botones permanentes */}
      <div className="absolute left-3 top-[calc(env(safe-area-inset-top)+3.2rem)] z-20 flex flex-row items-center gap-2">

        <RoundButton
          onClick={() => {
            sfx("abrir");
            onSettings();
          }}
          label="Opciones" icon="⚙️" color="var(--arcade-blue)" />
        <RoundButton
          onClick={toggleSound}
          label={sound ? "Silenciar" : "Activar sonido"}
          icon={sound ? "🔊" : "🔇"}
          color="var(--arcade-green)"
        />
        <RoundButton
          onClick={() => {
            sfx("abrir");
            onCollection();
          }}
          label="Colección"
          icon="🎒"
          color="var(--arcade-yellow)"
        />
        <RoundButton
          onClick={() => {
            sfx("tap");
            setCam((c) => (c === "zoom" ? "wide" : "zoom"));
          }}
          label={cam === "zoom" ? "Ver todo el mapa" : "Ir a mi zona"}
          icon={cam === "zoom" ? "🗺️" : "🔍"}
          color="var(--arcade-orange)"
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

function fanfare() {
  try {
    if (!getOpciones().efectos) return;
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "triangle";
      o.frequency.setValueAtTime(f, ctx.currentTime + i * 0.16);
      g.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.16);
      g.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + i * 0.16 + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.16 + 0.5);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + i * 0.16);
      o.stop(ctx.currentTime + i * 0.16 + 0.55);
    });
  } catch {
    /* sin sonido */
  }
}

/** Cinemática: las 8 esmeraldas despiertan a la criatura legendaria */
function Cinematica({ onDone }: { onDone: () => void }) {
  const [fase, setFase] = useState<0 | 1 | 2 | 3 | 4>(0);

  useEffect(() => {
    const ts = [
      setTimeout(() => setFase(1), 1200),
      setTimeout(() => setFase(2), 3000),
      setTimeout(() => {
        musicPause(500);
        setFase(3);
        sfx("aurora");
        fanfare();
      }, 4600),
      setTimeout(() => {
        setFase(4);
        say("¡Increíble! ¡Has despertado a Aurora!");
      }, 5900),
    ];
    return () => ts.forEach(clearTimeout);
  }, []);

  const n = GEM_ZONES.length;

  return (
    <div className="absolute inset-0 z-40 overflow-hidden bg-ink/95 backdrop-blur-sm">
      {/* esmeraldas: de la barra superior al círculo mágico */}
      {fase < 3 &&
        GEM_ZONES.map((z, i) => {
          const ang = (i / n) * 360;
          const topStyle: React.CSSProperties = {
            left: `calc(50% + ${(i - (n - 1) / 2) * 34}px)`,
            top: "18px",
            transform: "translate(-50%, 0) scale(1)",
            filter: `drop-shadow(0 0 10px ${z.gem})`,
            transition: "left 0.9s ease, top 0.9s ease, transform 0.9s ease",
          };
          const centerStyle: React.CSSProperties = {
            left: "50%",
            top: "42%",
            transform: "translate(-50%, -50%)",
            filter: `drop-shadow(0 0 16px ${z.gem})`,
            transition: "left 0.9s ease, top 0.9s ease",
          };
          return (
            <span key={z.id} className="absolute" style={fase === 0 ? topStyle : centerStyle}>
              <span
                className={fase === 0 ? "" : "gem-orbit block"}
                style={
                  {
                    "--a": `${ang}deg`,
                    "--r": fase === 2 ? "70px" : "110px",
                    "--spd": fase === 2 ? "0.6s" : "2.6s",
                    transition: "all 0.6s ease",
                  } as React.CSSProperties
                }
              >
                <Gema color={z.gem} cut={z.gemCut} size={fase === 0 ? 26 : 34} spin />
              </span>
            </span>
          );
        })}

      {/* fusión: gran esmeralda + destello */}
      {fase === 3 && (
        <>
          <div className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2">
            <span className="big-gem-in block">
              <Gema color="#8affe0" cut="esmeralda" size={150} spin />
            </span>
          </div>
          <span className="white-flash pointer-events-none absolute inset-0 bg-white" />
        </>
      )}

      {/* criatura legendaria */}
      {fase === 4 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-6">
          <div className="relative">
            <span
              className="pointer-events-none absolute -inset-10 rounded-full blur-2xl"
              style={{
                background:
                  "radial-gradient(circle, rgba(255,255,255,0.85), rgba(160,220,255,0.35) 55%, transparent 75%)",
              }}
              aria-hidden="true"
            />
            <img
              src={legendariaImg}
              alt="Aurora, la criatura legendaria"
              width={768}
              height={768}
              className="legend-rise relative w-64 drop-shadow-[0_0_40px_rgba(180,240,255,0.9)]"
            />
            {/* las ocho esmeraldas se incrustan en su pecho y alas */}
            {GEM_ZONES.map((z, i) => {
              const ang = (i / n) * Math.PI * 2;
              const x = Math.cos(ang) * 46;
              const y = Math.sin(ang) * 30;
              return (
                <span
                  key={z.id}
                  className="gem-embed absolute left-1/2 top-1/2"
                  style={
                    {
                      "--ex": `${Math.cos(ang) * 200}px`,
                      "--ey": `${Math.sin(ang) * 200}px`,
                      marginLeft: x,
                      marginTop: y,
                      animationDelay: `${0.9 + i * 0.12}s`,
                      filter: `drop-shadow(0 0 8px ${z.gem})`,
                    } as React.CSSProperties
                  }
                >
                  <Gema color={z.gem} cut={z.gemCut} size={22} />
                </span>
              );
            })}
          </div>
          <p className="rainbow-frame rounded-full border-4 bg-ink/80 px-6 py-2 text-3xl font-black text-white">
            ✨ Aurora ✨
          </p>
          <button
            onClick={() => {
              sfx("tap");
              onDone();
            }}
            aria-label="Continuar"
            className="btn-bounce btn-pulse rounded-[2rem] border-4 border-white bg-orange px-10 py-6 text-4xl font-black text-white shadow-[0_10px_0_rgba(0,0,0,0.25)]"
          >
            ✅
          </button>
        </div>
      )}
    </div>
  );
}


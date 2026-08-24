import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AREAS, GEM_ZONES, type Area } from "@/lib/areas";
import { getCreature } from "@/lib/creatures";
import mapaFondo from "@/assets/mapa-vertical.jpg";
import legendariaImg from "@/assets/legendaria.png";
import { Gema, type GemCut } from "@/components/Gema";
import { Mundo } from "@/components/Mundo";
import {
  playMusic,
  musicPause,
  sfx,
  getOpciones,
  setOpcion,
  loadOpciones,
} from "@/lib/audio";

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

/** ruta curva y continua que une todas las zonas en orden 1 → 9 */
/** curvatura variable por tramo: evita que la ruta parezca un esquema regular */
const CURVA = [0.34, 0.5, 0.28, 0.46, 0.36, 0.52, 0.3, 0.42];

function segmentoCurvo(i: number) {
  const p0 = AREAS[Math.max(0, i - 1)]!;
  const p1 = AREAS[i]!;
  const p2 = AREAS[i + 1]!;
  const p3 = AREAS[Math.min(AREAS.length - 1, i + 2)]!;
  const k = CURVA[i] ?? 0.36;
  const c1x = p1.x + (p2.x - p0.x) * k;
  const c1y = p1.y + (p2.y - p0.y) * k;
  const c2x = p2.x - (p3.x - p1.x) * k;
  const c2y = p2.y - (p3.y - p1.y) * k;
  return `M ${p1.x} ${p1.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
}

/** ruta completa 1 → 9 como un único trazo continuo */
const RUTA_COMPLETA = AREAS.slice(0, -1)
  .map((_, i) => (i === 0 ? segmentoCurvo(i) : segmentoCurvo(i).replace(/^M [^C]+C/, "C")))
  .join(" ");

function RutaCurva({ zonesDone, trailFrom }: { zonesDone: string[]; trailFrom: string | null }) {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {/* halo luminoso del camino */}
      <path
        d={RUTA_COMPLETA}
        fill="none"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth={16}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        style={{ filter: "blur(6px)" }}
      />
      {/* camino blanco continuo */}
      <path
        d={RUTA_COMPLETA}
        fill="none"
        stroke="rgba(255,255,255,0.96)"
        strokeWidth={9}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {/* brillo interior */}
      <path
        d={RUTA_COMPLETA}
        fill="none"
        stroke="rgba(255,255,255,1)"
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        style={{ filter: "drop-shadow(0 0 4px rgba(255,255,255,0.9))" }}
      />

      {AREAS.slice(0, -1).map((a, i) => {
        const d = segmentoCurvo(i);
        const lit = zonesDone.includes(a.id);
        const trail = trailFrom === a.id;
        return (
          <g key={a.id}>
            {lit && (
              <path
                d={d}
                fill="none"
                stroke="rgba(255,224,130,0.9)"
                strokeWidth={5}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                style={{ filter: "drop-shadow(0 0 5px rgba(255,232,150,0.9))" }}
              />
            )}
            {trail && (
              <path
                className="ruta-draw"
                d={d}
                fill="none"
                stroke="rgba(255,240,170,0.95)"
                strokeWidth={6}
                strokeLinecap="round"
                pathLength={100}
                vectorEffect="non-scaling-stroke"
                style={
                  {
                    "--len": "100",
                    strokeDasharray: 100,
                    filter: "drop-shadow(0 0 6px rgba(255,232,150,0.95))",
                  } as CSSProperties
                }
              />
            )}
          </g>
        );
      })}
    </svg>
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

/** masa de vapor con volumen (luz arriba, sombra abajo) */
function Puff({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={`absolute rounded-[50%] ${className ?? ""}`}
      style={{
        background:
          "radial-gradient(circle at 38% 24%, #ffffff 0%, #f7fbff 45%, #dfe9f7 78%, #c6d5ea 100%)",
        boxShadow:
          "inset 0 -6px 10px rgba(150,170,200,0.45), inset 0 5px 8px rgba(255,255,255,0.95), 0 4px 10px rgba(60,90,130,0.28)",
        ...style,
      }}
      aria-hidden="true"
    />
  );
}

/**
 * Nube mágica en primer plano que esconde el cuerpo del guardián,
 * dejando ver solo la parte alta de la cabeza y los ojos.
 */
function NubeGuardian({ abriendo, boss }: { abriendo: boolean; boss?: boolean | undefined }) {
  const izq = abriendo ? "curtain-out-l" : "curtain-l";
  const der = abriendo ? "curtain-out-r" : "curtain-r";
  return (
    <span
      className="pointer-events-none absolute inset-x-[-58%] z-30 overflow-visible"
      style={{ top: boss ? "42%" : "46%", bottom: boss ? "-2%" : "-4%" }}
      aria-hidden="true"
    >
      {/* mitad izquierda */}
      <span className={`absolute inset-y-0 left-0 w-[62%] ${izq}`}>
        <Puff className="bottom-[6%] left-[0%] h-[64%] w-[58%]" />
        <Puff className="bottom-[16%] left-[20%] h-[74%] w-[56%]" />
        <Puff className="bottom-[10%] left-[48%] h-[66%] w-[56%]" />
        <Puff className="bottom-0 left-[8%] h-[46%] w-[86%]" />
      </span>
      {/* mitad derecha */}
      <span className={`absolute inset-y-0 right-0 w-[62%] ${der}`}>
        <Puff className="bottom-[6%] right-[0%] h-[62%] w-[58%]" />
        <Puff className="bottom-[16%] right-[20%] h-[76%] w-[58%]" />
        <Puff className="bottom-[10%] right-[48%] h-[64%] w-[54%]" />
        <Puff className="bottom-0 right-[8%] h-[44%] w-[86%]" />
      </span>

      {/* brillo mágico sutil */}
      <span
        className="absolute inset-x-[8%] top-[10%] h-[40%] rounded-[50%] blur-[10px]"
        style={{ background: "rgba(255,255,255,0.55)" }}
      />
    </span>
  );
}


export function MapaMundo({
  zonesDone,
  legendary,
  wonZone,
  pendingWin,
  onArea,
  onCollection,
  onSettings,
  onLegendary,
}: {
  zonesDone: string[];
  legendary: boolean;
  /** zona recién completada: al volver del combate se anima el camino desde ella */
  wonZone?: string | null;
  /** la pantalla de victoria está abierta: el mapa debe quedarse quieto */
  pendingWin?: boolean;
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
  /** zona cuyas nubes se están abriendo porque el niño acaba de entrar en ella */
  const [nubeAbierta, setNubeAbierta] = useState<string | null>(null);
  /** zona desde la que el camino se está iluminando piedra a piedra */
  const [trailFrom, setTrailFrom] = useState<string | null>(null);
  /** la mano solo aparece cuando la nueva zona ya está totalmente visible */
  const [handOn, setHandOn] = useState(true);
  
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
    setSound(o.musica || o.efectos);
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
    /* las nubes de esa zona se abren justo al entrar */
    setNubeAbierta(id);
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
    timers.current.push(
      setTimeout(() => {
        setVista("mapa");
        setNubeAbierta(null);
      }, 470),
    );
    timers.current.push(setTimeout(() => setSweep(false), 980));
  };

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
    },
    [],
  );

  /**
   * Al entrar en el mapa:
   *  - si venimos de ganar, el camino se enciende piedra a piedra y el niño decide cuándo seguir.
   *  - si no, se ve todo el reino unos segundos y entramos en la zona actual.
   */
  const progresoHecho = useRef(false);
  const arrancarProgreso = (zona: string) => {
    if (progresoHecho.current) return () => {};
    progresoHecho.current = true;
    const ts: ReturnType<typeof setTimeout>[] = [];
    setVista("mapa");
    setHandOn(false);
    try {
      navigator.vibrate?.(40);
    } catch {
      /* sin vibración */
    }
    /* 1) el niño ve el mapa quieto ~900ms, 2) la luz recorre el camino despacio */
    ts.push(
      setTimeout(() => {
        setTrailFrom(zona);
        sfx("abrir");
      }, 900),
    );
    /* al llegar la luz al final, se disipan las nubes de la nueva zona */
    ts.push(
      setTimeout(() => {
        setRevealed(nextZone?.id ?? null);
        sfx("esmeralda");
        try {
          navigator.vibrate?.(30);
        } catch {
          /* sin vibración */
        }
      }, 4600),
    );
    ts.push(
      setTimeout(() => setTrailFrom(null), 5600),
    );
    /* la nube tarda 1,4s en desvanecerse; medio segundo después llega la mano */
    ts.push(setTimeout(() => setHandOn(true), 6500));
    return () => ts.forEach(clearTimeout);
  };

  useEffect(() => {
    if (wonZone) return arrancarProgreso(wonZone);
    // sin victoria previa: el mapa se queda quieto hasta que el niño pulse una zona
    return;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wonZone]);




  const mundoArea = AREAS.find((a) => a.id === focusId) ?? nextZone ?? AREAS[0]!;


  const toggleSound = () => {
    const next = !sound;
    setSound(next);
    (["musica", "efectos"] as const).forEach((k) => setOpcion(k, next));
    if (next) {
      playMusic("mapa");
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


          {/* ruta curva continua 1 → 9 */}
          <RutaCurva zonesDone={zonesDone} trailFrom={trailFrom} />


          {/* la luz de progreso viaja de la zona completada a la siguiente */}
          {trailFrom &&
            (() => {
              const i = AREAS.findIndex((z) => z.id === trailFrom);
              const from = AREAS[i];
              const to = AREAS[i + 1];
              if (!from || !to) return null;
              return (
                <>
                  <span
                    className="zone-start-glow pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full blur-md"
                    style={{
                      left: `${from.x}%`,
                      top: `${from.y}%`,
                      width: 90,
                      height: 90,
                      background:
                        "radial-gradient(circle, rgba(255,246,190,0.95), rgba(255,214,90,0.35) 60%, transparent 75%)",
                    }}
                    aria-hidden="true"
                  />
                  <span
                    className="trail-spark pointer-events-none absolute z-10 grid place-items-center rounded-full"
                    style={
                      {
                        "--sx": `${from.x}%`,
                        "--sy": `${from.y}%`,
                        "--ex": `${to.x}%`,
                        "--ey": `${to.y}%`,
                        width: 26,
                        height: 26,
                        background:
                          "radial-gradient(circle, #fffdf0, #ffe07a 55%, rgba(255,200,60,0) 72%)",
                        boxShadow: "0 0 18px 8px rgba(255,232,150,0.85)",
                      } as CSSProperties
                    }
                    aria-hidden="true"
                  >
                    <span className="text-sm">✨</span>
                  </span>
                </>
              );
            })()}



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
                    irAlMundo(a.id);
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

                    {/* nube volumétrica DELANTE del guardián: solo asoma la cabeza */}
                    {!zonesDone.includes(a.id) && (
                      <NubeGuardian abriendo={nubeAbierta === a.id} boss={a.boss} />
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
                      } ${revealed === a.id ? "badge-pop" : ""}`}
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


                  {isNext && handOn && (
                    <span className="hand-in absolute -top-11 left-1/2 text-4xl drop-shadow-[0_3px_2px_rgba(0,0,0,0.4)]">
                      <span className="arrow-point block">👇</span>
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
            const target = nextZone ?? AREAS[0]!;
            irAlMundo(target.id);
          }}
          label="Ir a mi zona"
          icon="🔍"
          color="var(--arcade-orange)"
        />

      </div>

      {/* escenario del mundo: pantalla completa, encima del mapa */}
      {vista === "mundo" && (
        <div className="absolute inset-0 z-30">
          <Mundo
            area={mundoArea}
            done={zonesDone.includes(mundoArea.id)}
            onFight={() => onArea(mundoArea)}
            onMap={volverAlMapa}
          />
        </div>
      )}

      {/* barrido de nubes entre mapa y mundo */}
      {sweep && (
        <div className="pointer-events-none absolute inset-0 z-50 overflow-hidden" aria-hidden="true">
          <div className="cloud-sweep absolute inset-0 flex items-center justify-around bg-white/85 blur-[2px]">
            <span className="text-8xl">☁️</span>
            <span className="text-9xl">☁️</span>
            <span className="text-8xl">☁️</span>
          </div>
        </div>
      )}

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
                  } as CSSProperties
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
                    } as CSSProperties
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


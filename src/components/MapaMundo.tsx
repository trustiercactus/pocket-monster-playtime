import { useEffect, useMemo, useState } from "react";
import { AREAS, GEM_ZONES, type Area } from "@/lib/areas";
import { getCreature } from "@/lib/creatures";
import { LiveSprite } from "@/components/LiveSprite";
import trainerImg from "@/assets/trainer.png";
import mapaFondo from "@/assets/mapa-mundo.jpg";
import legendariaImg from "@/assets/legendaria.png";

function say(text: string) {
  try {
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

function Gem({ color, on, size = 30 }: { color: string; on: boolean; size?: number }) {
  return (
    <svg
      width={size}
      height={size * 1.15}
      viewBox="0 0 24 28"
      aria-hidden="true"
      className={on ? "gem-pop drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" : "opacity-60"}
    >
      <path
        d="M7 2h10l5 6v12l-5 6H7l-5-6V8z"
        fill={on ? color : "#8a8f99"}
        stroke="rgba(0,0,0,0.6)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M7 2l5 12L7 26z" fill="rgba(255,255,255,0.35)" />
      <path d="M17 2l-5 12 5 12z" fill="rgba(0,0,0,0.18)" />
    </svg>
  );
}

function ChunkyButton({
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
      className="btn-bounce btn-3d flex flex-col items-center rounded-[1.4rem] border-4 border-white/90 px-4 py-2 text-white shadow-[0_8px_0_rgba(0,0,0,0.35)]"
    >
      <span className="text-3xl drop-shadow-[0_2px_0_rgba(0,0,0,0.35)]">{icon}</span>
      <span className="text-[0.7rem] font-black tracking-wide">{label}</span>
    </button>
  );
}

export function MapaMundo({
  name,
  zonesDone,
  legendary,
  onArea,
  onCollection,
  onHome,
  onSettings,
  onLegendary,
}: {
  name: string;
  zonesDone: string[];
  legendary: boolean;
  onArea: (a: Area) => void;
  onCollection: () => void;
  onHome: () => void;
  onSettings: () => void;
  onLegendary: () => void;
  hasEggs?: boolean;
}) {
  const [profile, setProfile] = useState(false);
  const [wave, setWave] = useState(false);
  const [cine, setCine] = useState(false);

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
    if (zonesDone.length === 0) return undefined;
    setWave(true);
    const t = setTimeout(() => setWave(false), 1700);
    return () => clearTimeout(t);
  }, [zonesDone.length]);

  useEffect(() => {
    if (allGems && !legendary) setCine(true);
  }, [allGems, legendary]);

  // zonas despiertas: agujeros de color en el velo gris
  const awake = AREAS.filter((a, i) => zonesDone.includes(a.id) || isOpen(a, i));
  const holes = awake
    .map((a) => `radial-gradient(circle at ${a.x}% ${a.y}%, transparent 0 12%, #000 24%)`)
    .join(", ");

  return (
    <div className="screen-in w-full overflow-x-auto">
      <div className="relative mx-auto aspect-[16/9] w-full min-w-[880px] overflow-hidden rounded-[2rem] border-[6px] border-white/80 shadow-[0_12px_0_rgba(0,0,0,0.25)]">
        <img
          src={mapaFondo}
          alt=""
          width={1920}
          height={1088}
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* velo del reino dormido */}
        <div
          className="pointer-events-none absolute inset-0 transition-all duration-1000"
          style={{
            backgroundImage: `url(${mapaFondo})`,
            backgroundSize: "cover",
            filter: "grayscale(1) brightness(0.42) contrast(1.05)",
            WebkitMaskImage: holes || undefined,
            maskImage: holes || undefined,
            WebkitMaskComposite: "source-in",
            maskComposite: "intersect",
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(10,14,25,0.55))]" />

        {/* camino */}
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {AREAS.slice(0, -1).map((a, i) => {
            const b = AREAS[i + 1]!;
            const lit = zonesDone.includes(a.id);
            return (
              <line
                key={a.id}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={lit ? "#ffe27a" : "rgba(220,225,235,0.45)"}
                strokeWidth={lit ? 2.2 : 1.4}
                strokeLinecap="round"
                strokeDasharray="3 4"
                className={lit ? "path-glow" : undefined}
              />
            );
          })}
        </svg>

        {/* nodos */}
        {AREAS.map((a, i) => {
          const done = zonesDone.includes(a.id);
          const open = isOpen(a, i);
          const isNext = nextZone?.id === a.id;
          const guardian = getCreature(a.guardian);
          return (
            <div
              key={a.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${a.x}%`, top: `${a.y}%` }}
            >
              {done && (
                <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                  {a.particles.map((p, k) => (
                    <span
                      key={k}
                      className="biome-float absolute text-2xl"
                      style={{ left: `${k * 28}%`, animationDelay: `${k * 0.6}s` }}
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
                {/* guardián sobre la plataforma */}
                <img
                  src={guardian.image}
                  alt=""
                  loading="lazy"
                  className={`-mb-3 h-16 w-16 object-contain drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] ${
                    open ? "" : "grayscale brightness-75"
                  }`}
                />
                {/* plataforma redonda */}
                <span
                  className="grid h-8 w-20 place-items-center rounded-[50%] border-4 shadow-[0_6px_0_rgba(0,0,0,0.4)]"
                  style={{
                    background: open
                      ? `radial-gradient(circle at 50% 30%, ${a.gem}, rgba(0,0,0,0.25))`
                      : "linear-gradient(#8d939d,#5c626c)",
                    borderColor: open ? "#ffffffcc" : "#c9ced6aa",
                  }}
                >
                  <span className="grid h-7 w-7 place-items-center rounded-full border-2 border-white/80 bg-ink/70 text-sm font-black text-white">
                    {i + 1}
                  </span>
                </span>
                {/* banderola con el nombre */}
                <span
                  className="-mt-1 rounded-md border-2 border-white/70 px-2 py-[2px] text-[0.65rem] font-black uppercase tracking-wider text-white shadow-[0_3px_0_rgba(0,0,0,0.35)]"
                  style={{ backgroundColor: open ? "rgba(28,36,52,0.9)" : "rgba(60,66,76,0.9)" }}
                >
                  {a.name}
                </span>
                {!open && (
                  <span className="absolute right-0 top-8 grid h-8 w-8 place-items-center rounded-full border-2 border-white/80 bg-slate-300 text-lg shadow-[0_3px_0_rgba(0,0,0,0.4)]">
                    🔒
                  </span>
                )}
                {done && (
                  <span className="absolute -right-1 top-6 text-2xl drop-shadow">✅</span>
                )}
                {isNext && (
                  <span className="wiggle absolute -top-10 left-1/2 -translate-x-1/2 text-3xl">
                    👇
                  </span>
                )}
              </button>
              {isNext && (
                <LiveSprite
                  src={trainerImg}
                  alt=""
                  motion="hop"
                  className="pointer-events-none absolute -left-14 bottom-2 w-14"
                />
              )}
            </div>
          );
        })}

        {wave && (
          <div
            className="light-wave pointer-events-none absolute inset-y-0 w-1/3"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)",
            }}
            aria-hidden="true"
          />
        )}

        {/* barra de esmeraldas */}
        <div className="absolute left-1/2 top-3 flex -translate-x-1/2 items-center gap-2 rounded-full border-4 border-white/70 bg-ink/80 px-4 py-1 shadow-[0_6px_0_rgba(0,0,0,0.4)]">
          {GEM_ZONES.map((z) => (
            <Gem key={z.id} color={z.gem} on={zonesDone.includes(z.id)} />
          ))}
        </div>

        {/* botones */}
        <div className="absolute left-3 top-3">
          <ChunkyButton onClick={onSettings} label="OPCIONES" icon="⚙️" color="var(--arcade-blue)" />
        </div>
        <div className="absolute right-3 top-3">
          <ChunkyButton
            onClick={() => setProfile(true)}
            label="PERFIL"
            icon="👦"
            color="var(--arcade-green)"
          />
        </div>
        <div className="absolute bottom-3 left-3">
          <ChunkyButton
            onClick={onCollection}
            label="COLECCIÓN"
            icon="📖"
            color="var(--arcade-yellow)"
          />
        </div>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
          <ChunkyButton onClick={onHome} label="CASA" icon="🏠" color="var(--arcade-orange)" />
        </div>

        {/* búho guía */}
        <div className="absolute left-4 top-1/4 flex items-start gap-2">
          <span className="breathe text-6xl drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">🦉</span>
          <div className="flex items-start gap-2">
            <p className="max-w-[9.5rem] rounded-2xl border-4 border-white bg-[#fdf6e3] px-3 py-2 text-center text-[0.8rem] font-black leading-tight text-ink shadow-[0_6px_0_rgba(0,0,0,0.3)]">
              ¡Derrota al guardián y consigue su{" "}
              <span className="text-orange">Esmeralda!</span>
            </p>
            <button
              onClick={() =>
                say(
                  nextZone
                    ? `¡Hola ${name}! Toca ${nextZone.name} y vence al guardián para conseguir su esmeralda.`
                    : "¡Has conseguido todas las esmeraldas!",
                )
              }
              aria-label="Escuchar al búho"
              className="btn-bounce grid h-12 w-12 place-items-center rounded-full border-4 border-white bg-blue text-2xl text-white shadow-[0_5px_0_rgba(0,0,0,0.35)]"
              style={{ backgroundColor: "var(--arcade-blue)" }}
            >
              🔊
            </button>
          </div>
        </div>

        {profile && (
          <div
            className="absolute inset-0 z-20 grid place-items-center bg-ink/70 px-6"
            onClick={() => setProfile(false)}
          >
            <div className="pop-in flex flex-col items-center gap-3 rounded-[2rem] border-4 border-white bg-white px-8 py-6 shadow-2xl">
              <LiveSprite src={trainerImg} alt="Tu entrenador" motion="hop" className="w-28" />
              <p className="text-3xl font-black text-ink">{name}</p>
              <div className="flex gap-1">
                {GEM_ZONES.map((z) => (
                  <Gem key={z.id} color={z.gem} on={zonesDone.includes(z.id)} size={22} />
                ))}
              </div>
              <button
                onClick={() => setProfile(false)}
                aria-label="Cerrar"
                className="btn-bounce rounded-[1.5rem] border-4 border-white bg-orange px-8 py-4 text-3xl font-black text-white shadow-[0_8px_0_rgba(0,0,0,0.2)]"
              >
                ✅
              </button>
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
                    "--gx": `${Math.cos(ang) * 160}px`,
                    "--gy": `${Math.sin(ang) * 110}px`,
                  } as React.CSSProperties
                }
              >
                <Gem color={z.gem} on size={44} />
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

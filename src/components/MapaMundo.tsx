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

function Gem({ color, on, size = 34 }: { color: string; on: boolean; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={on ? "gem-pop drop-shadow-[0_3px_0_rgba(0,0,0,0.25)]" : "opacity-45"}
      style={{ filter: on ? undefined : "grayscale(1)" }}
    >
      <path d="M6 3h12l4 6-10 12L2 9z" fill={color} stroke="rgba(0,0,0,0.45)" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M6 3l6 18 6-18" fill="rgba(255,255,255,0.25)" />
      <path d="M2 9h20" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2" />
    </svg>
  );
}

function RoundButton({
  onClick,
  label,
  children,
  color,
  big,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
  color: string;
  big?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{ backgroundColor: color }}
      className={`btn-bounce btn-3d grid place-items-center rounded-full border-4 border-white text-white shadow-[0_8px_0_rgba(0,0,0,0.25)] ${
        big ? "h-20 w-20 text-4xl" : "h-14 w-14 text-2xl"
      }`}
    >
      <span className="drop-shadow-[0_2px_0_rgba(0,0,0,0.25)]">{children}</span>
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
  hasEggs,
}: {
  name: string;
  zonesDone: string[];
  legendary: boolean;
  onArea: (a: Area) => void;
  onCollection: () => void;
  onHome: () => void;
  onSettings: () => void;
  onLegendary: () => void;
  hasEggs: boolean;
}) {
  const [profile, setProfile] = useState(false);
  const [wave, setWave] = useState(false);
  const [cine, setCine] = useState(false);

  const allGems = GEM_ZONES.every((z) => zonesDone.includes(z.id));

  const nextZone = useMemo(() => {
    for (const a of AREAS) {
      if (a.boss) return allGems ? a : undefined;
      if (!zonesDone.includes(a.id)) return a;
    }
    return undefined;
  }, [zonesDone, allGems]);

  useEffect(() => {
    if (zonesDone.length > 0) {
      setWave(true);
      const t = setTimeout(() => setWave(false), 1700);
      return () => clearTimeout(t);
    }
  }, [zonesDone.length]);

  useEffect(() => {
    if (allGems && !legendary) setCine(true);
  }, [allGems, legendary]);

  function isOpen(a: Area, i: number) {
    if (a.boss) return allGems;
    return i === 0 || zonesDone.includes(AREAS[i - 1]!.id) || zonesDone.includes(a.id);
  }

  return (
    <div className="screen-in w-full overflow-x-auto">
      <div className="relative mx-auto aspect-[16/9] w-full min-w-[820px] overflow-hidden rounded-[2rem] border-4 border-white shadow-[0_10px_0_rgba(0,0,0,0.18)]">
        <img
          src={mapaFondo}
          alt=""
          width={1920}
          height={1088}
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* zonas dormidas: velo gris sobre el mundo aún sin despertar */}
        <div
          className="pointer-events-none absolute inset-0 transition-all duration-1000"
          style={{
            background: "linear-gradient(90deg, transparent 0%, rgba(60,70,90,0.55) 100%)",
            opacity: Math.max(0, 1 - zonesDone.length / GEM_ZONES.length),
            backdropFilter: "grayscale(0.6)",
          }}
        />

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
                stroke={lit ? "#ffe27a" : "rgba(255,255,255,0.35)"}
                strokeWidth={lit ? 2.4 : 1.6}
                strokeLinecap="round"
                strokeDasharray="4 4"
                className={lit ? "path-glow" : undefined}
              />
            );
          })}
        </svg>

        {/* nodos de zona */}
        {AREAS.map((a, i) => {
          const done = zonesDone.includes(a.id);
          const open = isOpen(a, i);
          const isNext = nextZone?.id === a.id;
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
                      style={{ left: `${k * 26}%`, animationDelay: `${k * 0.6}s` }}
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
                className={`relative grid place-items-center rounded-full border-[6px] border-white bg-white/90 p-1 shadow-[0_8px_0_rgba(0,0,0,0.2)] ${
                  open ? "btn-bounce" : "opacity-70"
                } ${isNext ? "node-bob" : ""}`}
                style={{ borderColor: done ? a.gem : "#ffffff" }}
              >
                <img
                  src={a.image}
                  alt={a.name}
                  width={512}
                  height={512}
                  loading="lazy"
                  className={`h-16 w-16 object-contain ${open ? "" : "grayscale opacity-50"}`}
                />
                <span className="absolute -bottom-2 -right-2 text-2xl">
                  {done ? "✅" : open ? a.emoji : "🔒"}
                </span>
                {isNext && (
                  <span className="absolute -top-9 left-1/2 -translate-x-1/2 text-3xl wiggle">👇</span>
                )}
              </button>
              {isNext && (
                <LiveSprite
                  src={trainerImg}
                  alt=""
                  motion="hop"
                  className="pointer-events-none absolute -left-14 bottom-0 w-14"
                />
              )}
            </div>
          );
        })}

        {/* onda de luz al despertar una zona */}
        {wave && (
          <div
            className="light-wave pointer-events-none absolute inset-y-0 w-1/3"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.85), transparent)",
            }}
            aria-hidden="true"
          />
        )}

        {/* barra de esmeraldas */}
        <div className="absolute left-1/2 top-3 flex -translate-x-1/2 items-center gap-1 rounded-full border-4 border-white bg-white/80 px-3 py-1 shadow-[0_6px_0_rgba(0,0,0,0.18)]">
          {GEM_ZONES.map((z) => (
            <Gem key={z.id} color={z.gem} on={zonesDone.includes(z.id)} />
          ))}
        </div>

        {/* botones */}
        <div className="absolute left-3 top-3">
          <RoundButton onClick={onSettings} label="Opciones" color="var(--arcade-blue)">
            ⚙️
          </RoundButton>
        </div>
        <div className="absolute right-3 top-3">
          <RoundButton onClick={() => setProfile(true)} label="Perfil" color="var(--arcade-green)">
            👦
          </RoundButton>
        </div>
        <div className="absolute bottom-3 left-3">
          <RoundButton onClick={onCollection} label="Colección" color="var(--arcade-yellow)" big>
            📖
          </RoundButton>
        </div>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
          <RoundButton onClick={onHome} label="Casa" color="var(--arcade-orange)" big>
            🏠{hasEggs ? "" : ""}
          </RoundButton>
        </div>
        <button
          onClick={() =>
            say(
              nextZone
                ? `¡Hola ${name}! Toca ${nextZone.name} y vence al guardián para conseguir su esmeralda.`
                : "¡Has conseguido todas las esmeraldas!",
            )
          }
          aria-label="Búho guía"
          className="btn-bounce absolute bottom-3 right-3 flex items-center gap-2 rounded-full border-4 border-white bg-white/90 px-4 py-2 text-4xl shadow-[0_8px_0_rgba(0,0,0,0.2)]"
        >
          <span className="breathe inline-block">🦉</span>
          <span className="text-3xl">🔊</span>
        </button>

        {profile && (
          <div
            className="absolute inset-0 z-20 grid place-items-center bg-ink/60 px-6"
            onClick={() => setProfile(false)}
          >
            <div className="pop-in flex flex-col items-center gap-3 rounded-[2rem] border-4 border-white bg-white px-8 py-6 shadow-2xl">
              <LiveSprite src={trainerImg} alt="Tu entrenador" motion="hop" className="w-28" />
              <p className="text-3xl font-black text-ink">{name}</p>
              <div className="flex gap-1">
                {GEM_ZONES.map((z) => (
                  <Gem key={z.id} color={z.gem} on={zonesDone.includes(z.id)} size={26} />
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
                <Gem color={z.gem} on size={46} />
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

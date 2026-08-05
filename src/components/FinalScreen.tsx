import { useEffect, useState } from "react";
import { getCreature, LEGENDARY_ID } from "@/lib/creatures";
import { GEM_ZONES } from "@/lib/areas";
import { LiveSprite } from "@/components/LiveSprite";
import trainerImg from "@/assets/trainer.png";

/** musiquilla alegre y épica de cierre */
function victoryMusic() {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const notes = [523.25, 659.25, 783.99, 1046.5, 987.77, 1046.5, 1318.5];
    notes.forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "triangle";
      const t = ctx.currentTime + i * 0.26;
      o.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.22, t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.65);
    });
  } catch {
    /* sin sonido */
  }
}

/** sonidito simpático al tocar una criatura */
function poke() {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(620, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(1180, ctx.currentTime + 0.18);
    g.gain.setValueAtTime(0.2, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.32);
  } catch {
    /* sin sonido */
  }
}

function Fireworks() {
  const colors = ["#ffd54a", "#ff6b6b", "#4ade80", "#38bdf8", "#c084fc"];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {Array.from({ length: 8 }).map((_, i) => (
        <span
          key={i}
          className="firework absolute h-24 w-24 rounded-full"
          style={{
            left: `${8 + ((i * 29) % 82)}%`,
            top: `${6 + ((i * 19) % 55)}%`,
            background: `radial-gradient(circle, ${colors[i % colors.length]}cc, transparent 62%)`,
            animationDelay: `${(i % 5) * 0.6}s`,
          }}
        />
      ))}
      {Array.from({ length: 24 }).map((_, i) => (
        <span
          key={`c${i}`}
          className="absolute text-3xl"
          style={{
            left: `${(i * 41) % 97}%`,
            animation: `confetti-fall ${1.8 + (i % 5) * 0.4}s linear ${(i % 7) * 0.22}s infinite`,
          }}
        >
          {["⭐", "🎉", "✨", "🎊", "💫", "🌟"][i % 6]}
        </span>
      ))}
    </div>
  );
}

export function FinalScreen({
  name,
  unlocked,
  onNewGame,
  onCollection,
}: {
  name: string;
  unlocked: string[];
  onNewGame: () => void;
  onCollection: () => void;
}) {
  const aurora = getCreature(LEGENDARY_ID);
  const friends = GEM_ZONES.map((z) => getCreature(z.guardian)).filter((c) =>
    unlocked.includes(c.id),
  );
  const [phase, setPhase] = useState(0);
  const [tapped, setTapped] = useState<string | null>(null);

  useEffect(() => {
    victoryMusic();
    const t1 = window.setTimeout(() => setPhase(1), 1600); // guardianes
    const t2 = window.setTimeout(() => setPhase(2), 4200); // primer mensaje
    const t3 = window.setTimeout(() => setPhase(3), 7600); // segundo mensaje + botones
    return () => [t1, t2, t3].forEach(clearTimeout);
  }, []);

  function tap(id: string) {
    poke();
    setTapped(id);
    window.setTimeout(() => setTapped((v) => (v === id ? null : v)), 720);
  }

  return (
    <div className="safe-pad fixed inset-0 z-50 flex flex-col items-center justify-between gap-1 overflow-hidden bg-gradient-to-b from-[#2b1b5e] via-[#5b3fa8] to-[#ffb46b]">
      <span className="final-flash pointer-events-none absolute inset-0 bg-white" aria-hidden="true" />
      <Fireworks />

      {/* héroes */}
      <div className="relative flex shrink-0 flex-col items-center gap-1">
        <button
          onClick={() => tap(LEGENDARY_ID)}
          aria-label={aurora.name}
          className={`relative ${tapped === LEGENDARY_ID ? "cheer" : "wings-open"}`}
        >
          <LiveSprite src={aurora.image} alt={aurora.name} motion="float" className="max-h-[22vh] w-40 object-contain" />
          {tapped === LEGENDARY_ID && (
            <span className="pop-in absolute -right-2 top-0 text-5xl">💖</span>
          )}
        </button>
        <div className="flex items-end gap-2">
          <LiveSprite src={trainerImg} alt={name} motion="hop" className="max-h-[10vh] w-16 object-contain" />
          <span className="wiggle text-3xl">🎉</span>
        </div>
      </div>

      {/* guardianes liberados */}
      {phase >= 1 && (
        <div className="relative z-10 flex max-w-sm shrink-0 flex-wrap items-end justify-center gap-1">
          {friends.map((c, i) => (
            <button
              key={c.id}
              onClick={() => tap(c.id)}
              aria-label={c.name}
              className={`friend-in relative ${tapped === c.id ? "cheer" : ""}`}
              style={{ animationDelay: `${i * 0.22}s` }}
            >
              <LiveSprite
                src={c.image}
                alt={c.name}
                motion={i % 2 === 0 ? "breathe" : "sway"}
                delay={(i % 4) * 0.3}
                className="max-h-[8vh] w-14 object-contain"
              />
              {tapped === c.id && (
                <span className="pop-in absolute -top-1 right-0 text-3xl">✨</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* mensajes */}
      <div className="relative z-10 flex w-full max-w-sm shrink-0 flex-col items-center gap-2 text-center">
        {phase >= 2 && (
          <div className="pop-in rounded-[1.75rem] border-4 border-white bg-ink/80 px-3 py-2 shadow-[0_8px_0_rgba(0,0,0,0.35)]">
            <p className="text-xl font-black leading-tight text-white">
              🏆 ¡Has salvado el Reino de las Criaturitas!
            </p>
            <p className="mt-1 text-base font-black text-white/90">
              ✨ Gracias por liberar a todos los guardianes.
            </p>
          </div>
        )}
        {phase >= 3 && (
          <p className="pop-in text-xl font-black text-white drop-shadow-[0_3px_0_rgba(0,0,0,0.4)]">
            ⭐ ¡La aventura ha terminado!
          </p>
        )}

        {phase >= 3 && (
          <div className="pop-in flex w-full flex-col gap-2">
            <button
              onClick={onNewGame}
              aria-label="Nueva aventura"
              className="btn-bounce btn-3d w-full rounded-[2rem] border-4 border-white bg-green px-4 py-4 text-2xl font-black text-white shadow-[0_10px_0_rgba(0,0,0,0.25)]"
            >
              🟢 Nueva aventura
            </button>
            <button
              onClick={onCollection}
              aria-label="Ver colección"
              className="btn-bounce btn-3d w-full rounded-[2rem] border-4 border-white bg-blue px-4 py-4 text-2xl font-black text-white shadow-[0_10px_0_rgba(0,0,0,0.25)]"
            >
              🔵 Ver colección
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

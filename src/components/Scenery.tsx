/** Capas decorativas animadas: nubes, mariposas, flores y hierba. Solo visual. */

const CLOUDS = [
  { top: "6%", size: "text-6xl", dur: 46, delay: 0, op: 0.95 },
  { top: "16%", size: "text-4xl", dur: 62, delay: -18, op: 0.8 },
  { top: "28%", size: "text-5xl", dur: 78, delay: -40, op: 0.7 },
];

const BUTTERFLIES = [
  { left: "6%", top: "34%", dur: 16, delay: 0, emoji: "🦋" },
  { left: "48%", top: "22%", dur: 21, delay: -6, emoji: "🦋" },
  { left: "22%", top: "58%", dur: 26, delay: -12, emoji: "🐝" },
];

const GROUND = ["🌷", "🌿", "🌼", "🌱", "🌻", "🍀", "🌸", "🌾", "🌺", "🌿", "🌼", "🌱"];

const SPARKLES = [
  { left: "12%", top: "18%" },
  { left: "78%", top: "12%" },
  { left: "62%", top: "44%" },
  { left: "30%", top: "8%" },
];

export function Scenery({ dense = false }: { dense?: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {CLOUDS.map((c, i) => (
        <span
          key={`c${i}`}
          className={`absolute ${c.size}`}
          style={{
            top: c.top,
            left: 0,
            opacity: c.op,
            animation: `cloud-drift ${c.dur}s linear ${c.delay}s infinite`,
          }}
        >
          ☁️
        </span>
      ))}

      {SPARKLES.map((s, i) => (
        <span
          key={`s${i}`}
          className="absolute text-2xl twinkle"
          style={{ left: s.left, top: s.top, animationDelay: `${i * 0.6}s` }}
        >
          ✨
        </span>
      ))}

      {BUTTERFLIES.slice(0, dense ? 3 : 2).map((b, i) => (
        <span
          key={`b${i}`}
          className="absolute text-3xl"
          style={{
            left: b.left,
            top: b.top,
            animation: `butterfly ${b.dur}s ease-in-out ${b.delay}s infinite`,
          }}
        >
          <span className="inline-block" style={{ animation: "flap 0.5s ease-in-out infinite" }}>
            {b.emoji}
          </span>
        </span>
      ))}

      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between px-1 text-3xl">
        {GROUND.map((g, i) => (
          <span
            key={`g${i}`}
            className="grass-wave inline-block"
            style={{ animationDelay: `${(i % 5) * 0.25}s`, opacity: 0.9 }}
          >
            {g}
          </span>
        ))}
      </div>
    </div>
  );
}

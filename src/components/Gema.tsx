/** Esmeralda de zona: cada corte y color son distintos */
export type GemCut = "esmeralda" | "hoja" | "hielo" | "fuego" | "sol" | "gota" | "nube" | "estrella";

const PATHS: Record<GemCut, string> = {
  // hexágono clásico tallado
  esmeralda: "M7 2h10l5 6v12l-5 6H7l-5-6V8z",
  // hoja puntiaguda
  hoja: "M12 1c7 5 9 11 6 17-2 4-4 7-6 9-2-2-4-5-6-9-3-6-1-12 6-17z",
  // cristal de hielo alargado
  hielo: "M12 1l6 7-2 12-4 7-4-7-2-12z",
  // llama/rombo de fuego
  fuego: "M12 1l8 9-3 10-5 7-5-7-3-10z",
  // sol octogonal ámbar
  sol: "M9 2h6l5 4v6l-2 8-6 6-6-6-2-8V6z",
  // gota de mar
  gota: "M12 1c5 6 8 10 8 14a8 8 0 1 1-16 0c0-4 3-8 8-14z",
  // cristal redondeado de cielo
  nube: "M12 1l7 5 1 9-8 12-8-12 1-9z",
  // estrella violeta
  estrella: "M12 1l3.4 7.2 7.6 1-5.6 5.6 1.5 8.2L12 19.2 5.1 23l1.5-8.2L1 9.2l7.6-1z",
};

export function Gema({
  color,
  cut = "esmeralda",
  size = 28,
  spin = false,
  className = "",
}: {
  color: string;
  cut?: GemCut;
  size?: number;
  spin?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`relative inline-grid place-items-center ${spin ? "gem-spin" : ""} ${className}`}
      style={{ width: size, height: size * 1.15 }}
      aria-hidden="true"
    >
      <svg width={size} height={size * 1.15} viewBox="0 0 24 28">
        <path
          d={PATHS[cut]}
          fill={color}
          stroke="rgba(255,255,255,0.92)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d={PATHS[cut]} fill="url(#gemShine)" opacity="0.55" />
        <defs>
          <linearGradient id="gemShine" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="45%" stopColor="#ffffff" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.25" />
          </linearGradient>
        </defs>
      </svg>
    </span>
  );
}

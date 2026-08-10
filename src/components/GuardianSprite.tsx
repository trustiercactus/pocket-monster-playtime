/**
 * Guardián con dos estados visuales anclados a la propia criatura:
 * - tranquilo: tal cual, adorable.
 * - enfadado: aura mágica, chispas y un tinte rojizo/brillante que sigue
 *   exactamente la silueta (y por tanto los ojos) del sprite, sin puntos rojos
 *   pegados encima ni coordenadas fijas de pantalla.
 */

type Motion = "breathe" | "sway" | "hop" | "float";

const MOTION_CLASS: Record<Motion, string> = {
  breathe: "breathe",
  sway: "sway",
  hop: "hop",
  float: "float-soft",
};

export function GuardianSprite({
  src,
  alt,
  className = "",
  motion = "float",
  enraged = false,
  boss = false,
  auraColor = "rgba(255,90,60,0.75)",
  imgClassName = "",
}: {
  src: string;
  alt: string;
  /** tamaño del sprite (w-52, h-40 w-40, …) */
  className?: string;
  motion?: Motion;
  enraged?: boolean | undefined;
  boss?: boolean | undefined;
  auraColor?: string;
  /** animaciones extra sobre la imagen (sacudida, disolución, …) */
  imgClassName?: string;
}) {
  const halo = boss ? "rgba(150,80,255,0.8)" : auraColor;

  return (
    <span className="relative inline-block">
      {/* aura mágica alrededor, anclada al sprite */}
      <span
        className={`pointer-events-none absolute -inset-8 rounded-full blur-2xl transition-opacity duration-700 ${
          enraged ? "rage-aura opacity-100" : "opacity-0"
        }`}
        style={{ background: `radial-gradient(circle, ${halo}, transparent 70%)` }}
        aria-hidden="true"
      />

      {/* resplandor con la forma exacta de la criatura (detrás) */}
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className={`${MOTION_CLASS[motion]} ${className} pointer-events-none absolute inset-0 transition-opacity duration-700 ${
          enraged ? "rage-halo opacity-70" : "opacity-0"
        }`}
        style={{
          filter: boss
            ? "blur(7px) saturate(6) hue-rotate(240deg) brightness(1.2)"
            : "blur(7px) saturate(6) hue-rotate(-30deg) brightness(1.15)",
        }}
      />

      {/* la criatura, sin tocar el asset original */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className={`${MOTION_CLASS[motion]} ${className} ${imgClassName} relative transition-[filter] duration-700`}
        style={{
          filter: enraged
            ? "saturate(1.35) contrast(1.2) brightness(0.92)"
            : "saturate(1) contrast(1) brightness(1)",
        }}
      />

      {/* tinte mágico que sigue la silueta: ilumina también los ojos */}
      <span
        className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${
          enraged ? "rage-tint opacity-100" : "opacity-0"
        }`}
        aria-hidden="true"
        style={{
          WebkitMaskImage: `url(${src})`,
          maskImage: `url(${src})`,
          WebkitMaskSize: "100% 100%",
          maskSize: "100% 100%",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          background: boss
            ? "radial-gradient(circle at 50% 38%, rgba(200,120,255,0.75), rgba(90,30,160,0.35) 55%, transparent 78%)"
            : "radial-gradient(circle at 50% 38%, rgba(255,80,60,0.7), rgba(140,20,20,0.3) 55%, transparent 78%)",
          mixBlendMode: "screen",
        }}
      />

      {/* chispas mágicas, también ancladas al sprite */}
      {enraged && (
        <span className="pointer-events-none absolute -inset-4" aria-hidden="true">
          {Array.from({ length: 7 }).map((_, i) => (
            <span
              key={i}
              className="rage-spark absolute text-base"
              style={{
                left: `${10 + ((i * 31) % 80)}%`,
                top: `${18 + ((i * 43) % 62)}%`,
                animationDelay: `${i * 0.25}s`,
              }}
            >
              {boss ? (i % 2 ? "💜" : "✨") : i % 2 ? "✨" : "🔥"}
            </span>
          ))}
        </span>
      )}
    </span>
  );
}

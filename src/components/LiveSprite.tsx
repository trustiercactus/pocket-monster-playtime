/** Sprite con vida: respira, se balancea o da saltitos, con brillo de parpadeo. */

type Motion = "breathe" | "sway" | "hop" | "float";

const MOTION_CLASS: Record<Motion, string> = {
  breathe: "breathe",
  sway: "sway",
  hop: "hop",
  float: "float-soft",
};

export function LiveSprite({
  src,
  alt,
  className = "",
  motion = "breathe",
  delay = 0,
  dim = false,
}: {
  src: string;
  alt: string;
  className?: string;
  motion?: Motion;
  delay?: number;
  dim?: boolean;
}) {
  return (
    <span className="relative inline-block">
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className={`${MOTION_CLASS[motion]} ${className} ${dim ? "opacity-25 grayscale" : ""}`}
        style={{ animationDelay: `${delay}s` }}
      />
      {!dim && (
        <span
          className="pointer-events-none absolute inset-0 rounded-full bg-white"
          style={{ animation: `blink-shine 5s ease-in-out ${delay + 1}s infinite`, opacity: 0 }}
          aria-hidden="true"
        />
      )}
    </span>
  );
}

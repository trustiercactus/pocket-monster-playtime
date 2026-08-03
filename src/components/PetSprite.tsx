import { useState } from "react";
import { LiveSprite } from "@/components/LiveSprite";

const REACTIONS = ["💖", "😄", "✨", "🎵", "🐾"];

/** Criatura amiga: al tocarla salta y muestra una reacción alegre. */
export function PetSprite({
  src,
  alt,
  className = "",
  motion = "breathe",
  delay = 0,
}: {
  src: string;
  alt: string;
  className?: string;
  motion?: "breathe" | "sway" | "hop" | "float";
  delay?: number;
}) {
  const [reaction, setReaction] = useState<string | null>(null);

  function touch() {
    setReaction(REACTIONS[Math.floor(Math.random() * REACTIONS.length)] as string);
    window.setTimeout(() => setReaction(null), 900);
  }

  return (
    <button
      type="button"
      onClick={touch}
      aria-label={alt}
      className="relative inline-block bg-transparent p-0"
    >
      <span className={reaction ? "tap-jump inline-block" : "inline-block"} key={reaction ?? "idle"}>
        <LiveSprite src={src} alt={alt} motion={motion} delay={delay} className={className} />
      </span>
      {reaction && (
        <span className="pop-in pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 text-3xl">
          {reaction}
        </span>
      )}
    </button>
  );
}

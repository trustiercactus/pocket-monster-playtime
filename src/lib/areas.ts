import aldea from "@/assets/zona-aldea.png";
import bosque from "@/assets/zona-bosque.png";
import lago from "@/assets/zona-lago.png";
import cueva from "@/assets/zona-cueva.png";
import volcan from "@/assets/zona-volcan.png";
import castillo from "@/assets/zona-castillo.png";

export type Area = {
  id: string;
  name: string;
  emoji: string;
  image: string;
  color: string;
  winsNeeded: number;
};

export const AREAS: Area[] = [
  { id: "aldea", name: "Aldea", emoji: "🏡", image: aldea, color: "var(--arcade-green)", winsNeeded: 0 },
  { id: "bosque", name: "Bosque", emoji: "🌳", image: bosque, color: "var(--arcade-green)", winsNeeded: 2 },
  { id: "lago", name: "Lago", emoji: "💧", image: lago, color: "var(--arcade-blue)", winsNeeded: 4 },
  { id: "cueva", name: "Cueva", emoji: "🪨", image: cueva, color: "var(--arcade-ink)", winsNeeded: 6 },
  { id: "volcan", name: "Volcán", emoji: "🌋", image: volcan, color: "var(--arcade-orange)", winsNeeded: 8 },
  { id: "castillo", name: "Castillo", emoji: "🏰", image: castillo, color: "var(--arcade-yellow)", winsNeeded: 10 },
];

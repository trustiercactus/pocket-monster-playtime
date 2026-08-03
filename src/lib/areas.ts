import aldea from "@/assets/zona-aldea.png";
import pradera from "@/assets/zona-pradera.png";
import bosque from "@/assets/zona-bosque.png";
import lago from "@/assets/zona-lago.png";
import volcan from "@/assets/zona-volcan.png";
import nieve from "@/assets/zona-nieve.png";
import cueva from "@/assets/zona-cueva.png";
import castillo from "@/assets/zona-castillo.png";
import jefe from "@/assets/zona-jefe.png";

export type Area = {
  id: string;
  name: string;
  emoji: string;
  image: string;
  color: string;
  /** posición en el mapa (porcentaje) */
  x: number;
  y: number;
  /** criatura del guardián que se une al equipo */
  guardian: string;
  /** color de la esmeralda de la zona */
  gem: string;
  /** partículas del bioma al despertar la zona */
  particles: string[];
  /** true = castillo del jefe final (necesita las 8 esmeraldas) */
  boss?: boolean;
  winsNeeded: number;
};

export const AREAS: Area[] = [
  { id: "pueblo", name: "Pueblo", emoji: "🏡", image: aldea, color: "var(--arcade-green)", x: 8, y: 68, guardian: "chispi", gem: "#7cd992", particles: ["🌼", "🦋", "✨"], winsNeeded: 0 },
  { id: "pradera", name: "Pradera", emoji: "🌿", image: pradera, color: "var(--arcade-green)", x: 21, y: 44, guardian: "hojito", gem: "#a6e34d", particles: ["🌸", "🦋", "🌼"], winsNeeded: 0 },
  { id: "bosque", name: "Bosque", emoji: "🌳", image: bosque, color: "var(--arcade-green)", x: 33, y: 72, guardian: "cactino", gem: "#2fb765", particles: ["🍃", "🦋", "🌰"], winsNeeded: 0 },
  { id: "lago", name: "Lago", emoji: "💧", image: lago, color: "var(--arcade-blue)", x: 45, y: 40, guardian: "aquip", gem: "#3fc7ff", particles: ["💧", "🫧", "🐟"], winsNeeded: 0 },
  { id: "volcan", name: "Volcán", emoji: "🌋", image: volcan, color: "var(--arcade-orange)", x: 57, y: 70, guardian: "lavito", gem: "#ff7a3d", particles: ["🔥", "✨", "💥"], winsNeeded: 0 },
  { id: "nieve", name: "Nieve", emoji: "❄️", image: nieve, color: "#8fd8ff", x: 69, y: 38, guardian: "ballenin", gem: "#bfeaff", particles: ["❄️", "✨", "⛄"], winsNeeded: 0 },
  { id: "cueva", name: "Cueva", emoji: "🦇", image: cueva, color: "var(--arcade-ink)", x: 80, y: 70, guardian: "buhito", gem: "#b98cff", particles: ["🦇", "💎", "✨"], winsNeeded: 0 },
  { id: "castillo", name: "Castillo", emoji: "🏰", image: castillo, color: "var(--arcade-yellow)", x: 90, y: 40, guardian: "fenix", gem: "#ffd83d", particles: ["👑", "✨", "🎉"], winsNeeded: 0 },
  { id: "jefe", name: "Castillo del Jefe", emoji: "👿", image: jefe, color: "#7a2ff2", x: 96, y: 72, guardian: "estrelin", gem: "#ff4fd8", particles: ["💜", "⚡", "✨"], boss: true, winsNeeded: 0 },
];

export const GEM_ZONES = AREAS.filter((a) => !a.boss);

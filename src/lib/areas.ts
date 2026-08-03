import aldea from "@/assets/zona-aldea.png";
import bosque from "@/assets/zona-bosque.png";
import nieve from "@/assets/zona-nieve.png";
import volcan from "@/assets/zona-volcan.png";
import desierto from "@/assets/zona-desierto.png";
import playa from "@/assets/zona-playa.png";
import cielo from "@/assets/zona-cielo.png";
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
  { id: "pueblo", name: "Pueblo", emoji: "🏡", image: aldea, color: "var(--arcade-green)", x: 50, y: 93, guardian: "chispi", gem: "#7cd992", particles: ["🌼", "🦋", "✨"], winsNeeded: 0 },
  { id: "bosque", name: "Bosque", emoji: "🌳", image: bosque, color: "var(--arcade-green)", x: 26, y: 82, guardian: "hojito", gem: "#2fb765", particles: ["🍃", "🦋", "🌰"], winsNeeded: 0 },
  { id: "nieve", name: "Montaña Nevada", emoji: "❄️", image: nieve, color: "#8fd8ff", x: 70, y: 71, guardian: "ballenin", gem: "#bfeaff", particles: ["❄️", "✨", "⛄"], winsNeeded: 0 },
  { id: "volcan", name: "Volcán", emoji: "🌋", image: volcan, color: "var(--arcade-orange)", x: 28, y: 60, guardian: "lavito", gem: "#ff7a3d", particles: ["🔥", "✨", "💥"], winsNeeded: 0 },
  { id: "desierto", name: "Desierto", emoji: "🏜️", image: desierto, color: "#f6c85f", x: 68, y: 49, guardian: "cactino", gem: "#ffd83d", particles: ["🌵", "✨", "🪶"], winsNeeded: 0 },
  { id: "playa", name: "Playa", emoji: "🌊", image: playa, color: "var(--arcade-blue)", x: 30, y: 38, guardian: "aquip", gem: "#3fc7ff", particles: ["🐚", "🫧", "🐟"], winsNeeded: 0 },
  { id: "cielo", name: "Cielo", emoji: "☁️", image: cielo, color: "#cfe9ff", x: 68, y: 27, guardian: "buhito", gem: "#b98cff", particles: ["☁️", "🌈", "✨"], winsNeeded: 0 },
  { id: "castillo", name: "Castillo", emoji: "🏰", image: castillo, color: "var(--arcade-yellow)", x: 38, y: 16, guardian: "fenix", gem: "#ff8ad1", particles: ["👑", "✨", "🎉"], winsNeeded: 0 },
  { id: "jefe", name: "Castillo Final", emoji: "👿", image: jefe, color: "#7a2ff2", x: 62, y: 6, guardian: "estrelin", gem: "#ff4fd8", particles: ["💜", "⚡", "✨"], boss: true, winsNeeded: 0 },
];

export const GEM_ZONES = AREAS.filter((a) => !a.boss);

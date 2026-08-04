import aldea from "@/assets/zona-aldea.png";
import bosque from "@/assets/zona-bosque.png";
import nieve from "@/assets/zona-nieve.png";
import volcan from "@/assets/zona-volcan.png";
import desierto from "@/assets/zona-desierto.png";
import playa from "@/assets/zona-playa.png";
import cielo from "@/assets/zona-cielo.png";
import castillo from "@/assets/zona-castillo.png";
import jefe from "@/assets/zona-jefe.png";

export type TerrainId =
  | "tierra"
  | "hierba"
  | "nieve"
  | "roca"
  | "arena"
  | "nube"
  | "oscura";

export type Terrain = {
  /** relleno de las piedrecitas del sendero */
  fill: string;
  border: string;
  /** forma: redonda (piedra) o suave (nube/arena) */
  round: string;
};

export const TERRAIN: Record<TerrainId, Terrain> = {
  tierra: {
    fill: "radial-gradient(circle at 38% 28%, #d9b98a, #9c7346)",
    border: "rgba(255,255,255,0.75)",
    round: "48%",
  },
  hierba: {
    fill: "radial-gradient(circle at 38% 28%, #a9e07a, #4f9a3d)",
    border: "rgba(255,255,255,0.7)",
    round: "50%",
  },
  nieve: {
    fill: "radial-gradient(circle at 38% 28%, #ffffff, #bcdcf2)",
    border: "rgba(255,255,255,0.95)",
    round: "50%",
  },
  roca: {
    fill: "radial-gradient(circle at 38% 28%, #8a7d7a, #3b302e)",
    border: "rgba(255,170,90,0.8)",
    round: "40%",
  },
  arena: {
    fill: "radial-gradient(circle at 38% 28%, #ffe7ad, #dfae5c)",
    border: "rgba(255,255,255,0.8)",
    round: "50%",
  },
  nube: {
    fill: "radial-gradient(circle at 38% 28%, #ffffff, #cfe4ff)",
    border: "rgba(255,255,255,0.95)",
    round: "50%",
  },
  oscura: {
    fill: "radial-gradient(circle at 38% 28%, #6b5a92, #2c2340)",
    border: "rgba(210,180,255,0.85)",
    round: "42%",
  },
};

/** base sobre la que descansa el guardián, propia de cada bioma */
export type PedestalId =
  | "tierra"
  | "tocon"
  | "hielo"
  | "lava"
  | "arenisca"
  | "rocamar"
  | "nube"
  | "piedra";

export type Pedestal = { fill: string; border: string; shadow: string };

export const PEDESTAL: Record<PedestalId, Pedestal> = {
  tierra: {
    fill: "radial-gradient(circle at 50% 25%, #e8c896, #b8894f 70%, #8a6234)",
    border: "rgba(255,255,255,0.85)",
    shadow: "0 4px 0 rgba(90,60,25,0.55)",
  },
  tocon: {
    fill: "radial-gradient(circle at 50% 25%, #e0b070, #a9713a 65%, #6f4520)",
    border: "rgba(255,240,210,0.9)",
    shadow: "0 4px 0 rgba(70,40,15,0.55)",
  },
  hielo: {
    fill: "radial-gradient(circle at 50% 25%, #ffffff, #a9e2ff 65%, #62b6e8)",
    border: "rgba(255,255,255,0.95)",
    shadow: "0 4px 0 rgba(60,120,160,0.5)",
  },
  lava: {
    fill: "radial-gradient(circle at 50% 25%, #7a6260, #453634 65%, #241b1a)",
    border: "rgba(255,150,70,0.9)",
    shadow: "0 4px 0 rgba(120,40,10,0.6)",
  },
  arenisca: {
    fill: "radial-gradient(circle at 50% 25%, #ffe8b5, #e0ac57 70%, #b3803a)",
    border: "rgba(255,255,255,0.9)",
    shadow: "0 4px 0 rgba(130,90,30,0.5)",
  },
  rocamar: {
    fill: "radial-gradient(circle at 50% 25%, #d9f0f5, #8fbfc9 65%, #5b8a95)",
    border: "rgba(255,255,255,0.92)",
    shadow: "0 4px 0 rgba(40,90,105,0.5)",
  },
  nube: {
    fill: "radial-gradient(circle at 50% 25%, #ffffff, #eaf4ff 70%, #c6ddf7)",
    border: "rgba(255,255,255,0.98)",
    shadow: "0 4px 0 rgba(120,150,190,0.45)",
  },
  piedra: {
    fill: "radial-gradient(circle at 50% 25%, #cdbde9, #7a68a4 65%, #423560)",
    border: "rgba(230,215,255,0.92)",
    shadow: "0 4px 0 rgba(40,25,70,0.6)",
  },
};

/** partículas de ambiente propias del bioma (siempre visibles, muy suaves) */
export type AmbientKind = "fall" | "rise" | "drift";
export type Ambient = { emoji: string; kind: AmbientKind };

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
  /** ambiente vivo del bioma */
  ambient: Ambient[];
  /** terreno del sendero que sale de esta zona */
  terrain: TerrainId;
  /** base del guardián */
  pedestal: PedestalId;
  /** true = castillo del jefe final (necesita las 8 esmeraldas) */
  boss?: boolean;
  winsNeeded: number;
};

export const AREAS: Area[] = [
  { id: "pueblo", name: "Pueblo", emoji: "🏡", image: aldea, color: "var(--arcade-green)", x: 50, y: 94, guardian: "chispi", gem: "#7cd992", particles: ["🌼", "🦋", "✨"], ambient: [{ emoji: "🦋", kind: "drift" }, { emoji: "🌼", kind: "rise" }], terrain: "tierra", pedestal: "tierra", winsNeeded: 0 },
  { id: "bosque", name: "Bosque", emoji: "🌳", image: bosque, color: "var(--arcade-green)", x: 26, y: 79, guardian: "hojito", gem: "#2fb765", particles: ["🍃", "🦋", "🌰"], ambient: [{ emoji: "🍃", kind: "fall" }, { emoji: "🦋", kind: "drift" }], terrain: "hierba", pedestal: "tocon", winsNeeded: 0 },
  { id: "nieve", name: "Montaña Nevada", emoji: "❄️", image: nieve, color: "#8fd8ff", x: 68, y: 63, guardian: "ballenin", gem: "#bfeaff", particles: ["❄️", "✨", "⛄"], ambient: [{ emoji: "❄️", kind: "fall" }, { emoji: "❄️", kind: "fall" }], terrain: "nieve", pedestal: "hielo", winsNeeded: 0 },
  { id: "volcan", name: "Volcán", emoji: "🌋", image: volcan, color: "var(--arcade-orange)", x: 28, y: 50, guardian: "lavito", gem: "#ff7a3d", particles: ["🔥", "✨", "💥"], ambient: [{ emoji: "💨", kind: "rise" }, { emoji: "🔥", kind: "rise" }], terrain: "roca", pedestal: "lava", winsNeeded: 0 },
  { id: "desierto", name: "Desierto", emoji: "🏜️", image: desierto, color: "#f6c85f", x: 66, y: 37, guardian: "cactino", gem: "#ffd83d", particles: ["🌵", "✨", "🪶"], ambient: [{ emoji: "🪶", kind: "drift" }, { emoji: "✨", kind: "rise" }], terrain: "arena", pedestal: "arenisca", winsNeeded: 0 },
  { id: "playa", name: "Playa", emoji: "🏖️", image: playa, color: "var(--arcade-blue)", x: 30, y: 27, guardian: "aquip", gem: "#3fc7ff", particles: ["🐚", "🫧", "🐟"], ambient: [{ emoji: "🫧", kind: "rise" }, { emoji: "🌊", kind: "drift" }], terrain: "arena", pedestal: "rocamar", winsNeeded: 0 },
  { id: "cielo", name: "Cielo", emoji: "☁️", image: cielo, color: "#cfe9ff", x: 66, y: 18, guardian: "buhito", gem: "#b98cff", particles: ["☁️", "🌈", "✨"], ambient: [{ emoji: "☁️", kind: "drift" }, { emoji: "✨", kind: "rise" }], terrain: "nube", pedestal: "nube", winsNeeded: 0 },
  { id: "castillo", name: "Islas del Cielo", emoji: "🏯", image: castillo, color: "var(--arcade-yellow)", x: 30, y: 13, guardian: "fenix", gem: "#ff8ad1", particles: ["👑", "✨", "🎉"], ambient: [{ emoji: "✨", kind: "rise" }, { emoji: "🕊️", kind: "drift" }], terrain: "nube", pedestal: "nube", winsNeeded: 0 },
  { id: "jefe", name: "Castillo Final", emoji: "🏰", image: jefe, color: "#7a2ff2", x: 52, y: 5, guardian: "estrelin", gem: "#ff4fd8", particles: ["💜", "⚡", "✨"], ambient: [{ emoji: "💜", kind: "rise" }, { emoji: "⚡", kind: "drift" }], terrain: "oscura", pedestal: "piedra", boss: true, winsNeeded: 0 },
];

export const GEM_ZONES = AREAS.filter((a) => !a.boss);



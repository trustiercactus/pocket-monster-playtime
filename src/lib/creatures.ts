import flami from "@/assets/flami.png";
import lavito from "@/assets/lavito.png";
import fenix from "@/assets/fenix.png";
import aquip from "@/assets/aquip.png";
import burbu from "@/assets/burbu.png";
import ballenin from "@/assets/ballenin.png";
import hojito from "@/assets/hojito.png";
import cactino from "@/assets/cactino.png";
import buhito from "@/assets/buhito.png";
import chispi from "@/assets/chispi.png";
import truenin from "@/assets/truenin.png";
import estrelin from "@/assets/estrelin.png";

export type ElementType = "fuego" | "agua" | "planta" | "rayo";

export type Creature = {
  id: string;
  name: string;
  type: ElementType;
  image: string;
  unlockLevel: number;
};

export const TYPE_EMOJI: Record<ElementType, string> = {
  fuego: "🔥",
  agua: "💧",
  planta: "🌿",
  rayo: "⚡",
};

export const TYPE_COLOR: Record<ElementType, string> = {
  fuego: "var(--arcade-orange)",
  agua: "var(--arcade-blue)",
  planta: "var(--arcade-green)",
  rayo: "var(--arcade-yellow)",
};

export const CREATURES: Creature[] = [
  { id: "flami", name: "Flami", type: "fuego", image: flami, unlockLevel: 1 },
  { id: "aquip", name: "Aquip", type: "agua", image: aquip, unlockLevel: 1 },
  { id: "hojito", name: "Hojito", type: "planta", image: hojito, unlockLevel: 1 },
  { id: "chispi", name: "Chispi", type: "rayo", image: chispi, unlockLevel: 2 },
  { id: "lavito", name: "Lavito", type: "fuego", image: lavito, unlockLevel: 3 },
  { id: "burbu", name: "Burbu", type: "agua", image: burbu, unlockLevel: 4 },
  { id: "cactino", name: "Cactino", type: "planta", image: cactino, unlockLevel: 5 },
  { id: "truenin", name: "Truenin", type: "rayo", image: truenin, unlockLevel: 6 },
  { id: "fenix", name: "Fenix", type: "fuego", image: fenix, unlockLevel: 7 },
  { id: "ballenin", name: "Ballenin", type: "agua", image: ballenin, unlockLevel: 8 },
  { id: "buhito", name: "Buhito", type: "planta", image: buhito, unlockLevel: 9 },
  { id: "estrelin", name: "Estrelin", type: "rayo", image: estrelin, unlockLevel: 10 },
];

export const getCreature = (id: string): Creature =>
  CREATURES.find((c) => c.id === id) ?? CREATURES[0];

export const XP_PER_LEVEL = 3;

export function nextUnlock(level: number): Creature | undefined {
  return CREATURES.find((c) => c.unlockLevel === level);
}

export function randomRival(exclude: string): Creature {
  const pool = CREATURES.filter((c) => c.id !== exclude);
  return pool[Math.floor(Math.random() * pool.length)];
}

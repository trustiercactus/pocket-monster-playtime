import { COLLECTION, type ElementType } from "@/lib/creatures";

export type EggElement = Extract<ElementType, "fuego" | "agua" | "planta">;

export type Egg = {
  id: string;
  element: EggElement;
  care: number;
};

/** Cariño necesario para que nazca. */
export const CARE_TO_HATCH = 8;

export const EGG_EMOJI: Record<EggElement, string> = {
  fuego: "🔥",
  agua: "💧",
  planta: "🌿",
};

export const EGG_COLOR: Record<EggElement, string> = {
  fuego: "var(--arcade-orange)",
  agua: "var(--arcade-blue)",
  planta: "var(--arcade-green)",
};

export type EggStage = "nuevo" | "grietas" | "mueve" | "brilla";

export function eggStage(care: number): EggStage {
  if (care >= 6) return "brilla";
  if (care >= 4) return "mueve";
  if (care >= 2) return "grietas";
  return "nuevo";
}

export const STAGE_CLASS: Record<EggStage, string> = {
  nuevo: "float-soft",
  grietas: "float-soft",
  mueve: "wiggle",
  brilla: "egg-glow",
};

const ELEMENTS: EggElement[] = ["fuego", "agua", "planta"];

export function randomEgg(): Egg {
  const element = ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)] as EggElement;
  return { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, element, care: 0 };
}

/** Criatura que nace del huevo: prioriza una que aún no se tenga de ese elemento. */
export function hatchFrom(element: EggElement, unlocked: string[]) {
  const sameType = CREATURES.filter((c) => c.type === element);
  const nueva = sameType.find((c) => !unlocked.includes(c.id));
  return nueva ?? sameType[0]!;
}

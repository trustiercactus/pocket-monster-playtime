import batPueblo from "@/assets/batalla-pueblo.jpg";
import batBosque from "@/assets/batalla-bosque.jpg";
import batNieve from "@/assets/batalla-nieve.jpg";
import batVolcan from "@/assets/batalla-volcan.jpg";
import batDesierto from "@/assets/batalla-desierto.jpg";
import batPlaya from "@/assets/batalla-playa.jpg";
import batCielo from "@/assets/batalla-cielo.jpg";
import batIslas from "@/assets/batalla-islas.jpg";
import batCastillo from "@/assets/batalla-castillo.jpg";

/**
 * Escenario de batalla propio de cada guardián.
 * guardianId → fondo de la pantalla de combate.
 * Se puede cambiar uno sin afectar a los demás.
 */
export const BATTLE_BACKGROUNDS: Record<string, string> = {
  chispi: batPueblo,
  hojito: batBosque,
  ballenin: batNieve,
  lavito: batVolcan,
  cactino: batDesierto,
  aquip: batPlaya,
  buhito: batCielo,
  fenix: batIslas,
  sombron: batCastillo,
};

/** fondo por defecto si algún guardián no tuviera escenario propio */
export const DEFAULT_BATTLE_BACKGROUND = batPueblo;

export function getBattleBackground(guardianId: string): string {
  return BATTLE_BACKGROUNDS[guardianId] ?? DEFAULT_BATTLE_BACKGROUND;
}

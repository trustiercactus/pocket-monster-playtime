import { useEffect, useRef, useState } from "react";
import type { Area } from "@/lib/areas";
import { getCreature } from "@/lib/creatures";
import { Gema } from "@/components/Gema";
import { GuardianSprite } from "@/components/GuardianSprite";
import { sfx } from "@/lib/audio";

/** partículas de ambiente del bioma, en grande y a pantalla completa */
function Particulas({ area }: { area: Area }) {
  const items = Array.from({ length: 9 }).map((_, i) => {
    const p = area.ambient[i % area.ambient.length]!;
    return { ...p, i };
  });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {items.map((p) => (
        <span
          key={p.i}
          className={`absolute text-2xl opacity-80 ${
            p.kind === "fall" ? "amb-fall" : p.kind === "rise" ? "amb-rise" : "amb-drift"
          }`}
          style={{
            left: `${6 + ((p.i * 37) % 88)}%`,
            top: `${10 + ((p.i * 53) % 70)}%`,
            animationDelay: `${p.i * 0.7}s`,
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
}

/**
 * Escenario completo de un mundo: fondo propio del bioma, vida ambiental,
 * guardián en el centro y un único botón gigante para luchar.
 */
export function Mundo({
  area,
  done,
  onFight,
  onMap,
}: {
  area: Area;
  done: boolean;
  onFight: () => void;
  onMap: () => void;
}) {
  const guardian = getCreature(area.guardian);
  /** el guardián se sorprende, se enfada y entonces empieza el combate */
  const [enfadado, setEnfadado] = useState(false);
  const salto = useRef<ReturnType<typeof setTimeout> | null>(null);

  const provocar = () => {
    if (enfadado) return;
    setEnfadado(true);
    sfx("tap");
    try {
      navigator.vibrate?.([20, 60, 40]);
    } catch {
      /* sin vibración */
    }
    setTimeout(() => sfx("jefe"), 220);
    salto.current = setTimeout(onFight, 1500);
  };

  useEffect(
    () => () => {
      if (salto.current) clearTimeout(salto.current);
    },
    [],
  );

  useEffect(() => {
    try {
      navigator.vibrate?.(25);
    } catch {
      /* sin vibración */
    }
  }, [area.id]);

  return (
    <div className="scene-in fixed inset-0 z-0 overflow-hidden bg-sky">
      <img
        src={area.scene}
        alt=""
        width={768}
        height={1344}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <span
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.35), transparent)" }}
        aria-hidden="true"
      />

      <Particulas area={area} />

      {/* volver al mapa general */}
      <button
        onClick={() => {
          sfx("tap");
          onMap();
        }}
        aria-label="Ver el mapa"
        className="btn-bounce btn-3d absolute left-3 top-3 z-20 grid h-14 w-14 place-items-center rounded-full border-[3px] border-white bg-[var(--arcade-orange)] text-3xl shadow-[0_5px_0_rgba(0,0,0,0.35)]"
      >
        🗺️
      </button>

      {/* nombre del mundo */}
      <div className="pointer-events-none absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-full border-4 border-white/90 bg-ink/80 px-5 py-1 text-xl font-black text-white shadow-[0_4px_0_rgba(0,0,0,0.35)]">
        {area.emoji} {area.name}
      </div>

      {/* oscurecimiento suave del ambiente durante la transformación */}
      {enfadado && (
        <span
          className="rage-dark pointer-events-none absolute inset-0 z-[5]"
          style={{
            background:
              "radial-gradient(circle at 50% 36%, transparent 20%, rgba(10,4,24,0.45) 70%, rgba(8,3,20,0.6))",
          }}
          aria-hidden="true"
        />
      )}

      {/* guardián del mundo */}
      <div className="absolute inset-x-0 top-[38%] z-10 flex -translate-y-1/2 flex-col items-center">
        <button
          onClick={provocar}
          aria-label={`Despertar a ${guardian.name}`}
          className="relative grid place-items-center"
        >
          {enfadado && (
            <span className="pop-in pointer-events-none absolute -right-4 -top-6 z-20 text-5xl drop-shadow">
              💢
            </span>
          )}
          <span className={enfadado ? "guard-angry block" : "block"}>
            <GuardianSprite
              src={guardian.image}
              alt={guardian.name}
              motion="float"
              enraged={enfadado}
              boss={area.boss}
              className={`object-contain drop-shadow-[0_10px_10px_rgba(0,0,0,0.45)] ${
                area.boss ? "h-56 w-56" : "h-40 w-40"
              }`}
            />
          </span>
          {done && !enfadado && (
            <span className="pop-in absolute -right-2 -top-2 text-4xl drop-shadow">😊</span>
          )}
        </button>

        <span
          className="mt-1 h-4 w-32 rounded-[50%] blur-[4px]"
          style={{ background: "rgba(0,0,0,0.3)" }}
          aria-hidden="true"
        />
        <span className="mt-2">
          <Gema color={area.gem} cut={area.gemCut} size={34} spin={!done} />
        </span>
      </div>

      {/* acción única */}
      <div className="absolute inset-x-0 bottom-10 flex justify-center">
        <button
          onClick={provocar}
          disabled={enfadado}
          aria-label={`Luchar en ${area.name}`}
          className="btn-bounce btn-pulse rounded-[2.5rem] border-4 border-white bg-[var(--arcade-orange)] px-14 py-6 text-6xl shadow-[0_10px_0_rgba(0,0,0,0.3)]"
        >
          ⚔️
        </button>
      </div>
    </div>
  );
}

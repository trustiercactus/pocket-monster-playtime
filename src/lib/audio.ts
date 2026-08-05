/**
 * Motor de audio de Criaturitas.
 * - Música procedural por pantalla (xilófono, ukelele, flauta, campanas).
 * - Efectos de sonido suaves y simpáticos.
 * - Narrador con voz neuronal (TTS) y ducking automático de la música.
 */

const OPTS_KEY = "criaturitas-opciones";

export type Opciones = {
  musica: boolean;
  efectos: boolean;
  narrador: boolean;
  vibracion: boolean;
};

export const OPTS_DEFAULT: Opciones = {
  musica: true,
  efectos: true,
  narrador: true,
  vibracion: true,
};

let opciones: Opciones = { ...OPTS_DEFAULT };
const listeners = new Set<(o: Opciones) => void>();

export function loadOpciones(): Opciones {
  if (typeof window === "undefined") return opciones;
  try {
    const raw = window.localStorage.getItem(OPTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Opciones> & { sonidos?: boolean };
      opciones = {
        ...OPTS_DEFAULT,
        ...parsed,
        efectos: parsed.efectos ?? parsed.sonidos ?? true,
      };
    }
  } catch {
    /* sin guardado */
  }
  return opciones;
}

export function getOpciones(): Opciones {
  return opciones;
}

export function setOpcion(key: keyof Opciones, value: boolean) {
  opciones = { ...opciones, [key]: value };
  try {
    window.localStorage.setItem(OPTS_KEY, JSON.stringify(opciones));
  } catch {
    /* sin guardado */
  }
  if (key === "musica") {
    if (value) resumeMusic();
    else stopMusic();
  }
  if (key === "narrador" && !value) stopNarrator();
  listeners.forEach((l) => l(opciones));
}

export function onOpciones(fn: (o: Opciones) => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/* ------------------------------------------------------------------ */
/* Contexto de audio                                                   */
/* ------------------------------------------------------------------ */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicBus: GainNode | null = null;
let sfxBus: GainNode | null = null;

const MUSIC_VOL = 0.24;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    ctx = new Ctx();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
    musicBus = ctx.createGain();
    musicBus.gain.value = MUSIC_VOL;
    musicBus.connect(master);
    sfxBus = ctx.createGain();
    sfxBus.gain.value = 0.75;
    sfxBus.connect(master);
  } catch {
    return null;
  }
  return ctx;
}

/** desbloquea el audio en el primer toque del niño */
export function unlockAudio() {
  const c = audio();
  if (c && c.state === "suspended") void c.resume().catch(() => {});
}

if (typeof window !== "undefined") {
  const once = () => {
    unlockAudio();
    resumeMusic();
  };
  window.addEventListener("pointerdown", once, { passive: true });
  window.addEventListener("keydown", once);
}

/* ------------------------------------------------------------------ */
/* Instrumentos                                                        */
/* ------------------------------------------------------------------ */

type Voice = "xilofono" | "ukelele" | "flauta" | "campana" | "arpa" | "bajo" | "coro";

const VOICE: Record<Voice, { type: OscillatorType; attack: number; decay: number; gain: number }> =
  {
    xilofono: { type: "sine", attack: 0.004, decay: 0.42, gain: 0.5 },
    ukelele: { type: "triangle", attack: 0.006, decay: 0.34, gain: 0.34 },
    flauta: { type: "sine", attack: 0.09, decay: 0.55, gain: 0.3 },
    campana: { type: "sine", attack: 0.005, decay: 1.5, gain: 0.28 },
    arpa: { type: "triangle", attack: 0.005, decay: 1.1, gain: 0.3 },
    bajo: { type: "triangle", attack: 0.02, decay: 0.5, gain: 0.32 },
    coro: { type: "sine", attack: 0.35, decay: 1.8, gain: 0.16 },
  };

function note(
  dest: AudioNode,
  freq: number,
  at: number,
  dur: number,
  voice: Voice,
  vol = 1,
) {
  const c = ctx;
  if (!c) return;
  const cfg = VOICE[voice];
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = cfg.type;
  o.frequency.setValueAtTime(freq, at);
  const peak = Math.max(0.0002, cfg.gain * vol);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(peak, at + cfg.attack);
  g.gain.exponentialRampToValueAtTime(0.0001, at + Math.max(cfg.decay, dur));
  o.connect(g).connect(dest);
  o.start(at);
  o.stop(at + Math.max(cfg.decay, dur) + 0.05);

  // armónico brillante de juguete
  if (voice === "xilofono" || voice === "campana") {
    const o2 = c.createOscillator();
    const g2 = c.createGain();
    o2.type = "sine";
    o2.frequency.setValueAtTime(freq * (voice === "campana" ? 2.76 : 3.01), at);
    g2.gain.setValueAtTime(0.0001, at);
    g2.gain.exponentialRampToValueAtTime(peak * 0.22, at + 0.01);
    g2.gain.exponentialRampToValueAtTime(0.0001, at + cfg.decay * 0.7);
    o2.connect(g2).connect(dest);
    o2.start(at);
    o2.stop(at + cfg.decay + 0.05);
  }
}

/** nombre de nota -> frecuencia */
const SEMI: Record<string, number> = {
  C: 0,
  "C#": 1,
  D: 2,
  "D#": 3,
  E: 4,
  F: 5,
  "F#": 6,
  G: 7,
  "G#": 8,
  A: 9,
  "A#": 10,
  B: 11,
};

function f(n: string): number {
  const m = /^([A-G]#?)(\d)$/.exec(n);
  if (!m) return 440;
  const semis = (SEMI[m[1] as string] ?? 0) + (Number(m[2]) + 1) * 12;
  return 440 * Math.pow(2, (semis - 69) / 12);
}

/* ------------------------------------------------------------------ */
/* Música por pantalla                                                 */
/* ------------------------------------------------------------------ */

export type Scene = "inicio" | "mapa" | "combate" | "final" | null;

type Track = { beat: number; bars: number; play: (t0: number, dest: AudioNode) => void };

/** patrón: [nota, tiempo(beats), duración(beats)] */
type Pat = Array<[string, number, number]>;

function seq(dest: AudioNode, t0: number, beat: number, voice: Voice, pat: Pat, vol = 1) {
  pat.forEach(([n, b, d]) => note(dest, f(n), t0 + b * beat, d * beat, voice, vol));
}

/* --- INICIO: alegre, mágica, pegadiza (xilófono + ukelele + flauta + campanas) --- */
const inicioMel: Pat = [
  ["G5", 0, 0.5], ["E5", 0.5, 0.5], ["C5", 1, 0.5], ["E5", 1.5, 0.5],
  ["G5", 2, 0.5], ["A5", 2.5, 0.5], ["G5", 3, 1],
  ["F5", 4, 0.5], ["A5", 4.5, 0.5], ["G5", 5, 0.5], ["E5", 5.5, 0.5],
  ["D5", 6, 1], ["E5", 7, 1],
  ["C6", 8, 0.5], ["B5", 8.5, 0.5], ["A5", 9, 0.5], ["G5", 9.5, 0.5],
  ["A5", 10, 1], ["G5", 11, 1],
  ["E5", 12, 0.5], ["G5", 12.5, 0.5], ["C6", 13, 1], ["G5", 14, 2],
];
const inicioUku: Pat = [
  ["C4", 0, 0.4], ["E4", 0.5, 0.4], ["G4", 1, 0.4], ["E4", 1.5, 0.4],
  ["F4", 2, 0.4], ["A4", 2.5, 0.4], ["C5", 3, 0.4], ["A4", 3.5, 0.4],
  ["D4", 4, 0.4], ["F4", 4.5, 0.4], ["A4", 5, 0.4], ["F4", 5.5, 0.4],
  ["G4", 6, 0.4], ["B4", 6.5, 0.4], ["D5", 7, 0.4], ["B4", 7.5, 0.4],
  ["C4", 8, 0.4], ["E4", 8.5, 0.4], ["G4", 9, 0.4], ["E4", 9.5, 0.4],
  ["A3", 10, 0.4], ["C4", 10.5, 0.4], ["E4", 11, 0.4], ["C4", 11.5, 0.4],
  ["F4", 12, 0.4], ["A4", 12.5, 0.4], ["G4", 13, 0.4], ["B4", 13.5, 0.4],
  ["C4", 14, 0.4], ["G4", 14.5, 0.4], ["C5", 15, 0.8],
];
const inicioCamp: Pat = [
  ["C6", 0, 2], ["A5", 4, 2], ["G5", 8, 2], ["C6", 12, 2],
];

/* --- MAPA: relajada, exploración, flauta y campanas suaves --- */
const mapaMel: Pat = [
  ["E5", 0, 1.5], ["G5", 1.5, 1], ["A5", 2.5, 1.5],
  ["G5", 4, 1], ["E5", 5, 1], ["D5", 6, 2],
  ["C5", 8, 1.5], ["E5", 9.5, 1], ["G5", 10.5, 1.5],
  ["A5", 12, 2], ["G5", 14, 2],
];
const mapaPad: Pat = [
  ["C4", 0, 4], ["G4", 0, 4],
  ["A3", 4, 4], ["E4", 4, 4],
  ["F3", 8, 4], ["C4", 8, 4],
  ["G3", 12, 4], ["D4", 12, 4],
];
const mapaCamp: Pat = [["C6", 2, 1], ["G5", 6.5, 1], ["E6", 10, 1], ["A5", 14.5, 1]];

/* --- COMBATE: dinámica y alegre, nunca agresiva --- */
const combMel: Pat = [
  ["G5", 0, 0.5], ["G5", 0.75, 0.25], ["A5", 1, 0.5], ["B5", 1.5, 0.5],
  ["C6", 2, 0.5], ["B5", 2.5, 0.5], ["A5", 3, 1],
  ["E5", 4, 0.5], ["G5", 4.5, 0.5], ["A5", 5, 0.5], ["G5", 5.5, 0.5],
  ["E5", 6, 1], ["D5", 7, 1],
  ["F5", 8, 0.5], ["A5", 8.5, 0.5], ["C6", 9, 0.5], ["A5", 9.5, 0.5],
  ["G5", 10, 1], ["B5", 11, 1],
  ["C6", 12, 0.5], ["E6", 12.5, 0.5], ["D6", 13, 0.5], ["B5", 13.5, 0.5],
  ["C6", 14, 2],
];
const combBajo: Pat = [
  ["C3", 0, 0.5], ["C3", 1, 0.5], ["G3", 2, 0.5], ["C3", 3, 0.5],
  ["A2", 4, 0.5], ["A2", 5, 0.5], ["E3", 6, 0.5], ["A2", 7, 0.5],
  ["F2", 8, 0.5], ["F2", 9, 0.5], ["C3", 10, 0.5], ["F2", 11, 0.5],
  ["G2", 12, 0.5], ["G2", 13, 0.5], ["D3", 14, 0.5], ["G2", 15, 0.5],
];

/* --- FINAL: fanfarria de celebración --- */
const finalMel: Pat = [
  ["C5", 0, 0.5], ["E5", 0.5, 0.5], ["G5", 1, 0.5], ["C6", 1.5, 1],
  ["B5", 3, 0.5], ["C6", 3.5, 1.5],
  ["A5", 5, 0.5], ["C6", 5.5, 0.5], ["E6", 6, 2],
  ["D6", 8, 0.5], ["C6", 8.5, 0.5], ["G5", 9, 1], ["A5", 10, 1], ["C6", 11, 1],
  ["G5", 12, 0.5], ["C6", 12.5, 0.5], ["E6", 13, 3],
];
const finalCamp: Pat = [["C6", 0, 2], ["E6", 4, 2], ["G6", 8, 2], ["C6", 12, 3]];

const TRACKS: Record<Exclude<Scene, null>, Track> = {
  inicio: {
    beat: 0.34,
    bars: 16,
    play: (t, d) => {
      seq(d, t, 0.34, "xilofono", inicioMel);
      seq(d, t, 0.34, "ukelele", inicioUku, 0.85);
      seq(d, t, 0.34, "campana", inicioCamp, 0.7);
      seq(d, t, 0.34, "flauta", inicioMel.filter((_, i) => i % 3 === 0), 0.5);
    },
  },
  mapa: {
    beat: 0.46,
    bars: 16,
    play: (t, d) => {
      seq(d, t, 0.46, "flauta", mapaMel, 0.9);
      seq(d, t, 0.46, "arpa", mapaPad, 0.5);
      seq(d, t, 0.46, "campana", mapaCamp, 0.5);
    },
  },
  combate: {
    beat: 0.3,
    bars: 16,
    play: (t, d) => {
      seq(d, t, 0.3, "xilofono", combMel, 0.95);
      seq(d, t, 0.3, "bajo", combBajo, 0.8);
      seq(d, t, 0.3, "ukelele", combBajo, 0.4);
    },
  },
  final: {
    beat: 0.36,
    bars: 16,
    play: (t, d) => {
      seq(d, t, 0.36, "xilofono", finalMel);
      seq(d, t, 0.36, "campana", finalCamp, 0.8);
      seq(d, t, 0.36, "flauta", finalMel, 0.45);
      seq(d, t, 0.36, "coro", finalCamp, 0.6);
    },
  },
};

let scene: Scene = null;
let loopTimer: number | null = null;

function scheduleLoop() {
  const c = audio();
  if (!c || !musicBus || !scene || !opciones.musica) return;
  const track = TRACKS[scene];
  const len = track.beat * track.bars;
  const start = c.currentTime + 0.08;
  track.play(start, musicBus);
  loopTimer = window.setTimeout(scheduleLoop, len * 1000 - 60);
}

export function playMusic(next: Scene) {
  if (scene === next) return;
  scene = next;
  if (loopTimer) window.clearTimeout(loopTimer);
  loopTimer = null;
  if (!next || !opciones.musica) return;
  unlockAudio();
  scheduleLoop();
}

function resumeMusic() {
  if (!scene || loopTimer || !opciones.musica) return;
  scheduleLoop();
}

function stopMusic() {
  if (loopTimer) window.clearTimeout(loopTimer);
  loopTimer = null;
}

/** silencio dramático antes de un momento mágico */
export function musicPause(ms = 500) {
  const c = audio();
  if (!c || !musicBus) return;
  musicBus.gain.cancelScheduledValues(c.currentTime);
  musicBus.gain.setValueAtTime(0.0001, c.currentTime);
  musicBus.gain.linearRampToValueAtTime(MUSIC_VOL, c.currentTime + ms / 1000 + 0.6);
}

function duck(on: boolean) {
  const c = audio();
  if (!c || !musicBus) return;
  const target = on ? MUSIC_VOL * 0.22 : MUSIC_VOL;
  musicBus.gain.cancelScheduledValues(c.currentTime);
  musicBus.gain.setTargetAtTime(target, c.currentTime, on ? 0.08 : 0.35);
}

/* ------------------------------------------------------------------ */
/* Efectos de sonido                                                   */
/* ------------------------------------------------------------------ */

export type Sfx =
  | "tap"
  | "abrir"
  | "cerrar"
  | "turno"
  | "ataque"
  | "dano"
  | "curar"
  | "cargar"
  | "super"
  | "esmeralda"
  | "desbloqueo"
  | "aurora"
  | "jefe"
  | "celebracion"
  | "confeti"
  | "fuego";

function noiseBurst(dur: number, vol: number, freq: number) {
  const c = ctx;
  if (!c || !sfxBus) return;
  const frames = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, frames, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames) ** 2;
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = freq;
  filter.Q.value = 0.8;
  const g = c.createGain();
  g.gain.value = vol;
  src.connect(filter).connect(g).connect(sfxBus);
  src.start();
}

export function sfx(kind: Sfx) {
  if (!opciones.efectos) return;
  const c = audio();
  if (!c || !sfxBus) return;
  if (c.state === "suspended") void c.resume().catch(() => {});
  const t = c.currentTime;
  const d = sfxBus;

  switch (kind) {
    case "tap":
      note(d, f("E6"), t, 0.1, "xilofono", 0.55);
      note(d, f("B6"), t + 0.05, 0.1, "xilofono", 0.3);
      break;
    case "abrir":
      ["C5", "E5", "G5", "C6"].forEach((n, i) => note(d, f(n), t + i * 0.05, 0.2, "xilofono", 0.45));
      break;
    case "turno":
      ["G5", "C6", "E6"].forEach((n, i) => note(d, f(n), t + i * 0.08, 0.28, "campana", 0.45));
      break;
    case "cerrar":
      ["C6", "G5", "E5"].forEach((n, i) => note(d, f(n), t + i * 0.05, 0.2, "ukelele", 0.45));
      break;
    case "ataque":
      noiseBurst(0.18, 0.16, 1400);
      note(d, f("A4"), t, 0.14, "ukelele", 0.7);
      note(d, f("E5"), t + 0.06, 0.14, "xilofono", 0.5);
      break;
    case "dano":
      note(d, f("D4"), t, 0.2, "ukelele", 0.6);
      note(d, f("A3"), t + 0.08, 0.25, "bajo", 0.6);
      noiseBurst(0.14, 0.1, 500);
      break;
    case "curar":
      ["G5", "B5", "D6", "G6"].forEach((n, i) =>
        note(d, f(n), t + i * 0.07, 0.4, "arpa", 0.6),
      );
      break;
    case "cargar":
      note(d, f("C5"), t, 0.2, "campana", 0.35);
      note(d, f("G5"), t + 0.08, 0.3, "campana", 0.35);
      break;
    case "super":
      ["C5", "E5", "G5", "C6", "E6", "G6"].forEach((n, i) =>
        note(d, f(n), t + i * 0.045, 0.35, "xilofono", 0.7),
      );
      note(d, f("C4"), t, 0.5, "bajo", 0.7);
      noiseBurst(0.3, 0.14, 2400);
      break;
    case "esmeralda":
      ["E6", "G6", "B6"].forEach((n, i) => note(d, f(n), t + i * 0.1, 0.6, "campana", 0.6));
      break;
    case "desbloqueo":
      ["C5", "E5", "G5", "C6"].forEach((n, i) =>
        note(d, f(n), t + i * 0.11, 0.5, "xilofono", 0.7),
      );
      note(d, f("C6"), t + 0.5, 1, "campana", 0.5);
      break;
    case "aurora":
      ["C5", "E5", "G5", "B5", "D6", "G6", "C7"].forEach((n, i) =>
        note(d, f(n), t + i * 0.11, 1.2, "arpa", 0.7),
      );
      ["C5", "G5"].forEach((n, i) => note(d, f(n), t + 0.3 + i * 0.2, 2.4, "coro", 0.9));
      note(d, f("C6"), t + 0.9, 2, "campana", 0.8);
      break;
    case "jefe":
      note(d, f("C3"), t, 0.9, "bajo", 0.9);
      noiseBurst(0.8, 0.16, 260);
      ["G5", "C6", "E6"].forEach((n, i) => note(d, f(n), t + 0.7 + i * 0.13, 0.8, "campana", 0.6));
      break;
    case "celebracion":
      ["C5", "E5", "G5", "C6", "G5", "C6", "E6"].forEach((n, i) =>
        note(d, f(n), t + i * 0.13, 0.5, "xilofono", 0.75),
      );
      note(d, f("C6"), t + 1, 1.6, "campana", 0.7);
      break;
    case "confeti":
      for (let i = 0; i < 5; i++)
        note(d, f(["C6", "E6", "G6", "A6", "D6"][i] as string), t + i * 0.06, 0.18, "xilofono", 0.4);
      break;
    case "fuego":
      noiseBurst(0.5, 0.12, 900);
      note(d, f("G4"), t, 0.3, "bajo", 0.4);
      ["C6", "G6", "E6"].forEach((n, i) => note(d, f(n), t + 0.15 + i * 0.07, 0.4, "campana", 0.4));
      break;
  }

  if (opciones.vibracion && typeof navigator !== "undefined" && navigator.vibrate) {
    const strong: Sfx[] = ["super", "jefe", "aurora", "dano"];
    try {
      navigator.vibrate(strong.includes(kind) ? 40 : 12);
    } catch {
      /* sin vibración */
    }
  }
}

/* ------------------------------------------------------------------ */
/* Narrador (voz neuronal)                                             */
/* ------------------------------------------------------------------ */

const voiceCache = new Map<string, string>();
let current: HTMLAudioElement | null = null;
let pending: number | null = null;
const said = new Set<string>();

export function stopNarrator() {
  if (pending) {
    window.clearTimeout(pending);
    pending = null;
  }
  if (current) {
    current.pause();
    current = null;
  }
  duck(false);
}

/** el niño siempre manda: al tocar cualquier botón, el narrador calla */
if (typeof window !== "undefined") {
  window.addEventListener(
    "pointerdown",
    (e) => {
      const t = e.target as HTMLElement | null;
      if (t && t.closest("button,[role='button'],a")) stopNarrator();
    },
    { capture: true, passive: true },
  );
}

/**
 * Narra una frase con voz neuronal cálida.
 * `once` evita repetir la misma frase en la misma sesión.
 * `delay` espera a que termine la animación antes de hablar (300-500 ms).
 */
export async function narrar(text: string, opts: { once?: string; delay?: number } = {}) {
  if (!opciones.narrador || typeof window === "undefined") return;
  if (opts.once) {
    if (said.has(opts.once)) return;
    said.add(opts.once);
  }
  if (opts.delay && opts.delay > 0) {
    const ms = opts.delay;
    const { delay: _d, ...rest } = opts;
    if (pending) window.clearTimeout(pending);
    pending = window.setTimeout(() => {
      pending = null;
      void narrar(text, rest);
    }, ms);
    return;
  }
  try {
    let url = voiceCache.get(text);
    if (!url) {
      const res = await fetch("/api/narrador", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      url = URL.createObjectURL(blob);
      voiceCache.set(text, url);
    }
    if (!opciones.narrador) return;
    stopNarrator();
    const el = new Audio(url);
    el.volume = 1;
    current = el;
    duck(true);
    el.onended = () => {
      if (current === el) current = null;
      duck(false);
    };
    el.onerror = () => duck(false);
    await el.play().catch(() => duck(false));
  } catch {
    duck(false);
  }
}


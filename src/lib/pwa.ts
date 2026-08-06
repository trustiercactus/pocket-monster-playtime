/**
 * Utilidades PWA: detectar si la app ya está instalada / abierta desde el icono
 * y evitar cualquier aviso de instalación en ese caso.
 */

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const mm =
    typeof window.matchMedia === "function" &&
    (window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      window.matchMedia("(display-mode: minimal-ui)").matches);
  // iOS Safari
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  // lanzada con ?source=pwa u origen de app instalada
  const fromApp = new URLSearchParams(window.location.search).get("mode") === "standalone";
  return Boolean(mm || iosStandalone || fromApp);
}

/**
 * Bloquea el prompt de instalación cuando la app ya está instalada
 * (abierta desde el icono). Devuelve la función de limpieza.
 */
export function guardInstallPrompt(): () => void {
  if (typeof window === "undefined") return () => {};

  const onBeforeInstall = (e: Event) => {
    if (isStandalone()) {
      // ya instalada: nada de diálogos ni banners
      e.preventDefault();
      (e as Event & { stopImmediatePropagation?: () => void }).stopImmediatePropagation?.();
    }
  };

  const onInstalled = () => {
    try {
      window.localStorage.setItem("criaturitas-pwa-instalada", "1");
    } catch {
      /* sin guardado */
    }
  };

  window.addEventListener("beforeinstallprompt", onBeforeInstall);
  window.addEventListener("appinstalled", onInstalled);
  return () => {
    window.removeEventListener("beforeinstallprompt", onBeforeInstall);
    window.removeEventListener("appinstalled", onInstalled);
  };
}

import { createFileRoute } from "@tanstack/react-router";
import { Game } from "@/components/Game";

export const Route = createFileRoute("/invitado")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Jugar como invitado — Criaturitas" },
      {
        name: "description",
        content: "Prueba Criaturitas sin registrarte: batallas por turnos con botones enormes.",
      },
      { property: "og:title", content: "Jugar como invitado — Criaturitas" },
      { property: "og:description", content: "Juega sin cuenta, el progreso se guarda en el aparato." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <Game mode="invitado" />,
});

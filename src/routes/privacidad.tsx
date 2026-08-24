import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacidad")({
  head: () => ({
    meta: [
      { title: "Política de Privacidad — Criaturitas" },
      {
        name: "description",
        content: "Política de Privacidad del juego Criaturitas.",
      },
      { property: "og:title", content: "Política de Privacidad — Criaturitas" },
      {
        property: "og:description",
        content: "Información sobre privacidad y tratamiento de datos en Criaturitas.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: PrivacyPolicy,
});

function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-background px-5 py-10 text-foreground">
      <article className="mx-auto max-w-3xl rounded-3xl bg-white p-6 shadow-lg sm:p-10">
        <header className="border-b border-border pb-6">
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            Política de Privacidad de Criaturitas
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Última actualización: 24 de agosto de 2026
          </p>
        </header>

        <div className="mt-8 space-y-8 leading-7">
          <section>
            <h2 className="text-xl font-bold">1. Información general</h2>
            <p className="mt-2">
              Criaturitas es un juego que no requiere crear una cuenta ni iniciar sesión. El juego
              no contiene publicidad, compras, compras dentro de la aplicación ni servicios de
              analítica.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">2. Información guardada en el dispositivo</h2>
            <p className="mt-2">
              El nombre elegido por el jugador, el progreso de la partida y sus preferencias se
              guardan únicamente de forma local en el dispositivo. Esta información permite
              continuar la partida y conservar los ajustes del juego.
            </p>
            <p className="mt-2">
              Criaturitas no utiliza esta información para crear perfiles de usuario, realizar
              seguimiento, mostrar publicidad personalizada ni analizar el comportamiento del
              jugador.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">3. Narraciones de voz</h2>
            <p className="mt-2">
              Para generar algunas narraciones de voz, determinadas frases internas del juego se
              envían mediante una conexión segura HTTPS a Lovable AI Gateway. Estas frases forman
              parte del contenido de Criaturitas y no incluyen el nombre elegido por el jugador ni
              otros datos personales.
            </p>
            <p className="mt-2">
              Al realizar esta conexión puede existir el procesamiento técnico de red estrictamente
              necesario para prestar el servicio, como la transmisión de la solicitud y de los
              datos técnicos asociados a la conexión.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">4. Publicidad, compras y analítica</h2>
            <p className="mt-2">
              Criaturitas no incluye anuncios ni SDK publicitarios, no permite realizar compras o
              pagos y no utiliza Google Analytics, Firebase Analytics ni otros servicios de
              analítica o seguimiento.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">5. Eliminación del progreso</h2>
            <p className="mt-2">
              El usuario puede borrar el progreso guardado localmente mediante la opción de
              reiniciar la partida disponible en el juego.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">6. Cambios en esta política</h2>
            <p className="mt-2">
              Esta Política de Privacidad puede actualizarse si cambia el funcionamiento de
              Criaturitas o la forma en que se trata la información. La versión publicada en esta
              página indicará la fecha de su última actualización.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">7. Contacto</h2>
            <p className="mt-2">
              Para cualquier consulta sobre esta Política de Privacidad, puedes escribir a:
            </p>
            <p className="mt-2 font-semibold">trustiergames@gmail.com</p>
          </section>
        </div>

        <footer className="mt-10 border-t border-border pt-6">
          <Link to="/" className="font-semibold text-primary underline underline-offset-4">
            Volver a Criaturitas
          </Link>
        </footer>
      </article>
    </main>
  );
}

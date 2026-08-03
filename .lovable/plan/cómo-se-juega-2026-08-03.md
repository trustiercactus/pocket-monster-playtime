- Juego de criaturas por turnos para niños de 4 años

Un juego muy simple, tipo Pokémon pero con criaturas originales, botones enormes, casi sin texto y colores arcade muy vivos (naranja, amarillo, azul, verde).

## Cómo se juega

1. **Inicio**: pantalla con una única acción gigante: un botón "¡LUCHAR!" con una criatura animada. Debajo, un botón grande con la mochila de criaturas.
2. **Combate por turnos**: tu criatura a la izquierda, la rival a la derecha, barras de vida en forma de corazones grandes de colores.
  - Solo 3 botones enormes con icono + color (ataque fuerte, ataque rápido, curarse). Sin números ni menús.
  - El turno rival ocurre solo, con animación y sonido, sin que el niño tenga que hacer nada.
  - Nadie "pierde" de forma dura: si tu criatura se cansa, aparece una pantalla amable y se puede volver a intentar con un botón gigante.
3. **Recompensa**: al ganar, animación de estrellas, la barra de nivel se llena y de vez en cuando aparece una criatura nueva desbloqueada (huevo que se abre).
4. **Mochila**: cuadrícula de criaturas con las desbloqueadas en color y las bloqueadas en silueta. Se toca una para elegirla como compañera.

## Criaturas

12 criaturas originales (diseño propio, sin usar nombres ni imágenes oficiales de Pokémon), cada una con un color y un tipo simple representado por icono: fuego, agua, planta, rayo. Las ventajas de tipo existen pero no se explican con texto: solo un efecto visual "¡súper!" cuando el ataque es fuerte.

Empiezas con 3 desbloqueadas y vas ganando el resto al subir de nivel (nivel 1 al 10).

## Cuenta y progreso en la nube

- Se activa Lovable Cloud (base de datos + cuentas).
- **Login para adultos**: email y contraseña, más "Entrar con Google". Pantalla sencilla y aparte del juego, pensada para el padre/madre.
- Tras entrar, se crea el perfil del niño (nombre y avatar de criatura). El progreso —nivel, experiencia, criaturas desbloqueadas y compañero elegido— se guarda en la nube y se recupera en cualquier dispositivo.

## Diseño

- Paleta arcade brillante: naranja #ff5722, amarillo #ffeb3b, azul #29b6f6, verde #66bb6a, sobre fondos limpios con bordes gruesos y esquinas muy redondeadas.
- Tipografía redonda y muy grande, tocar cualquier botón siempre por encima de ~80px de alto.
- Animaciones de rebote, sacudida al golpear, estrellas al ganar. Todo en móvil vertical primero.
- Sin texto explicativo: iconos, colores y animación.

## Detalles técnicos

- Rutas: `/` (inicio del juego), `/batalla`, `/criaturas`, `/auth`; zona de juego bajo el layout autenticado.
- Cloud: tablas `profiles` (nombre, avatar) y `game_progress` (nivel, exp, criaturas desbloqueadas, compañero) con RLS por `auth.uid()` y grants; trigger que crea el perfil al registrarse.
- Lógica de combate en el cliente (React state, sin backend por turno); solo se guarda el resultado del combate en la nube al terminar.
- Arte de las criaturas: ilustraciones generadas con estilo consistente, guardadas en `src/assets`.
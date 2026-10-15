# Tickle Beach World — lo pedido, lo hecho y lo pendiente

Actualizado: 15 de octubre de 2026.
Juego publicado (privado): https://claude.ai/artifact/DFWbM9YVoEYorTiuTKEBE4 — versión publicada 48.
Código en GitHub (privado): https://github.com/Pablo0004/tickle-beach-world — en inglés: `README.md` (el juego completo) y `PENDING.md` (lo pendiente).

---

## 1. Pendiente, en el orden acordado

**Pregunta abierta sobre las olas**: quité las olas que salían en la desembocadura de los ríos (canales entre regiones). Si con "olas en los ríos y el lago" te referías a otra cosa (por ejemplo, las franjas oscuras del fondo escalonado que se ven a través del agua), dímelo y lo cambio.

**EN CURSO (15 de octubre): punto 11 programado y probado en parte, SIN PUBLICAR** (el juego publicado sigue en la 48; en local ?v=226).
- Hecho: el mapa se genera por poseedor: 93 fincas (desde 20 Tickles: mansión del poseedor en el centro y una casa por Tickle), 254 mansiones (de 5 a 19 Tickles, todos bajo un techo, más grande cuantos más) y 60 pueblos de pequeños poseedores (cada hogar de 1 a 4 Tickles en su casa; las de 3-4, de dos plantas). Reparto exacto por regiones (~1.605 Tickles y 67-69 sitios en cada una), sin solapes; caben todas las minas, gremios, casinos y guaridas. Cada sitio es su propio clan (alianzas, rivalidades, incursiones y ayuda en comida entre sitios). Interiores con una cama para cada uno (hasta 19 en una mansión). Pestaña Holders con botón para ir al sitio de cada poseedor. Las partidas viejas conservan el progreso de cada Tickle y reinician lo de los pueblos antiguos.
- Probado: generación, vistas de finca/mansión/pueblo, un día simulado sin errores.
- **Falta**: comprobar por dentro una mansión y una casa compartida, la migración con una partida real, y publicar la versión 49.
- **Tus requisitos nuevos (15 de octubre)**:
  - **Que se pueda actualizar a menudo**, porque los poseedores cambian con frecuencia. Diseño en marcha (parche preparado, aún sin aplicar): parcelas fijas que no dependen de quién es dueño (en cada región 18 de finca con capacidades 400, 170, 120, 90, 70, 60, 50, 44, 38, 34, 30, 28, 26, 24, 24, 22, 22, 22; 48 de mansión; 13 de pueblo de 36 Tickles). Quién vive en cada una se guarda en la partida: al cambiar la propiedad, quien sigue cabiendo conserva su parcela; solo se mueve quien crece o mengua de categoría; los nuevos ocupan parcelas libres; las vacías quedan "en venta". Las casas se generan al final y cada hogar tiene su hueco fijo; los datos de cada sitio (comida, relaciones, ruinas, mejoras de casa…) se trasladan por parcela.
  - **Sitio para todos aunque crezca el número de poseedores**, aunque sea bajo tierra o bajo el agua: cuando se llenen las parcelas de superficie, madrigueras subterráneas (boca de cueva en una ladera con su placita, y dentro una caverna con una cama para cada uno), sin límite de número; en las regiones de costa pueden ser grutas marinas. Cuando se libere una parcela de superficie, el primero que espere en una madriguera sube a ella.
  - Detectado de paso: con el reparto por poseedores faltan 2 de las 12 cuevas de mazmorra y 4 de los 12 campos de éter (no encuentran sitio); el plan de parcelas fijas debe dejarles hueco.
  - Herramienta para refrescar los dueños (`tools/update_owners.py`) y botón "Update owners" en el juego.
- **GitHub (15 de octubre)**: todo el código, la descripción completa del juego en inglés (`README.md`) y lo pendiente en inglés (`PENDING.md`) están en el repositorio privado https://github.com/Pablo0004/tickle-beach-world

**11. Un lugar por poseedor** (en vez de pueblos por especie):
- Cada poseedor tiene su sitio y **todos sus Tickles viven allí**.
- **Cuanto más Tickles, más grande la mansión**: X metros cuadrados más por cada Tickle en propiedad; a partir de cierto número, **un poblado o finca propia**.
- **Se actualiza** cuando cambie la propiedad.
- Hace falta un **generador de edificios/mansiones**.
- **Decidido el 15 de octubre**: los clanes pasan a ser los poseedores (alianzas, rivalidades e incursiones entre dominios); las fincas se reparten por igual entre las seis regiones; los pequeños poseedores (1 a 4 Tickles) tienen cada uno su casa en un barrio compartido; "a partir de 20" Tickles, poblado o finca propia (lo entiendo como: de 5 a 19, una mansión que crece con el número de Tickles; desde 20, una finca con su mansión y casas).

**12. Montar más animales** (pedido el 15 de octubre): además de caballos y grifos, que se puedan montar los ciervos, las ovejas, los jabalíes… y los monstruos de mazmorra que se hayan domado.

---

## 2. Cosas a medias o por confirmar

- **Créditos**: en Menú → Créditos sigue "The Tickle Beach collection by Paul McKellar" (atribución real de la colección, no leyenda). Pregunté si quitarlo; sin respuesta.
- **Casino, sin comprobar del todo**:
  - El flujo completo de inscribir a tu Tickle en el torneo (los torneos de Tickles sí se probaron hasta el final).
  - Las cartas en las mesas de póker de 6 (estaban vacías al medir; usan el mismo sistema que las de torneo, que sí se midieron).
  - Ver a los camareros cruzar la sala con clientes dentro.
  - La sala de bingo después de agrandarla.
- **Revisión minuciosa de todo el juego "como un creador de videojuegos"** (petición antigua): se hace a la vez que lo demás, no está cerrada.
- **Ideas antiguas sin cerrar**: los combates de los torneos de criaturas pueden resolverse demasiado rápido para verlos.

---

## 3. Hecho (resumen por versiones publicadas)

- **v22–v27 (mazmorras y mundo)**:
  - Revisiones del Director duplicadas.
  - Música libre de derechos por lugar, con Menú y Créditos.
  - Giro de cámara.
  - Interiores más ricos.
  - Pesca bien colocada.
  - Animales que cazan.
  - Ayuntamiento de Tide Isle.
  - Ranas y criaturas que se cogen, se lanzan y croan.
  - Estatua sin cambio de forma.
  - Mazmorras-laberinto con monstruos.
  - Plaza con más troncos y fuego; coliseo más grande con gradas.
  - Gran Inframundo de 36 pisos bajo todo el mapa, con un jefe por piso; mitad de tamaño.
  - Tesoros, cristales de éter y reliquias.
  - Pisos bloqueados hasta vencer al jefe.
  - Tickle Dorado final bajo la estatua.
  - Salas de jefe grandes.
  - Juego completable; hacen falta al menos 2 bendecidos.
- **v28 (combates y gremios)**:
  - Combates que se pueden ver (botón Ver).
  - Magos con hechizos, sanadores y guerreros.
  - Seis gremios con sedes y rangos.
  - Minas con niveles, guardias, vagonetas y robos de trasgos.
  - Ataques especiales de los jefes con aviso en el suelo; enfurecidos al final.
  - Todos los monstruos devuelven los golpes (también los invocados y los trasgos contra los mineros).
- **v29–v30 (objetos y barcos)**:
  - Objetos de la mano guardados al usar las dos manos; los grandes, siempre abajo.
  - Material prestado por el pueblo: caña, tabla, pesas, pelota y patines para todos.
  - Surf con olas.
  - Barqueros y pasajeros dentro de los barcos.
- **v31 (casino y estatua)**:
  - Nombre del creador quitado de la leyenda; solo quedan las iniciales "P.M." en la placa de la estatua.
  - Casinos en las 6 regiones con póker, blackjack, ruleta y bingo reales.
  - Salas separadas y torneo de póker nocturno.
  - Ruleta y bombo girando sobre su centro.
- **v32–v34 (casino a escala)**:
  - Todo el casino a escala de los Tickles.
  - Sala de tragaperras con 52 máquinas en filas juntas.
  - Bar de copas con bármanes y camareros; nunca tus Tickles como personal; copas para la casa y sueldo para el personal.
  - Mesas a tamaño real, con cartas y fichas medidas sobre el tapete.
- **v48 (clima por zonas, 15 de octubre)**:
  - Un solo "campo del tiempo" que el viento arrastra por todo el mapa: los frentes de nubes, lluvia y tormenta cruzan de una zona a otra (puede diluviar en una región y hacer sol en la de al lado). Cada región tiene su clima: la Cascada es la más lluviosa, Arena de Playa la más seca, la Palmera tiene tormentas tropicales. En conjunto: unos dos tercios del tiempo despejado, ~15 % lluvia, ~5 % tormenta, niebla algunas mañanas.
  - Cerca de ti: el cielo y la luz se oscurecen, cae la lluvia (inclinada por el viento en las tormentas), pasan nubes, hay niebla en las mañanas húmedas, y en las tormentas caen rayos (destello, rayo y el trueno un momento después, más tarde cuanto más lejos); a veces parten un árbol, alguna vez un tejado, y muy rara vez dejan KO a un Tickle. Se oyen la lluvia y el viento (ambiente).
  - Los Tickles se resguardan en casa de las tormentas (y muchos de la lluvia fuerte) en su tiempo libre y en la cena; los pájaros callan con la lluvia.
  - **Tornados** (más o menos uno cada 10 días): bajan de una tormenta y cruzan una región durante unos 40 minutos; derriban árboles, destrozan casas, ayuntamientos y graneros en su camino y lanzan por los aires a los Tickles que pillan fuera (los pueblos cercanos se meten en casa). Se ve el embudo girando con escombros.
  - **Tsunamis** (muy raros): el mar se retira de una costa unos 45 minutos antes y la gente de la orilla corre tierra adentro; luego entra una ola enorme que destroza lo que hay junto al agua y arrastra a quien no se fue.
  - Junto al reloj se ve el tiempo que hace donde estás; la tarjeta "Weather" de Aventura da el tiempo de cada región, las próximas horas y los avisos.
  - De paso, arreglado un problema de rendimiento que venía de la v43: buscar la playa de mar abierto para los 844 profesores de surf tardaba hasta 2 segundos por Tickle y producía tirones al empezar el día; ahora es instantáneo.
- **v47 (sonido, 15 de octubre)**:
  - **Ranas**: el sonido continuo junto a la estatua gigante eran las ranas de los nenúfares, que croaban cada 1,4 segundos sin parar. Ahora croan a tandas (dos o tres, una contestando a otra) con silencios largos: más seguido de noche y mucho menos de día.
  - **Pájaros cantores** en los árboles cercanos: pinzón (trino rápido), curruca (gorjeo que se desliza), petirrojo de palmera (silbido), zorzal (frase de flauta repetida dos veces) y tórtola (arrullo); gaviotas que dan vueltas y chillan sobre el mar; de noche solo el búho. Cantan en armonía: todos usan las notas de la misma escala (re mayor pentatónica) y empiezan al compás de un mismo pulso lento, así que cuando coinciden suenan afinados y a tiempo. Coro lleno al amanecer, menos de día y silencio al anochecer. Se ven posados en las copas (llegan volando), se mueven al cantar y el canto viene del lado donde están. En silencio dentro de los edificios.
  - **Menú → Sonido** (antes "Música"): música, ambiente (pájaros, ranas, yunques, cascos) y efectos (gritos, golpes, campanas, lo que lanzas) por separado, cada uno con su volumen y su interruptor; dice qué pájaros cantan cerca. Se recuerda en este navegador.
- **v46 (arreglos, 14 de octubre)**:
  - Quitado el "P.M." de la placa de la estatua gigante del Tickle dorado; las iniciales solo salen ya en la historia (leyenda y ayuda).
  - Los Tickles duermen bien tumbados encima de la cama, con la cabeza en la almohada, sin atravesar el cabecero ni hundirse en el colchón (las camas son un poco más largas y anchas, a la medida de un Tickle).
  - Sin olas en los ríos: el "mar abierto" ya no incluye los canales entre regiones (salían olas en sus desembocaduras). El lago y los estanques siguen en calma.
  - Los muelles sacados de los modelos de los Tickles están anclados a la orilla: empiezan en la arena y salen sobre el agua, con el tablero a la altura de la orilla, y los Tickles caminan por encima.
  - La mano de dios coge y lanza también los caballos y grifos (los de los jinetes cuando esperan, los del cercado y el de la torre, que vuelve volando), las bestias marinas (el kraken y la serpiente; lanzadas con fuerza se hacen daño y luego vuelven al agua) y los barcos (en el agua se quedan flotando un rato; en tierra vuelven a su amarre). Siguen fijos los edificios que son lugares del juego (arenas, mazmorras, minas, estatua, gremios, casinos, muelles) y los ferris.
  - Tickles atascados al cruzar agua: con el arreglo de la v45 no apareció ninguno en las pruebas.
- **v45 (la riqueza se nota, 14 de octubre)**:
  - **Gremio de Herreros** en cada región, junto al Barrio de los Gremios: una forja donde dos herreros martillean todo el día (chispas, humo y sonido de yunque), un cercado con caballos a la venta y su mozo de cuadra, y una torre con un grifo.
  - **Casas mejores**: los constructores del pueblo levantan una casa de dos plantas (entramado, balcón, jardineras) y luego una **mansión** (porche con columnas, torre con bandera); dentro, salón, dormitorio y, en la mansión, cámara del tesoro. Mientras se construye, el dueño duerme en el ayuntamiento.
  - **Barcos propios** amarrados en el puerto de cada muelle (barca de remos, velero, yate); algunas tardes su dueño sale a navegar por el lago.
  - **Monturas**: poni, caballo de silla, corcel blanco y grifo. En los viajes largos van al trote (llegan antes); el grifo vuela en línea recta por encima de todo. El caballo espera junto a su jinete y de noche junto a su casa. En primera persona, tecla M para montar (en grifo, Espacio sube y C baja).
  - **Armas mejores**: de acero fino (pegan un 25 % más) y obra maestra (un 50 % más), y escudos de acero.
  - **Desgaste de armas y escudos**: nuevo, bueno, gastado, muy gastado, a punto de romperse. Gastados pegan o protegen menos y se ven oxidados; pueden romperse. Las armas de la milicia suelen ser viejas. El gremio repara y vende armas nuevas o de segunda mano (más baratas, ya gastadas).
  - Quien tiene conchas de sobra va a comprar en su tiempo libre lo que más quiere (los luchadores, armas; los viajeros, montura; los que viven junto a un muelle, barco; todos, mejor casa). Al cambiar, se descuenta la mitad de lo viejo. Algunas familias eran ricas desde el principio.
  - Tus Tickles también compran solos (no mientras los controlas) y en su ficha tienes botones para comprarles cosas. Tarjeta "Wealth" en Aventura con los más ricos.
  - De paso: los Tickles que se quedaban atascados en la orilla ahora buscan un rodeo o cruzan nadando.
- **v44 (bestias marinas)**: la Serpiente del Lago (tipo Nessie, en el gran lago) y el Kraken (en el mar abierto) emergen de vez en cuando por la tarde junto a un muelle o una playa: hunden las barcas que alcanzan y escupen a quien está junto al agua (con aviso rojo en el suelo; pueden dejar KO). Acuden a pelear de 8 a 14 armados, magos y domadores de los pueblos cercanos (lanzas y piedras, hechizos, criaturas). Si la matan se hunde y reparten su tesoro (30 conchas, 2 Ethernum y experiencia cada uno; el golpe final se lleva una reliquia: Escama de la Serpiente o Pico del Kraken, y 70 conchas más); si no, se vuelve al fondo y las barcas del muelle quedan hundidas hasta la mañana. Hay de todo: unas veces ganan y otras se escapa. Barra de vida sobre la bestia y tarjeta en Aventura.
- **v43 (mar abierto)**: el lago central, los canales y los estanques quedan en calma; el mar que rodea las tierras tiene olas que rompen en todas sus playas cerca de la cámara (paralelas a la orilla, de dos en dos). El surf solo se hace en el mar abierto, los profesores de surf trabajan en playas de mar y el Concurso de Surf se celebra en una playa de mar de cada región. La cámara (y lo que lances con la mano) puede ir ~260 bloques mar adentro más allá de antes. Sin cambiar el terreno ya generado (las partidas guardadas siguen valiendo).
- **v42 (brazos)**: la pesa (que está en una sola pata) se levanta con un solo brazo y lo que lleve en la otra se queda a la vista; con espada, el otro brazo baja salvo que lleve escudo (también los guardias y los que luchan en las mazmorras). Siguen con los dos brazos solo lo que lo pide: escudo y arma, remar, bailar, la pelota, cavar, conducir el kart, hechizos, celebrar en el podio.
- **v41 (monstruos domados)**: los domadores ganan para sí monstruos (nunca un guardián): en las expediciones al Inframundo (uno de la planta que despejan: goblins, kobolds, esqueletos, momias, arañas, basiliscos, arpías, hombres lobo, centauros, gólems, salamandras, troles, ogros, mantícoras, espectros, cancerberos, minotauros...), en las minas (goblins y arañas) y en las bocas de cueva (babosas, murciélagos sombríos, setas brutas). Cada uno es una criatura más con su tipo y su ataque: el recién domado va delante y sigue a su domador por el mapa (a tamaño de compañero) y lucha en los torneos de la arena. Los grifos ya se domaban (son una de las 7 criaturas). Las crónicas del Inframundo lo cuentan.
- **v40 (muros de roca)**: los muros de minas y mazmorras son ahora sobre todo rocas redondeadas como el pedrusco on-chain (gris, gris oscuro y pardo, con un toque del color de cada zona), con piedrecitas por el suelo y suelo irregular; quedan zonas de pared y suelo lisos (pocas en las minas, más en las Catacumbas y el Laberinto). De paso, la mazmorra se dibuja por trozos y solo lo que se ve: pasa de ~10 millones de triángulos a ~1,7 y va mucho más fluida.
- **v39 (pesca en el embarcadero)**: el montón venía de los días de "pesca en el lago": solo hay 4 barcas por muelle y los que no cogían una se quedaban todos juntos en el punto de reunión mirando al ferry. Ahora el embarcadero empieza en la orilla y sale ~10 bloques sobre el agua (antes la mitad quedaba en tierra), se puede caminar por él, y cada pescador tiene su puesto: en la punta y los costados del embarcadero o repartidos por la orilla lejos de las barcas, cada uno mirando al agua. En los muelles pequeños y estanques también tiene cada uno su sitio en la orilla.
- **v38 (primera persona)**: botón "First person" en la ficha de cualquier Tickle (o tecla V). Con uno tuyo en "I'm in control" lo manejas tú: WASD para andar, Mayús para correr, arrastrar o Z/X para girar, E para entrar en un edificio, nada si lo metes en el agua. Con cualquier otro vas con él viendo lo que ve (carreras, regatas, buceo...). Bajo el agua la vista se vuelve azul y turbia. Esc para salir.
- **v37 (buceo)**: 18 puntos de buceo (3 por región: uno en el gran lago y dos en el mar exterior), cada uno con su boya y bandera de buceo:
  - En el fondo: barco hundido, arrecife de coral, banco de ostras con perlas o las ruinas sumergidas de un templo del Creador (en las dos regiones del centro).
  - En su tiempo libre bucean los que aman el agua (flotador en las patas, tabla de surf, socorristas, rastreadores de playa, buscadores de tesoros, gremio de Merodeadores): nadan hasta el punto, bajan una y otra vez (se les ve bajo el agua, con burbujas) y suben con conchas, coral, perlas (alguna negra), monedas antiguas, algún cofre, Ethernum de las ruinas y, muy raramente, una reliquia del mar (Peine de Sirena, Campana Ahogada, Perla del Abismo).
  - Fuera de cámara se les paga igual al acabar su tiempo libre. Tarjeta "Diving" en Aventura. En "I'm in control" puedes mandar a tus Tickles con "Go diving".
- **v36 (competiciones de todo)**: cada región celebra un concurso al día, distinto cada día (en 8 días, todos):
  - **Pesca** en la orilla del muelle (gana el mayor peso; el pescado va a los graneros).
  - **Surf** en la misma orilla (jueces puntúan cada ola; cuentan las dos mejores).
  - **Regata** de veleros alrededor de boyas.
  - **Carrera a pie** y **Gran Premio de karts** en un circuito marcado con conos, con arco de salida/meta.
  - **El Tickle más fuerte**: press con mancuerna a UNA mano (los brazos de los Tickles son cortos: una barra por encima de la cabeza la atravesaría).
  - **Desfile de moda** en pasarela: los modelos se cambian de ropa y se la quedan; el look ganador se pone de moda en la región y otros lo copian.
  - **Concurso de canción** en un escenario: suena la canción de cada cantante; la ganadora pasa a ser la música de todos los pueblos de la región.
  - Participan los mejores de la región, tres jueces puntúan los espectáculos, los vecinos miran; podio con 40, 20 y 10 conchas; marcador en pantalla mientras miras.
  - Tú puedes inscribir a tus Tickles desde la pestaña Aventura (antes de que empiece). Ficha del Tickle: medallas, concurso de hoy y ropa que lleva (con botón para volver a su ropa on-chain).
- **v35 (tragaperras jugables)**:
  - Tres rodillos y una línea; premios 🍒 5, 🍋 8, 🔔 12, 🐚 20, ⭐ 40, 7 120, 👑 800 veces la apuesta; dos 🍒 ×3; otra pareja ×2; una 🍒 en el primer rodillo = apuesta de vuelta; devuelve ~91,5 %.
  - Uno de cada cuatro clientes prefiere las máquinas; juegan solos (1–2 conchas por tirada); pantallas encendidas en cada máquina.
  - Tú juegas con el botón "Play a machine" de la sala de tragaperras, con uno de tus Tickles (apuesta 1, 2 o 5).

---

## 4. Reglas tuyas que sigo
- No ampliar lo pedido sin preguntar; terminar una cosa antes de pasar a otra, en el orden de esta lista.
- El nombre del creador no se usa en el juego (solo "P.M.").
- Los Tickles del jugador nunca son personal de nada; solo el jugador los controla.
- Antes de compactar la conversación: actualizar este archivo.

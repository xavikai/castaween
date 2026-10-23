# Castaween · Què pot fer cada cicle

Castaween està pensat perquè cada cicle de CIFOG hi aporti una peça real del joc en una activitat de classe. Cada entrega va a una carpeta concreta de `assets/` i el joc la carrega sola (vegeu `ASSETS.md`).

## 3D i videojocs · Personatges, monstres i escenari

- **Castanyeres**: cada alumne modela, mapeja a la paleta, rigeja i anima la seva castanyera (`idle`, `corre`, `llanca`, `cop`). Apareix al configurador del joc amb el seu nom.
- **Monstres**: carabassa, fantasma i Carabassot, amb les animacions `camina` i `ataca`.
- **Escenari**: castanyers, cases, criptes, paradetes, el portal…
- Treballa: modelatge low poly amb pressupost de polígons, UV a una paleta, rig i animació per a joc, exportació glTF.
- Eina de control: el **Taller de models** del joc valida cada entrega.

## Disseny · Identitat i interfície

- **Identitat de Castaween**: logo (`ui/logo`), que substitueix el títol del menú.
- **Interfície i menú principal**: maquetes a Figma i després el full d'estil `ui/tema.css` (colors, tipografies, botons, marcador, barra de vida). Parteix de `ui/tema-exemple.css`.
- **Iconografia**: armes, panellets, llenya, cursos.
- **Paleta oficial**: poden redissenyar els 64 colors de `paleta-castaween.png`. Com que tots els models la fan servir, canviar-la canvia l'estil de tot el joc.
- **Cartelleria** de la jornada de la Castanyada.
- Treballa: disseny d'interfície per a mòbil, sistemes de color, jerarquia visual, CSS bàsic.

## Fotografia · Del món real al joc

- **Fotogrametria d'objectes de la Castanyada**: castanyes, panellets, moniatos, carabasses, cistells. Es fotografien des de tots els angles i es reconstrueixen en 3D. L'alumnat de 3D en fa la versió low poly i la mapeja a la paleta: una col·laboració directa entre cicles.
- **Fons del menú** (`ui/fons`): fotografia nocturna d'una foguera o d'una paradeta de castanyes real, tractada perquè encaixi amb l'estil del joc.
- **Fotografia de producte** per a les icones de les armes i els objectes, i per a la cartelleria.
- **Retrats de "carnet de castanyera"**: alumnes caracteritzats, per a la pantalla de crèdits i la difusió.
- **Referències** de vestuari tradicional (mocadors, xals, davantals) per a qui modela.
- Treballa: fotogrametria, il·luminació de producte, fotografia nocturna, retoc i adaptació a un estil gràfic.

## Audiovisuals · So, música i vídeo

- **Música**: tres bucles (`so/musica`): menú, partida i Nit de Difunts, amb intensitat creixent.
- **Efectes de so de Foley**: 20 sons gravats (cruixit de castanya, foc, puré de moniato, fusta, campana…). La llista completa i quan sona cadascun és a `ASSETS.md`.
- **Veus de l'anunciador**: "Arriba el Carabassot!" i "Nit de Difunts!" (claus `carabassot` i `campana`).
- **Vídeo de fons del menú** (`ui/fons` en MP4) i **tràiler** del joc per presentar-lo el dia de la Castanyada.
- Treballa: disseny sonor per a joc, bucles musicals, Foley, normalització de volum, motion i edició.

## Gràfica interactiva · Mecànica, dades i web

- **Equilibri del joc** (`config.json`): sessions de playtesting amb l'alumnat d'altres cicles, recollida de dades (quin curs guanya, quant duren les partides, quina arma s'agafa més) i ajust dels valors de munició, vida i velocitat.
- **Pantalla del professor**: el marcador en gran per al projector de l'aula, amb el codi de la sala i les fogueres de cada curs.
- **Web del projecte** a GitHub Pages: presentació del joc, crèdits de tot l'alumnat i galeria del making of.
- **Microinteraccions i animacions de la interfície**, en col·laboració amb Disseny.
- Més endavant, el **mode en línia**: el servidor que gestiona les sales, les cues i la partida en temps real.
- Treballa: disseny de jocs, analítica i iteració, prototipatge web, interacció.

## Calendari proposat

1. **Setmana 1**: presentació del projecte i reparteix de peces. 3D i Fotografia acorden els objectes a fotografiar.
2. **Setmanes 2–3**: producció. Entregues parcials al Taller (3D) i a la carpeta de proves (la resta).
3. **Setmana 4**: integració a `assets.json`, playtesting entre cicles i ajust de l'equilibri.
4. **Jornada de la Castanyada**: torneig entre cursos amb el marcador al projector, i estrena del tràiler.

# Castaween

Videojoc web 3D low poly per a mòbil, fet a CIFOG per la Castanyada. Cinc equips de castanyeres defensen la Castanyada davant de Halloween: cacen monstres, recullen la llenya que deixen i alimenten la foguera del seu curs. Guanya el curs amb la foguera més gran quan s'acaben els 5 minuts.

**Estat:** joc amb bots i mode en línia d'aula. El professor executa la simulació i Cloudflare retransmet els missatges WebSocket.

**Joc:** https://xavikai.github.io/castaween/

Professor: **Obre una sala (professor) → comparteix el codi → Comença**. Alumnes: **Mode en línia → nickname → codi**. Els equips tenen noms aleatoris a cada sala i cada alumne entra automàticament a l'equip amb menys gent (fins a 15 per equip; els bots completen fins a 10). Es pot canviar a `assets/config.json` → `places`. El nickname es veu damunt les castanyeres humanes i als avisos d'eliminació, per exemple «Pau elimina Marta». Es desa en aquest dispositiu i també es pot editar a **Personatge**.

**Mode local · bots → nickname → Comença partida local** inicia una partida contra la màquina sense cap codi ni connexió al Worker. Conserva l'ordinador del professor despert i el joc en primer pla durant el mode en línia. **Mira una partida** conserva el mode espectador.

Desplegament, protocol, límits gratuïts, proves i limitacions: [server/README.md](server/README.md).

## Jugar

Obre la pàgina de GitHub Pages del repositori al mòbil. Controls: joystick a l'esquerra i botó LLANÇA a la dreta. A l'ordinador: WASD o fletxes, espai per llançar i B per construir.

## Material de l'alumnat

**`carpeta-alumnat/`**: la carpeta per passar a la classe. Té la guia visual pas a pas en PDF, un fitxer d'inici de Blender ja preparat, la paleta i els models de referència. L'aplicació només serveix per jugar: crear i entregar models es fa a classe.

**Paquets preparats:** [ZIP per a l'alumnat](lliurament/castaween-alumnat.zip) i [ZIP per al professorat](lliurament/castaween-professorat.zip). Inclouen instruccions d'inici, fitxa d'entrega, mides i límits, i una [guia del professorat](documentacio-professorat/GUIA-PROFESSORAT.pdf) amb revisió, integració i criteris d'avaluació proposats. Per regenerar-los: `python tools/prepara-material-classe.py` (reportlab, pypdf i Pillow).

Tot el que surt al joc es pot substituir per material fet a classe, sense tocar el codi:

- **`ASSETS.md`**: guia tècnica (paleta obligatòria, requisits de polígons, exportació des de Blender, so, música, interfície).
- **`disseny.html`**: editor perquè l'alumnat de Disseny canviï textos, colors, lletres i imatges de la interfície i ho entregui en un ZIP. Com instal·lar els dissenys: `ASSETS.md` → Interfície.
- **`PROJECTE-CICLES.md`**: què pot aportar cada cicle (3D i videojocs, Disseny, Fotografia, Audiovisuals i Gràfica interactiva).
- **`assets/assets.json`**: on es diu al joc quins fitxers ha de fer servir.

Cada tipus de monstre, arbre i objecte admet diverses propostes a `assets/assets.json`, amb nom i autor. Les aparicions alternen els models per torns; l'escenari els reparteix pel mapa i renova la selecció a cada ronda. Vegeu **Diverses propostes per tipus** a [ASSETS.md](ASSETS.md).

**[Descarrega els models i la guia d'escala](https://xavikai.github.io/castaween/assets/)**: castanyera de referència i plantilla animada a **1,80 m**, més **19 models de monstres, arbres i objectes** amb les mides de referència. Hi ha descàrregues individuals i un [ZIP amb tot el conjunt](assets/referencies/castaween-referencies.zip). A Blender, treballa en metres amb **Unit Scale 1.000**; respecta l'alçada de cada model indicada al catàleg. Detalls a `assets/referencies/LLEGEIX-ME.md`.

## Estructura

```
index.html        el joc (un sol fitxer, three.js r128 des de CDN)
assets/           models, so, música, interfície i configuració
server/           repetidor Cloudflare Worker + Durable Objects SQLite
ASSETS.md         guia per a l'alumnat
PROJECTE-CICLES.md
```

## Publicar

Cloudflare Pages: repositori `xavikai/castaween`, branca de producció `main`, build `node tools/build-pages.cjs` i carpeta de sortida `public`. El build copia només els fitxers públics del joc i els materials de classe; exclou el servidor, les credencials i les eines. Amb la integració Git activada, cada push a `main` publica una versió nova.

GitHub Pages: **Settings → Pages → Deploy from a branch → main / (root)**. El joc s'ha de servir des d'un servidor perquè pugui llegir la carpeta `assets/`; si s'obre `index.html` directament, fa servir els recursos integrats.

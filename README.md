# Castaween

Videojoc web 3D low poly per a mòbil, fet a CIFOG per la Castanyada. Cinc equips de castanyeres defensen la Castanyada davant de Halloween: cacen monstres, recullen la llenya que deixen i alimenten la foguera del seu curs. Cada ronda dura 5 minuts i la guanya l'equip amb més llenya a la foguera. La partida és al millor de 3: guanya el primer equip que aconsegueix dues victòries. Si després de tres rondes encara no n'hi ha cap, es juguen rondes extra fins que un equip arriba a dues; una ronda empatada no suma victòries.

**Estat:** joc amb bots i mode en línia d'aula. El professor executa la simulació i Cloudflare retransmet els missatges WebSocket.

**Joc:** https://castaween.pages.dev/

**Instal·lar al dispositiu:** obre el joc i prem **Instal·la el joc** al menú inicial. Quan el navegador ofereix instal·lació directa, el botó obre la confirmació; en altres navegadors mostra les instruccions corresponents. A iPhone/iPad, fes servir **Comparteix → Afegeix a la pantalla d'inici**; a Safari del Mac, **Fitxer → Afegeix al Dock**. L'aplicació s'obre amb icona pròpia i sense la barra del navegador. [Compatibilitat d'instal·lació](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable).

Obre'l amb Internet la primera vegada i espera l'avís **Mode local disponible sense connexió**. Es desen només els recursos necessaris per jugar: motors, models, configuració, paleta i so. Després pots jugar amb bots sense connexió; el mode en línia i les entregues continuen necessitant Internet. Les fonts de text poden fer servir l'alternativa del dispositiu si no s'han carregat abans.

Professor: **Obre una sala (professor) → comparteix el codi → Comença**. Alumnes: **Mode en línia → nickname → codi**. Els equips tenen noms aleatoris a cada sala i cada alumne entra automàticament a l'equip amb menys gent (fins a 15 per equip; els bots completen fins a 10). Es pot canviar a `assets/config.json` → `places`. El nickname es veu damunt les castanyeres humanes i als avisos d'eliminació, per exemple «Pau elimina Marta». Es desa en aquest dispositiu i també es pot editar a **Personatge**.

Els resultats mostren les victòries acumulades de cada equip. En arribar a dues, s'anuncia el guanyador de la partida i no es pot començar una ronda més. **Nova partida** reinicia el marcador i torna a la ronda 1; en línia només ho pot fer el professor i es conserven el codi de sala i els participants.

**Mode local · bots → nickname → Comença partida local** inicia una partida contra la màquina sense cap codi ni connexió al Worker. Conserva l'ordinador del professor despert i el joc en primer pla durant el mode en línia. **Mira una partida** conserva el mode espectador.

Desplegament, protocol, límits gratuïts, proves i limitacions: [server/README.md](server/README.md).

## Jugar

Obre https://castaween.pages.dev/ al mòbil. Controls: joystick a l'esquerra i botó LLANÇA a la dreta. A l'ordinador: WASD o fletxes, espai per llançar i B per construir.

## Material de l'alumnat

**`carpeta-alumnat/`**: la carpeta per passar a la classe. Té la guia visual pas a pas en PDF, un fitxer d'inici de Blender ja preparat, la paleta i els models de referència. L'aplicació només serveix per jugar: crear i entregar models es fa a classe.

**Paquets preparats:** [ZIP per a l'alumnat](lliurament/castaween-alumnat.zip) i [ZIP per al professorat](lliurament/castaween-professorat.zip). Inclouen instruccions d'inici, fitxa d'entrega, mides i límits, i una [guia del professorat](documentacio-professorat/GUIA-PROFESSORAT.pdf) amb revisió, integració i criteris d'avaluació proposats. Per regenerar-los: `python tools/prepara-material-classe.py` (reportlab, pypdf i Pillow).

Tot el que surt al joc es pot substituir per material fet a classe, sense tocar el codi:

- **`ASSETS.md`**: guia tècnica (paleta obligatòria, requisits de polígons, exportació des de Blender, so, música, interfície).
- **`disseny.html`**: editor perquè l'alumnat de Disseny canviï textos, colors, lletres i imatges de la interfície i ho entregui en un ZIP. Com instal·lar els dissenys: `ASSETS.md` → Interfície.
- **`PROJECTE-CICLES.md`**: què pot aportar cada cicle (3D i videojocs, Disseny, Fotografia, Audiovisuals i Gràfica interactiva).
- **`assets/assets.json`**: on es diu al joc quins fitxers ha de fer servir.

Cada tipus de monstre, arbre i objecte admet diverses propostes a `assets/assets.json`, amb nom i autor. Les aparicions alternen els models per torns; l'escenari els reparteix pel mapa i renova la selecció a cada ronda. Vegeu **Diverses propostes per tipus** a [ASSETS.md](ASSETS.md).

**Assets de l'alumnat:** 25 models incorporats, alternant amb els originals. La Mortícia de Clara és una enemiga gran que alterna amb els Carabassots. [Correspondències, validació i pla per tornar a la versió anterior](documentacio-professorat/ASSETS-ALUMNAT-2026-10-28.md).

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

El build regenera `assets/pwa-files.js` amb una versió derivada del contingut del joc: afegir o modificar models, sons o codi actualitza també la preparació sense connexió. El Service Worker `sw.js` prova primer la xarxa i utilitza la còpia desada quan no hi ha connexió; una versió nova no força recàrregues durant una partida. Només es netegen les memòries cau d'aquesta aplicació i aquest àmbit. Les API del Worker, les estadístiques i els POST no es desen. Three.js r128 i els seus complements es distribueixen a `assets/vendor/three-r128/`, amb la llicència MIT original, per poder arrencar sense CDN. Regeneració d'icones: `tools/build-app-icons.py`; actualització de les còpies fixades de Three.js: `node tools/fetch-pwa-vendor.mjs`.

GitHub Pages: **Settings → Pages → Deploy from a branch → main / (root)**. El joc s'ha de servir des d'un servidor perquè pugui llegir la carpeta `assets/`; si s'obre `index.html` directament, fa servir els recursos integrats.

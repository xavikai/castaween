# Castaween

Videojoc web 3D low poly per a mòbil, fet a CIFOG per la Castanyada. Les castanyeres de cada curs defensen la Castanyada davant de Halloween: cacen monstres, recullen la llenya que deixen i alimenten la foguera del seu curs. Guanya el curs amb la foguera més gran quan s'acaben els 5 minuts.

**Estat:** joc amb bots i mode en línia d'aula. El professor executa la simulació i Cloudflare retransmet els missatges WebSocket.

**Joc:** https://xavikai.github.io/castaween/

Professor: **Obre una sala (professor) → comparteix el codi → Comença**. Alumnes: **Mode en línia → nickname i curs → codi**. El nickname es veu damunt les castanyeres humanes i als avisos d'eliminació, per exemple «Pau elimina Marta». Es desa en aquest dispositiu i també es pot editar a **Personatge**.

**Mode local · bots → nickname i curs → Comença partida local** inicia una partida contra la màquina sense cap codi ni connexió al Worker. Conserva l'ordinador del professor despert i el joc en primer pla durant el mode en línia. **Mira una partida** conserva el mode espectador.

Desplegament, protocol, límits gratuïts, proves i limitacions: [server/README.md](server/README.md).

## Jugar

Obre la pàgina de GitHub Pages del repositori al mòbil. Controls: joystick a l'esquerra i botó LLANÇA a la dreta. A l'ordinador: WASD o fletxes, espai per llançar i B per construir.

## Material de l'alumnat

Tot el que surt al joc es pot substituir per material fet a classe, sense tocar el codi:

- **`ASSETS.md`**: guia tècnica (paleta, requisits de polígons, exportació des de Blender, so, música, interfície).
- **`PROJECTE-CICLES.md`**: què pot aportar cada cicle (3D i videojocs, Disseny, Fotografia, Audiovisuals i Gràfica interactiva).
- **`assets/assets.json`**: on es diu al joc quins fitxers ha de fer servir.

Dins del joc, **Personatge → Taller de models** valida un `.glb` abans d'entregar-lo.

**[Descarrega els models i la guia d'escala](https://xavikai.github.io/castaween/assets/)**: model actual de referència i plantilla animada a **1,80 m**. A Blender, treballa en metres amb **Unit Scale 1.000**; les mides i els eixos són a `assets/plantilles/LLEGEIX-ME.md`.

## Estructura

```
index.html        el joc (un sol fitxer, three.js r128 des de CDN)
assets/           models, so, música, interfície i configuració
server/           repetidor Cloudflare Worker + Durable Objects SQLite
ASSETS.md         guia per a l'alumnat
PROJECTE-CICLES.md
```

## Publicar

GitHub Pages: **Settings → Pages → Deploy from a branch → main / (root)**. El joc s'ha de servir des d'un servidor perquè pugui llegir la carpeta `assets/`; si s'obre `index.html` directament, fa servir els recursos integrats.

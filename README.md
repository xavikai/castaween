# Castaween

Videojoc web 3D low poly per a mòbil, fet a CIFOG per la Castanyada. Les castanyeres de cada curs defensen la Castanyada davant de Halloween: cacen monstres, recullen la llenya que deixen i alimenten la foguera del seu curs. Guanya el curs amb la foguera més gran quan s'acaben els 5 minuts.

**Estat:** prototip jugable amb bots. Encara no hi ha multijugador en línia.

## Jugar

Obre la pàgina de GitHub Pages del repositori al mòbil. Controls: joystick a l'esquerra i botó LLANÇA a la dreta. A l'ordinador: WASD o fletxes, espai per llançar i B per construir.

## Material de l'alumnat

Tot el que surt al joc es pot substituir per material fet a classe, sense tocar el codi:

- **`ASSETS.md`**: guia tècnica (paleta, requisits de polígons, exportació des de Blender, so, música, interfície).
- **`PROJECTE-CICLES.md`**: què pot aportar cada cicle (3D i videojocs, Disseny, Fotografia, Audiovisuals i Gràfica interactiva).
- **`assets/assets.json`**: on es diu al joc quins fitxers ha de fer servir.

Dins del joc, **Personatge → Taller de models** valida un `.glb` abans d'entregar-lo.

## Estructura

```
index.html        el joc (un sol fitxer, three.js r128 des de CDN)
assets/           models, so, música, interfície i configuració
ASSETS.md         guia per a l'alumnat
PROJECTE-CICLES.md
```

## Publicar

GitHub Pages: **Settings → Pages → Deploy from a branch → main / (root)**. El joc s'ha de servir des d'un servidor perquè pugui llegir la carpeta `assets/`; si s'obre `index.html` directament, fa servir els recursos integrats.

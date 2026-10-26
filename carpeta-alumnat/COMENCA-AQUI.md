# Castaween · Comença aquí

## 1. Prepara la carpeta

Descomprimeix tot el ZIP abans de començar. Conserva els fitxers junts.
Obre **GUIA-castaween.pdf** i segueix els passos de la guia visual.

- **castaween-inici.blend**: escena preparada per a Blender 4.5 o més nou.
- **paleta-castaween.png**: única textura permesa. No la modifiquis.
- **paleta-guia.png**: noms dels colors, degradats i ulls; és una guia, no una textura per exportar.
- **models-referencia/**: 20 GLB per comparar la mida i la silueta.
- **mides-i-limits.csv**: alçada i pressupost de cada tipus; es pot obrir amb un full de càlcul.
- **opcional-animacio/**: plantilla de castanyera amb esquelet i animacions.
- **FITXA-ENTREGA.txt**: omple-la i entrega-la amb el teu treball.

Si el .blend no s'obre, segueix l'última pàgina de la guia: escena nova en metres, importa una referència i crea el material amb la paleta.

## 2. Fes el teu model

Acorda el tipus amb el professorat. Desa una còpia del .blend amb el teu nom i treballa dins d'EL MEU MODEL. Mantén les referències separades.

- Metres: Metric, Unit Scale 1.000. Alçada igual a la referència.
- Base a Z = 0 i origen al centre de la base. Davant mirant cap a -Y.
- Un sol material amb la paleta oficial; Image Texture a Base Color, interpolació Closest. Totes les peces amb UV.
- Castanyera: reserva zones magenta CURS perquè canviïn al color de l'equip.
- Respecta els màxims de triangles, ossos i pes. Els límits són de triangles, no de cares.

Les referències orienten l'escala i la forma: no són treballs per entregar sense canvis. Revisa sempre el pressupost del teu model final.

## 3. Exporta i entrega

Selecciona només el teu model i l'esquelet, si en té. Exclou les referències. Desa el .blend abans d'exportar. Exporta glTF Binary (.glb), Selected Objects, +Y Up, UVs, normals i materials, Images Automatic, sense Draco ni shape keys. Si fas rig, comprova les animacions abans d'aplicar transformacions.

Nom dels fitxers: **curs-cognom-nom-tipus**, en minúscules i sense accents ni espais.
Exemple: `3d-garcia-marta-carabassa.glb` i `3d-garcia-marta-carabassa.blend`.

Entrega al lloc que indiqui el professorat:

1. El **.glb** final amb la paleta incrustada.
2. El **.blend** editable, amb els recursos empaquetats (File > External Data > Pack Resources).
3. La **FITXA-ENTREGA.txt** omplerta i dues captures: vista general i UV/material.

El joc s'utilitza per jugar; el modelatge i l'entrega es fan a classe. No cal buscar un Taller ni un botó d'enviament al menú. El professorat integra els models revisats.

## Abans d'entregar

- [ ] Alçada, orientació i origen correctes.
- [ ] Referències excloses del GLB.
- [ ] Una sola textura: paleta-castaween.png, sense retocar.
- [ ] UV a totes les peces; cap material gris ni textura absent.
- [ ] Triangles i pes dins del límit; rig i animacions revisats si n'hi ha.
- [ ] He reimportat el GLB en una escena buida i n'he comprovat mida, colors i orientació.
- [ ] .blend, .glb, fitxa i captures tenen el meu nom.

Joc: https://xavikai.github.io/castaween/

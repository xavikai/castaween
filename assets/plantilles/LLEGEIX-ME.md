# Models de referència · Castaween

També els tens a `carpeta-alumnat/models-referencia/`, amb la guia visual i el fitxer d'inici de Blender.

Els monstres, arbres i objectes també tenen GLB de referència a `../referencies/`, amb les seves pròpies alçades, el catàleg de mides `mides-models.json` i les instruccions `LLEGEIX-ME.md`. El ZIP del catàleg web inclou tot el conjunt.

## Què és cada fitxer

- **../castanyeres/castanyera-nova.glb**: la castanyera del joc, que és el model de referència. **1,80 m d'alt**, 1.450 triangles, un material amb la paleta oficial com a única textura (colors plans, fila CURS i l'ull «Marró» a les caselles d'ulls). Sense esquelet: el joc l'anima automàticament.
- **plantilla-castanyera.glb**: plantilla tècnica ja existent, de **1,80 m**, amb la paleta oficial de 512 px, quatre ossos (`arrel`, `cos`, `cap`, `bras`) i quatre animacions (`idle`, `corre`, `llanca`, `cop`). Serveix per practicar el format d'entrega, UV i animació.
- **mides-castanyera.json**: mides i nombre de triangles de la castanyera de referència.

## Escala comuna

**1 unitat = 1 metre.** A Blender: Scene Properties → Units → Metric; Unit Scale **1.000**; Length **Meters**.

Importa amb File → Import → glTF 2.0. No canviïs l'escala en importar. La castanyera de referència fa:

| Dimensió a Blender | Mida |
|---|---:|
| Alçada, Z | 1,800 m |
| Amplada, X | 1,119 m |
| Fondària, Y | 1,234 m |

L'alçada de **1,80 m** és la referència d'entrega per a totes les castanyeres. Amplada i fondària inclouen la faldilla i el cistell, per comparar: no són una obligació de copiar-ne exactament la silueta.

Z cap amunt i cara cap a **−Y** a Blender; origen al centre de la base, a terra. A glTF aquests eixos corresponen a **+Y amunt / +Z davant**. Blender fa aquesta conversió: no giris el model a mà després d'importar-lo.

Conserva la referència en una col·lecció separada i exclou-la de l'exportació del teu model. Per veure els colors, activa Material Preview.

Abans d'exportar el teu model: Ctrl+A → All Transforms. Exporta glTF Binary (.glb), Selected Objects, +Y Up. Màxim **1.500 triangles, 20 ossos i 400 KB**, amb **un material i la paleta oficial com a única textura**: descarrega `assets/paleta-castaween.png` i fes-la servir sense modificar-la. No s'admet cap altra textura, ni colors de material o de vèrtex. Els ulls van a les caselles d'ulls de la paleta (baix a l'esquerra): projecta la cara frontal de l'ull dins de la casella, com a la castanyera de referència.


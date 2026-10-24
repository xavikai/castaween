# Models de referència · Castaween

Descarrega'ls des de https://xavikai.github.io/castaween/assets/ o amb els botons de Personatge i Taller de models.

Els monstres, arbres i objectes també tenen GLB de referència a `../referencies/`, amb les seves pròpies alçades, el catàleg de mides `mides-models.json` i les instruccions `LLEGEIX-ME.md`. El ZIP del catàleg web inclou tot el conjunt.

## Què és cada fitxer

- **castanyera-actual-referencia.glb**: geometria de la castanyera clàssica actual, extreta de `index.html` amb les opcions per defecte. Estàtica, sense esquelet, sense contorns/ombres/llenya carregada ni multiplicadors de visualització. Escala aplicada per fer **1,80 m d'alt**. Serveix per comparar proporcions i mesures, no és una entrega preparada: té 1.529 triangles i colors per vèrtex.
- **plantilla-castanyera.glb**: plantilla tècnica ja existent, de **1,80 m**, amb la paleta oficial de 512 px, quatre ossos (`arrel`, `cos`, `cap`, `bras`) i quatre animacions (`idle`, `corre`, `llanca`, `cop`). Serveix per practicar el format d'entrega, UV i animació.
- **mides-castanyera.json**: mides precises, nombre de triangles i empremta del codi que ha generat la referència actual.

## Escala comuna

**1 unitat = 1 metre.** A Blender: Scene Properties → Units → Metric; Unit Scale **1.000**; Length **Meters**.

Importa amb File → Import → glTF 2.0. No canviïs l'escala en importar. El conjunt cos + braç de la referència fa:

| Dimensió a Blender | Mida |
|---|---:|
| Alçada, Z | 1,800 m |
| Amplada, X | 1,024 m |
| Fondària, Y | 0,988 m |

L'alçada de **1,80 m** és la referència d'entrega per a totes les castanyeres. Amplada i fondària són les del model clàssic, per comparar: no són una obligació de copiar-ne exactament la silueta.

Z cap amunt i cara cap a **−Y** a Blender; origen al centre de la base, a terra. A glTF aquests eixos corresponen a **+Y amunt / +Z davant**. Blender fa aquesta conversió: no giris el model a mà després d'importar-lo.

El model actual té dues peces, cos i braç. Les dimensions d'una sola peça no són les de tot el personatge. Conserva la referència en una col·lecció separada i exclou-la de l'exportació del teu model. Per veure els colors, activa Material Preview.

Abans d'exportar el teu model: Ctrl+A → All Transforms. Exporta glTF Binary (.glb), Selected Objects, +Y Up. Màxim **1.500 triangles, 20 ossos i 400 KB**, amb **un material i la paleta oficial com a única textura**: descarrega `assets/paleta-castaween.png` i fes-la servir sense modificar-la. No s'admet cap altra textura, ni colors de material o de vèrtex. Valida'l al Taller del joc. La referència estàtica de 1.529 triangles s'ha d'optimitzar i adaptar a la paleta si es reutilitza com a base d'una entrega.

## Regenerar la referència quan canviï la figura del joc

L'script `tools/export-reference.cjs` extreu les funcions de geometria actuals d'`index.html` i genera el GLB i el JSON, sense modificar el joc. Necessita una còpia local de **three.js r128**:

```sh
node tools/export-reference.cjs /ruta/a/three-r128.cjs
```

El procés comprova que l'alçada final sigui 1,80 m i que la base sigui a Y=0 al GLB. No cal regenerar el model per canvis que només afectin menús o xarxa.

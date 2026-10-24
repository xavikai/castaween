# Castaween · Guia d'assets

Aquesta guia explica com substituir qualsevol element del joc (personatges, monstres, escenari, so, música i interfície) per material fet per l'alumnat, i quins requisits ha de complir perquè el joc vagi fluid al mòbil.

Per començar a classe: [**guia pas a pas de preparació i entregues**](https://xavikai.github.io/castaween/assets/guia-entregues.html).

> **Paleta obligatòria.** Tots els models s'han de texturitzar amb [`paleta-castaween.png`](assets/paleta-castaween.png) ([guia de colors](assets/paleta-guia.png)), sense modificar-la. És l'única textura admesa: el Taller i el servidor d'entregues rebutgen qualsevol altra textura, i els models sense textura. Així tot el joc té el mateix estil gràfic.

## Com funciona

### Descarrega models per treballar a escala

La carpeta [**assets/ al web**](https://xavikai.github.io/castaween/assets/) té botons de descàrrega i instruccions per a Blender:

- [**Model actual de referència (.glb)**](assets/plantilles/castanyera-actual-referencia.glb): la castanyera clàssica actual, normalitzada a **1,80 m**. Estàtica, per comparar mides i proporcions. Fa **1,024 m d'ample** i **0,988 m de fondària**. Té 1.529 triangles i colors per vèrtex; s'ha d'optimitzar i adaptar a la paleta si es fa servir com a base d'una entrega.
- [**Plantilla animada (.glb)**](assets/plantilles/plantilla-castanyera.glb): també de **1,80 m**, amb la paleta oficial, esquelet i les quatre animacions.
- [**Paleta obligatòria (.png)**](assets/paleta-castaween.png) i [**guia de la paleta**](assets/paleta-guia.png): l'única textura que es pot fer servir.
- [**Instruccions d'escala**](assets/plantilles/LLEGEIX-ME.md) i [**mides exactes**](assets/plantilles/mides-castanyera.json).
- **Monstres, arbres i objectes**: [19 models GLB al catàleg](https://xavikai.github.io/castaween/assets/#resta-models), [mides de cada model](assets/referencies/mides-models.json) i [instruccions](assets/referencies/LLEGEIX-ME.md). Inclou els tres monstres i tots els elements d'escenari substituïbles de la taula tècnica, ajustats a les alçades d'entrega. El tram de marge també fa **1,20 m de llarg (X)**. Són exemplars estàtics de les geometries integrades, amb els colors originals, sense efectes ni animacions; cal adaptar-los a la paleta i als límits si es reutilitzen com a entrega.
- [**Descarrega tot el conjunt en ZIP**](assets/referencies/castaween-referencies.zip): els 19 models, la castanyera actual, la plantilla animada, les mides, les instruccions i la paleta.

A Blender, feu servir **Metric · Unit Scale 1.000 · Meters**. La castanyera s'entrega a **1,80 m d'alt**, amb l'origen a terra. Amplada i fondària són orientatives per comparar siluetes. Els botons de descàrrega també són a **Personatge** i **Taller de models** del joc.

Tot es configura des d'un sol fitxer: `assets/assets.json`. El joc el llegeix en arrencar i:

- Si un element hi és i el fitxer es carrega bé, el fa servir.
- Si no hi és, o el fitxer falla, fa servir la versió integrada.

Per tant, el joc sempre funciona, encara que només s'hagi entregat una part del material.

```
assets/
  assets.json              ← la configuració
  config.json              ← valors d'equilibri del joc
  paleta-castaween.png     ← la textura obligatòria (512 × 512 px)
  paleta-guia.png          ← la mateixa paleta, gran, amb els codis i els noms
  plantilles/
    plantilla-castanyera.glb   ← model de referència amb esquelet i animacions
  castanyeres/             ← models de l'alumnat
  monstres/
  escenari/
  so/efectes/  so/musica/
  ui/                      ← tema CSS, logo, fons del menú
```

> El joc s'ha d'obrir des d'un servidor (GitHub Pages o similar). Si s'obre `index.html` fent doble clic, el navegador no deixa llegir la carpeta `assets/` i el joc fa servir la versió integrada.

## Per provar un model: el Taller

Al joc, **Personatge → Taller de models** (o **Opcions → Taller de models**):

1. Tria què has modelat (castanyera, monstre o element d'escenari).
2. Carrega el teu `.glb`.
3. El Taller comprova tots els requisits d'aquesta guia (verd, groc o vermell), mostra el model amb el color de cada curs i reprodueix les animacions. Si la textura no és la paleta oficial, el model no es pot provar.
4. Amb **Juga amb aquest model** el pots provar en una partida.
5. A sota genera l'entrada que cal enganxar a `assets.json`.

El fitxer no surt del dispositiu. És l'eina per comprovar el model abans d'entregar-lo.

## La paleta obligatòria

Tots els models fan servir la mateixa textura, `paleta-castaween.png` (512 × 512 px). **És obligatòria i no es pot modificar ni substituir per cap altra.** Es descarrega des del [catàleg de models](https://xavikai.github.io/castaween/assets/), des de **Personatge** i des del **Taller de models**.

La textura té quatre zones:

| Zona | Contingut | Com es fa servir |
|---|---|---|
| Dalt a l'esquerra | **64 colors plans** en caselles de 32 px (pells, cabells, roba, Castanyada, Halloween, vius, neutres i la fila CURS) | Cada cara al centre d'una casella |
| Dalt a la dreta | **8 degradats**: pell, castanya, foc, carabassa, nit lila, fantasma, vegetació i CURS | Una illa UV allargada dins d'una franja de 32 px |
| Baix a l'esquerra | **16 ulls** en caselles de 64 px: castanyera (marró, blau, verd, fosc), mirades i expressions, i ulls de Halloween (carabassa, fantasma, Carabassot, monstre…) | El pla de l'ull, encaixat dins de la casella |
| Baix a la dreta | **8 degradats més**: pedra, fusta, panellet, moniato, aigua, or, verí i vermell | Igual que els altres degradats |

La [guia de la paleta](assets/paleta-guia.png) mostra els codis de cada color i el nom de cada degradat i de cada ull.

Per què una sola textura obligatòria:

- **Estil coherent.** Tots els models comparteixen colors, degradats i ulls, encara que els facin persones diferents.
- **Rendiment.** Un sol material per model vol dir menys crides de dibuix: amb 50 personatges a la pantalla, és la diferència entre anar fluid o no.
- **Pes mínim.** La textura ocupa uns 40 KB i es comparteix entre tots els models.
- **Color del curs automàtic.** La fila de baix dels colors plans i el degradat **CURS** (magenta) no surten mai magenta: el joc els substitueix pel color del curs de qui juga. El magenta clar dona el color clar i el fosc, el fosc.

**Com es controla.** El Taller marca en vermell els models sense textura, amb una textura diferent o amb més d'un material, i no deixa provar-los. El servidor d'entregues també els rebutja. A més, el joc sempre dibuixa els models amb la paleta oficial, encara que el fitxer en porti una altra.

**Models fets amb la paleta antiga (256 px).** Continuen funcionant: els 64 colors són els mateixos i el joc els adapta sol. Per tenir degradats i ulls, el professorat pot actualitzar el GLB amb `python tools/migrate-palette.py model.glb`.

### Com fer-ho a Blender

1. Descarrega `paleta-castaween.png` i desa-la al costat del teu `.blend`. No l'editis.
2. Crea un material amb una *Image Texture* que carregui `paleta-castaween.png`, connectada a *Base Color*. A la textura, posa la interpolació en **Closest**, perquè no es barregin colors.
3. A l'*UV Editor*, obre també `paleta-castaween.png` com a imatge de fons.
4. **Colors plans:** selecciona les cares d'un color, fes **U → Unwrap**, escala l'illa UV fins a 0 (**S 0**) i mou-la al centre de la casella que vulguis.
5. **Degradats:** fes **U → Unwrap** (o *Project from View*), escala l'illa a 0 en vertical (**S Y 0**) i col·loca-la dins d'una franja de degradat. L'amplada de l'illa decideix quina part del degradat es veu: el costat clar és a l'esquerra.
6. **Ulls:** modela l'ull com un pla de 6–8 costats, fes **U → Project from View** des de davant i encaixa l'illa dins de la casella de l'ull, amb una mica de marge.
7. Les peces que han de ser del color del curs (el mocador, el xal…) van a la fila magenta o al degradat CURS.
8. Exporta amb **Data → Material: Export** i **Images: Automatic**: la paleta queda dins del `.glb`.

## Requisits tècnics

| Element | Triangles màx. | Ossos màx. | Pes màx. | Alçada al joc |
|---|---|---|---|---|
| Castanyera | 1.500 | 20 | 400 KB | modela-la a 1,8 m |
| Carabassa | 800 | 12 | 250 KB | 1,5 m |
| Fantasma | 800 | 12 | 250 KB | 1,9 m |
| Carabassot | 2.000 | 20 | 500 KB | 3,3 m |
| Castanyer | 500 | — | 150 KB | 4,3 m |
| Pi del bosc | 200 | — | 80 KB | 6 m |
| Casa del poble | 800 | — | 250 KB | 4,6 m |
| Roca | 150 | — | 60 KB | 1,4 m |
| Tram de marge | 100 | — | 60 KB | 1,1 m d'alt, 1,2 m de llarg |
| Làpida | 150 | — | 60 KB | 0,85 m |
| Arbre sec | 300 | — | 100 KB | 3,2 m |
| Carabassa decorativa | 300 | — | 100 KB | 0,65 m |
| Cripta | 800 | — | 250 KB | 4 m |
| Portal de Halloween | 1.500 | — | 400 KB | 1,6 m |
| Paradeta de castanyes | 1.500 | — | 400 KB | 3,6 m |
| Foguera (olla) | 800 | — | 250 KB | 1 m |
| Torradora (defensa) | 600 | — | 200 KB | 1,3 m |
| Caixa d'armes | 200 | — | 80 KB | 0,6 m |
| Panellet | 200 | — | 80 KB | 0,55 m |
| Tronc de llenya | 80 | — | 40 KB | 0,24 m |

**Per què aquests números.** En una partida hi ha 50 castanyeres a l'arena (10 per curs) i fins a 50 monstres a la vegada, i els elements d'escenari es repeteixen molts cops (hi ha uns 260 trams de marge i fins a 110 pins). Amb aquests límits, en el pitjor cas l'escena queda al voltant dels 250.000 triangles, que és el que un mòbil de gamma mitjana pot moure de manera fluida.

El joc escala cada model a l'alçada de la taula. Tot i així, modelar a mida real evita sorpreses.

### Regles per a tots els models

- **Un material, amb la paleta oficial com a única textura** (obligatori). Res de textures pròpies, ni colors de material o de vèrtex, ni la paleta retocada.
- **Transformacions aplicades** a Blender (**Ctrl + A → All Transforms**).
- **Origen a terra**, al centre de la base (entre els peus, en el cas dels personatges).
- **Mirant cap a −Y**: és a dir, de cara quan mires la vista frontal de Blender (tecla 1 del teclat numèric). Per a l'escenari, la cara principal (la porta, el taulell…) també va cap a −Y, perquè el joc la gira cap a la plaça.
- **Sense *shape keys*, ni modificadors sense aplicar, ni càmeres ni llums.**
- **Totes les peces amb UV** mapejades a la paleta.
- Formes clares i un cap gran: el joc es veu des de dalt i de lluny, i els detalls de menys de 5 cm no es veuen. Per als ulls, fes servir les caselles d'ulls de la paleta.

### Castanyeres

- Alçada 1,8 m. Les proporcions de cap gran funcionen millor.
- El mocador o el xal han d'anar a la fila magenta o al degradat CURS, perquè es vegi de quin curs ets.
- Els ulls, a les caselles d'ulls de castanyera.
- **Esquelet opcional.** Si no en té, el joc l'anima automàticament amb rebots i inclinació. Si en té, màxim 20 ossos.
- **Animacions**, amb aquests noms exactes:

| Nom | Què és | Durada | Bucle |
|---|---|---|---|
| `idle` | quieta, respirant | 1–3 s | sí |
| `corre` | correr | 0,5–0,8 s | sí |
| `llanca` | llançar una castanya | 0,3–0,5 s | no |
| `cop` | rebre un cop | 0,2–0,4 s | no |

Obre `plantilles/plantilla-castanyera.glb` a Blender (**File → Import → glTF**) per veure-ho tot fet: alçada, orientació, mapejat a la paleta, 4 ossos (`arrel`, `cos`, `cap`, `bras`) i les 4 animacions.

### Monstres

Mateixes regles. Les animacions són `camina` (bucle) i `ataca` (sense bucle). La fila magenta es torna lila de Halloween.

### Escenari

- Els models se substitueixen a les mateixes posicions que els originals i amb la mateixa àrea de col·lisió. Mantén una mida semblant a la de la taula.
- El **tram de marge** es repeteix en fila: ha de fer 1,2 m de llarg (eix X) perquè no quedin forats.
- La **paradeta**, la **foguera** i la **torradora** fan servir la fila magenta per al color del curs.
- A la **caixa d'armes**, la fila magenta pren el color de l'arma (taronja de foc, groc de ràfega, granat de bazooka).
- Al **panellet**, la fila magenta és la massapà: crema als normals i daurat al panellet daurat.

## Exportar des de Blender

**File → Export → glTF 2.0** amb aquestes opcions:

- **Format:** glTF Binary (`.glb`)
- **Include → Limit to:** Selected Objects (selecciona el model i, si en té, l'esquelet)
- **Transform:** +Y Up activat
- **Data → Mesh:** Apply Modifiers, UVs i Normals activats
- **Data → Material:** Export, amb **Images: Automatic** (la paleta queda incrustada)
- **Animation:** activat, una acció per animació amb els noms de la taula
- **Compression:** desactivada (el joc no llegeix la compressió Draco)

**Nom del fitxer:** `curs-cognom-nom.glb`, en minúscules, sense accents ni espais. Per exemple: `3d-garcia-marta.glb`.

## Afegir un model al joc

### Opció recomanada: entrega i aprovació en línia

Al menú del joc, **Envia el teu model GLB** obre el formulari amb nom, curs, tipus i proposta. El professor obre les entregues des del seu panell privat i comparteix un codi de 6 xifres. Cal descarregar i usar la paleta oficial sense retocar-la. El servidor comprova tots els píxels del PNG incrustat (admet també la paleta oficial antiga de 256 px per compatibilitat), els límits i el format GLB. Les propostes pendents són privades. En aprovar-les entren automàticament al catàleg; en rebutjar-les o tornar-les a pendent en surten. Recarregueu tots els dispositius abans de començar la sala. No cal modificar `assets.json`.

### Alternativa: integració manual al repositori

1. Copia el `.glb` a la carpeta que toca (`assets/castanyeres/`, `assets/monstres/` o `assets/escenari/`).
2. Afegeix-lo a `assets/assets.json`. L'entrada la genera el Taller.

```json
{
  "castanyeres": [
    { "id": "torradora-marta", "nom": "La Torradora", "autor": "Marta Garcia",
      "curs": "3D i videojocs", "fitxer": "castanyeres/3d-garcia-marta.glb" }
  ],
  "monstres": {
    "carabassa": "monstres/3d-puig-pol.glb",
    "fantasma": "monstres/3d-vila-jana.glb",
    "carabassot": "monstres/3d-roca-nil.glb"
  },
  "escenari": {
    "castanyer": "escenari/3d-serra-ona.glb",
    "casa": "escenari/3d-font-biel.glb"
  }
}
```

Les castanyeres apareixen al configurador (**Personatge → Model**) amb el nom de l'autor. Els bots també les fan servir, i prefereixen les del seu curs.

Claus de l'escenari: `castanyer`, `pi`, `casa`, `roca`, `marge`, `lapida`, `arbre-sec`, `carabassa-deco`, `cripta`, `portal`, `paradeta`, `foguera`, `torradora`, `caixa`, `panellet`, `llenya`.

### Diverses propostes per tipus: tots els alumnes hi participen

Cada clau de `monstres` i `escenari` pot contenir una **llista de propostes**, amb identificador únic dins del tipus, nom, autor, curs i fitxer. No sobreescriviu la proposta del company: afegiu un objecte més a la mateixa llista.

```json
{
  "monstres": {
    "carabassa": [
      { "id": "carabassa-marta", "nom": "La dentuda", "autor": "Marta", "curs": "3D i videojocs", "fitxer": "monstres/3d-garcia-marta.glb" },
      { "id": "carabassa-pol", "nom": "La rondinaire", "autor": "Pol", "curs": "3D i videojocs", "fitxer": "monstres/3d-puig-pol.glb" }
    ]
  },
  "escenari": {
    "castanyer": [
      { "id": "arbre-ona", "nom": "Castanyer d'Ona", "autor": "Ona", "fitxer": "escenari/3d-serra-ona.glb" },
      { "id": "arbre-biel", "nom": "Castanyer de Biel", "autor": "Biel", "fitxer": "escenari/3d-font-biel.glb" }
    ]
  }
}
```

- **Monstres, torradores, caixes, panellets i llenya:** les noves aparicions recorren les propostes per torns, sense sorteig que pugui deixar-ne alguna fora. Cada tipus té el seu torn independent. Les peces que ja són al camp mantenen el model fins que desapareixen.
- **Arbres, edificis i escenari fix:** les propostes es reparteixen entre les posicions existents. A cada ronda es mostra el següent grup. Un portal amb tres propostes mostra la primera a la ronda 1, la segona a la ronda 2 i la tercera a la ronda 3. Si hi ha més propostes que llocs o aparicions, calen més rondes per veure-les totes.
- **Mode en línia:** l'amfitrió tria la proposta dels elements dinàmics i n'envia l'ID als mòbils. Tothom ha de recarregar la mateixa versió publicada abans d'obrir o entrar a la sala.
- **Compatibilitat:** el camí únic antic (`"carabassa": "monstres/pol.glb"`) continua funcionant. També s'accepta una llista de camins. Si falta `id`, s'utilitza el camí del fitxer. Un ID repetit dins d'un tipus es descarta i queda registrat com a error.
- **Errors:** un fitxer que falla no impedeix carregar els dels companys. Si no es carrega cap proposta d'un tipus, es conserva el model integrat. La càrrega i memòria augmenten amb el nombre de models; respecteu els pressupostos i eviteu variants duplicades del mateix fitxer.

El Taller genera l'entrada amb les dades d'autoria per a qualsevol tipus de model. Les proves locals del Taller substitueixen temporalment aquell tipus només al dispositiu; per compartir les entregues, afegiu-les a les llistes del manifest i publiqueu els GLB.

## So i música

El joc ja porta tots els sons com a fitxers a `assets/so/`. Per substituir-ne un, posa el fitxer nou a la mateixa carpeta i canvia el camí a `assets.json`, o sobreescriu el fitxer amb el mateix nom.

**Música** (`so.musica`): `menu`, `partida` i `nit` (l'últim minut, la Nit de Difunts). Són bucles: el final ha d'enllaçar amb el principi. Si no hi ha música de `nit`, sona la de `partida`. Format WAV o OGG per als bucles; l'MP3 pot deixar un petit silenci quan torna a començar.

**Efectes** (`so.efectes`), en MP3 i curts (menys d'1 s, tret dels indicats):

| Clau | Quan sona |
|---|---|
| `llancament` | llances una castanya |
| `llancament-foc` | llances una castanya de foc |
| `bazooka` | dispares el bazooka de moniato |
| `impacte` | una castanya toca un monstre o una castanyera |
| `mal` | et fan mal a tu |
| `monstre` | cau una carabassa |
| `fantasma` | cau un fantasma |
| `explosio` | esclata un moniato o cau el Carabassot (fins a 1,5 s) |
| `llenya` | recolleixes llenya |
| `arma` | agafes una caixa d'armes |
| `panellet` | menges un panellet |
| `entrega` | entregues llenya a la foguera |
| `caiguda` | caus |
| `aparicio` | tornes a l'arena |
| `torradora` | construeixes una torradora |
| `foguera-cop` | algú fa caure llenya d'una foguera |
| `carabassot` | arriba el Carabassot (fins a 2 s; pot ser una veu) |
| `campana` | comença la Nit de Difunts (fins a 3 s; pot ser una veu) |
| `clic` | botons del menú |
| `final-ronda` | s'acaba la ronda |

Normalitza el volum de tots els efectes al mateix nivell. Els sons d'impacte es reprodueixen amb una petita variació de to perquè no cansin.

## Interfície i menú

A `assets.json`, apartat `ui`:

```json
"ui": {
  "css": "ui/tema.css",
  "logo": "ui/logo-castaween.png",
  "fons": "ui/fons-menu.mp4"
}
```

- **`css`**: full d'estil que sobreescriu el del joc. Parteix de `ui/tema-exemple.css`, que té totes les variables de color i tipografia i la llista de peces de la interfície.
- **`logo`**: imatge PNG o SVG amb fons transparent, que substitueix el títol del menú. Mida recomanada: 1200 × 400 px.
- **`fons`**: fons del menú principal. Pot ser una imatge (JPG o WebP, 1080 × 1920 px en vertical) o un vídeo en bucle (MP4, sense so, menys de 3 MB).

El joc es juga en vertical al mòbil. Dissenyeu a 390 × 844 px i comproveu que res no quedi tapat pels botons de joc.

## Equilibri del joc

`assets/config.json` conté la munició i la cadència de les armes, la vida, la velocitat, el mal i la llenya dels monstres, i la velocitat i la cadència dels bots. Si canvieu els números i recarregueu la pàgina, el joc els aplica.

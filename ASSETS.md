# Castaween · Guia d'assets

Aquesta guia explica com substituir qualsevol element del joc (personatges, monstres, escenari, so, música i interfície) per material fet per l'alumnat, i quins requisits ha de complir perquè el joc vagi fluid al mòbil.

Per començar a classe: la carpeta **`carpeta-alumnat/`** té tot el que necessita l'alumnat (guia visual en PDF, fitxer d'inici de Blender, paleta i models de referència). Comprimeix-la i passa-la a la classe.

> **Paleta obligatòria.** Tots els models s'han de texturitzar amb [`paleta-castaween.png`](assets/paleta-castaween.png) ([guia de colors](assets/paleta-guia.png)), sense modificar-la. És l'única textura admesa: el joc sempre dibuixa els models amb la paleta oficial. Així tot el joc té el mateix estil gràfic.

## Com funciona

### Descarrega models per treballar a escala

La carpeta [**assets/ al web**](https://xavikai.github.io/castaween/assets/) té botons de descàrrega i instruccions per a Blender:

- [**Castanyera de referència (.glb)**](assets/castanyeres/castanyera-nova.glb): l'única castanyera del joc, a **1,80 m**. Fa **1,119 m d'ample** i **1,234 m de fondària** (amb faldilla i cistell), 1.450 triangles i la paleta oficial com a única textura, ulls inclosos.
- [**Plantilla animada (.glb)**](assets/plantilles/plantilla-castanyera.glb): també de **1,80 m**, amb la paleta oficial, esquelet i les quatre animacions.
- [**Paleta obligatòria (.png)**](assets/paleta-castaween.png) i [**guia de la paleta**](assets/paleta-guia.png): l'única textura que es pot fer servir.
- [**Instruccions d'escala**](assets/plantilles/LLEGEIX-ME.md) i [**mides exactes**](assets/plantilles/mides-castanyera.json).
- **Monstres, arbres i objectes**: [19 models GLB al catàleg](https://xavikai.github.io/castaween/assets/#resta-models), [mides de cada model](assets/referencies/mides-models.json) i [instruccions](assets/referencies/LLEGEIX-ME.md). Inclou els tres monstres i tots els elements d'escenari substituïbles de la taula tècnica, ajustats a les alçades d'entrega. El tram de marge també fa **1,20 m de llarg (X)**. Són exemplars estàtics de les geometries integrades, amb els colors originals, sense efectes ni animacions; cal adaptar-los a la paleta i als límits si es reutilitzen com a entrega.
- [**Descarrega tot el conjunt en ZIP**](assets/referencies/castaween-referencies.zip): els 19 models, la castanyera de referència, la plantilla animada, les mides, les instruccions i la paleta.

A Blender, feu servir **Metric · Unit Scale 1.000 · Meters**. La castanyera s'entrega a **1,80 m d'alt**, amb l'origen a terra. Amplada i fondària són orientatives per comparar siluetes. Tot plegat també és a `carpeta-alumnat/`.

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

## Material per a l'alumnat

L'aplicació no té cap eina per crear, provar ni enviar models: això es treballa a classe. La carpeta `carpeta-alumnat/` conté:

- `GUIA-castaween.pdf`: guia visual pas a pas (tria, Blender, pintar amb la paleta, ulls, color del curs, revisió, exportació i entrega).
- `castaween-inici.blend`: fitxer de Blender preparat (metres, material `paleta` amb interpolació Closest, totes les referències en col·leccions bloquejades i estadístiques al visor). Necessita Blender 4.5 o més nou.
- `paleta-castaween.png` i `paleta-guia.png`.
- `models-referencia/`: la castanyera i els 19 models de monstres i escenari, ja pintats amb la paleta.

Els fitxers font de la guia són a `tools/guia-alumnat/`.

## La paleta obligatòria

Tots els models fan servir la mateixa textura, `paleta-castaween.png` (512 × 512 px). **És obligatòria i no es pot modificar ni substituir per cap altra.** És a `carpeta-alumnat/` i al [catàleg de models](https://xavikai.github.io/castaween/assets/).

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
- **Color del curs automàtic.** La fila de baix dels colors plans i el degradat **CURS** (magenta) no surten mai magenta: el joc els substitueix pel color de l'equip de qui juga. El magenta clar dona el color clar i el fosc, el fosc.

**Com es controla.** El professor revisa els models abans d'afegir-los. A més, el joc sempre dibuixa els models amb la paleta oficial, encara que el fitxer en porti una altra.

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

**Per què aquests números.** En una partida hi ha unes 50 castanyeres a l'arena (10 per equip, fins a 75 si la sala és plena) i fins a 50 monstres a la vegada, i els elements d'escenari es repeteixen molts cops (hi ha uns 260 trams de marge i fins a 110 pins). Amb aquests límits, en el pitjor cas l'escena queda al voltant dels 250.000 triangles, que és el que un mòbil de gamma mitjana pot moure de manera fluida.

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
- El mocador o el xal han d'anar a la fila magenta o al degradat CURS, perquè es vegi de quin equip ets.
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

### Integrar un model al repositori

1. Copia el `.glb` a la carpeta que toca (`assets/castanyeres/`, `assets/monstres/` o `assets/escenari/`).
2. Afegeix-lo a `assets/assets.json` seguint l'exemple de sota.

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

Les castanyeres apareixen al primer pas d'entrada (**La teva castanyera**) i al configurador (**Personatge → Model**), amb el nom de l'autor. La tria es desa al dispositiu: l'alumne juga sempre amb la mateixa fins que en triï una altra. Els bots les van agafant per torns i **canvien de model cada cop que reapareixen**, així a cada partida surten les castanyeres de tothom.

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

- **Monstres, torradores, caixes, panellets i llenya:** cada aparició nova agafa la proposta següent (si hi ha tres fantasmes, surten 1, 2, 3, 1, 2, 3…), sense sorteig que pugui deixar-ne alguna fora. Cada tipus té el seu torn independent. Les peces que ja són al camp mantenen el model fins que desapareixen.
- **Arbres, edificis i escenari fix:** les propostes es reparteixen entre les posicions existents. A cada ronda es mostra el següent grup. Un portal amb tres propostes mostra la primera a la ronda 1, la segona a la ronda 2 i la tercera a la ronda 3. Si hi ha més propostes que llocs o aparicions, calen més rondes per veure-les totes.
- **Mode en línia:** l'amfitrió tria la proposta dels elements dinàmics i n'envia l'ID als mòbils. Tothom ha de recarregar la mateixa versió publicada abans d'obrir o entrar a la sala.
- **Compatibilitat:** el camí únic antic (`"carabassa": "monstres/pol.glb"`) continua funcionant. També s'accepta una llista de camins. Si falta `id`, s'utilitza el camí del fitxer. Un ID repetit dins d'un tipus es descarta i queda registrat com a error.
- **Errors:** un fitxer que falla no impedeix carregar els dels companys. Si no es carrega cap proposta d'un tipus, es conserva el model integrat. La càrrega i memòria augmenten amb el nombre de models; respecteu els pressupostos i eviteu variants duplicades del mateix fitxer.

Per alternar també amb el model original del joc, incloeu una proposta sense fitxer: `{ "id": "integrat-pi", "nom": "Original de Castaween", "integrat": true }`. Compta com una variant més en el torn. En escenari fix es conserva la geometria original a les posicions que li corresponen; en línia es replica amb l'identificador buit del model integrat.

Una proposta pot indicar `altura` (metres) per ajustar-ne l'escala sense deformar-la. Per exemple, el portal pla de Quim fa uns 5,5 m de diàmetre i té `altura: 0.32`; escalar-lo a l'alçada general d'1,6 m el faria massa gran. El panet d'Axel té `altura: 0.24` per encaixar com a recollible. `nomCombat` permet donar un nom als avisos d'un enemic: la Mortícia de Clara és una variant del Carabassot, amb les mateixes estadístiques i recompenses, i no apareix entre les castanyeres jugables.

La integració de les 25 entregues d'octubre de 2026, les optimitzacions i el procediment de retorn són a [l'informe del professorat](documentacio-professorat/ASSETS-ALUMNAT-2026-10-28.md).

Per publicar les entregues, afegiu-les a les llistes del manifest i pugeu els GLB al repositori.

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

## Interfície i menú (alumnat de Disseny)

L'alumnat de Disseny pot canviar **l'aspecte** de la interfície: textos, colors, lletres, cantonades i tres imatges. **La posició i la mida dels menús i dels botons no es poden canviar**, perquè el joc continuï funcionant bé al mòbil.

### Com treballa l'alumnat

1. Obre **`disseny.html`** del joc (per exemple `https://xavikai.github.io/castaween/disseny.html`).
2. A la dreta hi ha el panell: **Colors**, **Lletres**, **Textos**, **Imatges** i **Entrega**. A l'esquerra es veu el joc de veritat, en format mòbil o ordinador, i es pot anar a cada pantalla (Inici, Entrada, Partida, Pausa, Resultats…).
3. Tot es desa sol al navegador. A **Entrega** escriu el seu nom i descarrega un ZIP (`disseny-nom.zip`). Amb el mateix ZIP pot continuar en un altre ordinador (**Obre un ZIP per continuar**).

Què es pot canviar:

| Apartat | Què | Límits |
|---|---|---|
| Colors | 11 colors (principal, fons, targetes, panells, text, línies, Halloween, perill, vida) | Els panells i les línies poden ser transparents |
| Lletres | Lletra dels títols i lletra del text, de Google Fonts | La mida del text no canvia |
| Cantonades | De rectes a molt rodones | — |
| Textos | Tots els textos dels menús, el HUD, la pausa i els resultats, i els botons d'entrada | Només `<b>`, `<i>`, `<small>` i `<br>`; la resta s'elimina |
| Imatges | Logo del títol, fons del menú (imatge o vídeo) i icona del botó LLANÇA | Logo 300 KB, fons 800 KB (vídeo 3 MB), icona 100 KB. Sempre ocupen la mateixa caixa |

### Com afegir un disseny al joc

1. Descomprimeix el ZIP dins de `assets/ui/`. Queda una carpeta com `assets/ui/disseny-marta/` amb `tema.json`, `textos.json` i les imatges.
2. **Per provar-lo** sense canviar res: obre el joc amb `?ui=ui/disseny-marta` (per exemple `index.html?ui=ui/disseny-marta`). Així podeu comparar els dissenys de la classe un per un.
3. **Per fer-lo servir sempre**, a `assets.json`:

```json
"ui": { "carpeta": "ui/disseny-marta" }
```

Els textos que l'alumne no ha tocat no surten a `textos.json` i es queden com al joc. Si en una versió nova del joc canvia algun text, el disseny no el tapa.

### Opcions avançades (només professorat)

Continuen funcionant les claus antigues `css` (full d'estil lliure), `logo` i `fons` dins de `ui`. Un full CSS lliure sí que pot moure i canviar mides; no el feu servir per a les entreges de l'alumnat.

## Equilibri del joc

`assets/config.json` conté la munició i la cadència de les armes, la vida, la velocitat, el mal i la llenya dels monstres, i la velocitat i la cadència dels bots. Si canvieu els números i recarregueu la pàgina, el joc els aplica.

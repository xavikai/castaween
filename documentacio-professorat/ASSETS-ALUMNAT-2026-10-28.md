# Assets de l'alumnat · 28/10/2026

25 entregues incorporades: 12 monstres i 13 elements d'escenari o recollibles, amb autoria i alternant amb els originals. Les 25 còpies passen el validador real del servidor: paleta oficial intacta, UV, un material, pressupost de triangles i mida de fitxer. Els originals de Downloads no s'han sobreescrit.

## Correspondències

| Autoria | Entregues i destí al joc |
|---|---|
| Mariia Khliebnikova | Carabassa, fantasma i pi |
| Alba Esteve | Caixa d'armes, carabassa i fantasma |
| Axel Feliu | Arbre sec, panet com a panellet i pi del bosc |
| Bernat Fullana | Casa, cripta i làpida |
| Clara Gamell | La castanyera passa a ser **Mortícia**, variant del **Carabassot** |
| Yuheng Liang | Fantasma i làpida |
| Anna Oliveras | Carabassa, fantasma i paradeta de castanyes |
| Quim Paneque | Fantasma i portal |
| Lissy Rodríguez | Fantasma |
| Alejandro Torres | Carabassot, fantasma, foguera i làpida |

La Mortícia conserva la mateixa vida, velocitat, mal, aparicions i recompenses del Carabassot; té nom propi als avisos i eliminacions i no apareix entre les castanyeres jugables. El panet d'Axel conserva la curació del panellet. La resta de correspondències segueixen el nom de l'entrega. Els fitxers publicats són a `assets/monstres/alumnat/` i `assets/escenari/alumnat/`, i el manifest conserva els noms d'autoria.

## Alternança i escala

- Cada tipus conserva la variant procedural original amb una entrada `integrat: true`. Cada aparició dinàmica agafa la següent variant, inclosa l'original; l'amfitrió sincronitza l'identificador amb els clients. L'identificador buit continua representant el model original en línia.
- En escenari fix es reparteixen variants per posició i es renoven cada ronda. El portal únic mostra l'original a la ronda 1, el de Quim a la 2 i l'original a la 3. Cases, làpides, pins, arbres secs i criptes conviuen amb les originals dins la mateixa ronda.
- Fogueres i paradetes fan servir un únic model de cada tipus per ronda, compartit pels cinc equips, conservant el color de cadascun. Amb les entregues actuals, tots fan servir els models d'Alejandro i Anna a la ronda 1, els originals a la ronda 2, els de l'alumnat a la ronda 3, i així successivament. El manifest i l'importador conserven aquest ordre.
- Es conserven les geometries i transformacions originals, també les instàncies i els resplendors de les finestres. Canviar de ronda les amaga o restaura sense perdre-les.
- El portal pla de Quim s'ajusta a 0,32 m d'alt per mantenir uns 5,5 m de diàmetre; el panet a 0,24 m d'alt. Els models s'escalen uniformement, sense deformar-los.
- Les col·lisions, la vida, el moviment, les regles i les recompenses mantenen els valors que ja tenia el joc.

## Optimitzacions de les còpies publicades

| Entrega | Triangles originals | Triangles publicats |
|---|---:|---:|
| Fantasma de Yuheng | 990 | 788 |
| Fantasma d'Anna | 2.270 | 788 |
| Làpida de Yuheng | 212 | 138 |

Primer es dissolen cares coplanàries respectant les fronteres d'UV i material; després es redueix només la geometria que encara supera el pressupost. S'ha comparat visualment l'exportació amb l'original.

Les peces estàtiques de la Mortícia (24 malles) i dels models d'Alejandro amb diverses malles s'han agrupat en una sola malla, conservant transformacions i paleta. Els fitxers que no necessitaven adaptació són còpies idèntiques als entregats. Cap original de Downloads s'ha modificat.

## Verificació

- 37 proves automàtiques correctes, incloent el validador GLB complet per a les 25 entregues, la rotació amb la variant original, un model de foguera i paradeta compartit pels cinc equips i l'identificador de xarxa buit.
- Prova amb Three.js r128 real: instàncies, grups i punts de llum originals es poden amagar i restaurar sense perdre transformacions ni materials.
- Joc real en navegador: 25 variants carregades, cap error; portal original → Quim → original en tres rondes; els tres caps es representen correctament amb 18 punts de vida al començament de ronda.
- Previsualitzacions de tots els models originals i integrats, i captura dels tres caps dins del joc, a `output/assets-alumnat/` (fitxers generats, exclosos de Git).

## Pla per tornar a la versió anterior

El punt de retorn és el commit **61131d7**, conservat a GitHub amb l'etiqueta [castaween-abans-assets-alumnat-2026-10-27](https://github.com/xavikai/castaween/tree/castaween-abans-assets-alumnat-2026-10-27). L'etiqueta es va crear abans de començar, el 27/10 a la nit. Inclou el registre de temps local que ja funcionava.

La integració inicial es desa al commit **6c4e5c6**, amb el missatge **Incorpora 25 assets de l'alumnat alternant amb els originals**. Els ajustos posteriors es desen en commits separats. Per retirar-la:

1. Identifica aquest commit amb `git log --oneline --grep="Incorpora 25 assets"`.
2. Reverteix primer els ajustos posteriors dels assets, del més recent al més antic. Després executa `git revert --no-edit 6c4e5c6` i `git push origin main`.
3. Espera el desplegament de Cloudflare Pages i recarrega els navegadors del professor i dels alumnes.

Això crea un nou commit que desfà la integració, conserva l'historial i recupera els models anteriors. El Worker i la base de dades d'estadístiques no es modifiquen amb aquesta integració. Els originals dels alumnes continuen a la carpeta d'entrega i les còpies romanen recuperables a l'historial de GitHub.

## Reproduir la importació

`node tools/import-class-assets.mjs CARPETA_ENTREGA` copia els models i genera `output/assets-alumnat/import-plan.json`. Després executa Blender en segon pla amb `tools/optimize-class-assets.py` i aquest pla. El primer pas copia les entregues sense optimitzar: no s'ha de publicar sense fer el segon pas i passar les proves.

`tools/audit-class-assets.mjs` permet revisar els GLB. `tools/preview-class-assets.py` renderitza les vistes de comparació sense modificar-los. `tools/contact-sheet-class-assets.py` en fa un full de contacte amb Pillow. `node tools/check-original-rotation.cjs RUTA_THREE_R128` comprova l'alternança de la geometria original sense WebGL. Les previsualitzacions i el pla de treball són fitxers generats exclosos de Git.

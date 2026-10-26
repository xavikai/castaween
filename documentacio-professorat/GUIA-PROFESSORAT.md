# Castaween · Guia del professorat

## Material que has de compartir

Passa a l'aula **lliurament/castaween-alumnat.zip**. L'alumnat ha de descomprimir-lo sencer, llegir COMENCA-AQUI.md i obrir GUIA-castaween.pdf. El paquet inclou l'escena Blender, la paleta, 20 referències, una plantilla animada opcional, la taula de mides i una fitxa d'entrega.

Prepara Blender 4.5 o més nou. Si no és possible, la guia visual explica com començar en una escena nova i importar el GLB de referència. Prova l'escena en un ordinador de l'aula abans de la sessió.

## Preparació i proposta de sessions

1. Presenta el joc i reparteix els tipus de model. Admet diverses propostes del mateix tipus. Anota alumne, curs, tipus i nom de la proposta.
2. Indica la data i la carpeta o plataforma d'entrega. Cada alumne ha de tenir una còpia pròpia del projecte. No hi ha una data ni un canal d'entrega prefixats al paquet.
3. Primera sessió: obrir Blender, triar la referència i construir la silueta a escala.
4. Segona sessió: optimitzar triangles, mapar la paleta i revisar ulls i zones CURS.
5. Tercera sessió: exportar, reimportar en una escena buida, corregir errors i entregar. Rig i animació poden ser una ampliació.
6. Integra les propostes revisades i dedica una sessió al playtesting i al retorn.

## Recollida i revisió dels models

Demana .glb, .blend amb recursos empaquetats, fitxa omplerta i dues captures (vista general i UV/material). Nom base: curs-cognom-nom-tipus, sense accents ni espais.

El menú actual del joc no ofereix Taller ni enviament de models. El flux de classe és l'entrega al professorat i la integració dels fitxers revisats. Hi ha documentació antiga al repositori sobre formularis i revisió en línia; no la facis servir com a instrucció d'aquesta activitat.

Comprova cada GLB reimportant-lo en una escena buida:

- Model complet, dret i amb la base a terra; alçada normativa. Al tram de marge també cal X = 1,20 m.
- Un material i paleta oficial sense modificar, incrustada al GLB. Totes les peces amb UV; cap recurs extern.
- Triangles, pes i ossos dins dels màxims de mides-i-limits.csv. Compta el conjunt exportat, sense referències.
- Castanyera amb zones CURS. Revisa el canvi de color dins del joc després d'integrar-la.
- Animacions, si s'han treballat: castanyera idle, corre, llanca, cop; monstres camina i ataca. Sense rig també es pot fer l'activitat.
- Autoria, fitxa, font editable i captures identificables. Retorna una correcció concreta si hi ha errors.

## Integració al joc

Treballa en una còpia o branca del projecte. Conserva una còpia de l'estat anterior i de totes les entregues originals.

1. Copia els GLB a assets/castanyeres/, assets/monstres/ o assets/escenari/, segons el tipus.
2. Edita assets/assets.json seguint l'estructura i les claus existents. La secció «Diverses propostes per tipus» d'ASSETS.md explica les variants amb ID únic, nom i autor. Afegeix les noves propostes conservant les anteriors.
3. Serveix el projecte per HTTP. Obrir index.html amb doble clic no és una prova d'integració fiable perquè el navegador pot bloquejar la lectura dels assets.
4. Revisa visualment mida, orientació, materials, animacions i colors de curs. Prova més d'una ronda: les variants es reparteixen o alternen, i poden caldre diverses rondes per veure-les totes.
5. Publica quan ho hagis revisat i recarrega el joc als dispositius de l'aula.

## Criteris d'avaluació proposats

Proposta orientativa sobre 10 punts; comunica-la abans de començar.

| Criteri | Punts | Evidència |
|---|---:|---|
| Silueta i proposta pròpia | 2 | Forma llegible des de lluny i aportació respecte de la referència |
| Escala, origen i orientació | 2 | Alçada correcta, base a terra i davant coherent |
| Paleta i UV | 2 | Únic material, textura oficial, UV correctes i CURS quan correspon |
| Optimització i exportació | 2 | Triangles/pes dins dels límits i GLB reimportat sense errors |
| Entrega i procés | 2 | Font editable, fitxa, captures i noms clars |

L'animació només s'avalua si s'ha inclòs expressament a l'encàrrec. Els requisits tècnics que impedeixen la integració s'han de corregir encara que altres apartats estiguin ben resolts.

## Participació dels altres cicles

- Disseny: identitat, icones i proposta d'interfície. Punt de partida: assets/ui/tema-exemple.css.
- Fotografia: referències de vestuari i objectes, fotografies del procés i material per al menú.
- Audiovisuals: Foley, música en bucle i tràiler; acorda formats i durades amb el docent responsable abans de produir.
- Gràfica interactiva: playtesting, registre de resultats i propostes d'equilibri.

PROJECTE-CICLES.md amplia les idees de col·laboració i ASSETS.md recull formats i claus d'integració. Aquest ZIP d'alumnat està centrat en l'activitat de modelatge 3D.

## Regenerar els paquets

Des de l'arrel del repositori: python tools/prepara-material-classe.py. Requereix reportlab, pypdf i Pillow. Regenera la taula de mides, el PDF del professorat i els dos ZIP de lliurament; conserva la guia visual i el .blend existents.

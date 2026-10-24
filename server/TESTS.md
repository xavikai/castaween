# Verificació · 23/10/2026

## Automàtica

`node --test server/test/*.test.js`: **9 proves, 9 correctes**.

- Els nicknames dels avisos d'eliminació s'escapen com a text, sense interpretar HTML de l'usuari.

- Inputs a 10 Hz, només quan canvien; conservació del toc curt i enviament de l'alliberament.
- Diferències de camps i eliminacions; la instantània d'un nou alumne no modifica la base del broadcast.
- Deu places humanes, cua FIFO, entrada del primer en desconnectar algú i bot si queda una plaça buida.
- Un personatge reapareixent conserva la seva plaça: una nova entrada no crea onze actius quan reapareix.
- Inputs i entrada només cap a l'amfitrió, amb identificadors assignats pel servidor.
- Només l'amfitrió pot enviar estat; instantànies dirigides a un únic alumne.
- Reconstrucció del repetidor sobre attachments existents després d'hibernar.
- Tancament de sala quan surt l'amfitrió i rebuig de JSON incorrecte.

També: sintaxi del JavaScript d'`index.html`, `git diff --check` i `wrangler deploy --dry-run` correctes.

## Navegador i Worker desplegat

Proves amb l'amfitrió i tres pestanyes d'alumnes, primer en escriptori i després amb el joc dins de viewports de **390 × 844**. La capacitat d'override del navegador no canviava la mida efectiva: per això s'ha fet servir la ruta local `/mobile`, que emmarca l'aplicació amb aquestes dimensions. No és una emulació de dispositiu físic.

- Crear sala i mostrar codi; nombre de connexions per curs abans de començar.
- Codi `0000` sense sala: error clar, sense entrar a una partida falsa.
- Configurar nom i aspecte, entrar amb el codi real i rebre l'estat complet.
- Moviment amb input de prova i amb arrossegament del joystick vertical. La posició del mòbil i la de l'amfitrió coincideixen després d'interpolar.
- Llançament des del botó LLANÇA, amb projectils visibles en l'estat compartit.
- Completar un curs amb WebSockets addicionals reals: **11 persones, 10 jugant i 1 en cua**.
- Forçar una caiguda: la primera persona en cua entra i qui ha caigut queda esperant.
- Acostar un torn als 90 s: es produeix la rotació i el mòbil que surt mostra la pantalla de cua. Sense cua, els comptadors de torn deixen d'avançar.
- Tancar dos mòbils: primer es resol la cua; quan ja no n'hi ha, el curs queda amb **9 humans i 1 bot**.
- Final de ronda compartit, mateix guanyador i nombre de victòries; el mòbil no té botó per iniciar la següent. El professor inicia la ronda 2 i tots reben el temps reiniciat a 5:00.
- El professor continua fent servir la càmera automàtica i els controls del mode espectador local.

Es va detectar un tancament 1006 en una connexió unidireccional de l'amfitrió. S'ha afegit ACK sortint sense temporitzadors. En repetir la prova amb el Worker actualitzat, cada client addicional havia rebut **més de 1.800 estats, només 2 instantànies completes i més de 1.800 deltes**, mantenint les connexions. No s'ha identificat de forma concloent quin intermediari originava el primer tall.

Els controls locals han permès forçar caigudes, torns i finals de ronda. Després de publicar el commit del joc, s'ha repetit l'entrada amb un amfitrió i tres alumnes directament a GitHub Pages. Un alumne ha sortit i ha tornat a entrar com a espectador remot. La partida pública ha completat una ronda natural de cinc minuts sense errors de consola a l'amfitrió ni al mòbil inspeccionat; tots dos han mostrat Audiovisuals com a guanyador amb 55 de llenya i una victòria. També s'ha comprovat el tancament de l'amfitrió i la continuació amb el botó **Juga amb bots**.

No s'ha fet una prova amb cinquanta mòbils físics. Cal una prova de Wi-Fi al centre abans de la jornada. Les sales i els clients de prova s'han tancat en acabar.

## Actualització: nicknames i mode local sense codi

- Menú amb **Mode en línia** i **Mode local · bots** diferenciats.
- Nickname buit: avís clar i focus al camp. Nickname desat: es recupera a la següent entrada i es comparteix amb el configurador de Personatge.
- Mode local: nickname «Castanya», triar curs i **Comença partida local** obre directament l'arena amb bots. Cap pantalla de codi ni WebSocket de sala.
- Etiqueta «Castanya» visible sobre la castanyera humana al renderitzat 3D.
- Prova amb amfitrió, «Marta» de 3D i «Pau» d'Audiovisuals: una eliminació provocada amb el control QA genera **Pau elimina Marta** al professor i als dos clients. Els bots també apareixen als avisos quan cauen.
- Cap error de consola a l'amfitrió ni al mòbil inspeccionat durant aquesta prova.
- El Worker continua retransmetent el protocol; l'esdeveniment de baixa viatja dins dels missatges d'estat existents, sense afegir missatges periòdics.

## Configurador: figura i opcions sense solapament

- Vista de mòbil 390 × 844: figura en una àrea superior reservada, opcions amb desplaçament independent a sota. Els rectangles del menú i de la vista prèvia no se solapen, també després de seleccionar «Barret de palla» entre les opcions inferiors.
- Escriptori 1280 × 720: figura sencera a l'esquerra, opcions a la dreta; rotació amb arrossegament comprovada.
- La càmera s'enquadra segons l'espai disponible de la vista prèvia, també al Taller de models. En sortir del configurador es desactiva el desplaçament de projecció i es recupera l'enquadrament del joc.
- Desar l'aspecte des del mòbil i iniciar una partida local continua funcionant, sense pantalla de codi.

## Diverses propostes per tipus · 23/10/2026

- `node --test server/test/*.test.js`: 15 proves correctes. Inclou normalització del manifest antic i nou, autoria, errors independents, IDs duplicats, alternança per tipus, repartiment de 50 places, rotació d'un portal únic i identificadors de model a les instantànies i rèpliques.
- Prova real amb `node server/test/serve.cjs --proposals`: manifest de prova només al servidor local, amb dos models de carabassa, el fantasma en format de camí antic i tres propostes de castanyer, pi, portal, paradeta, torradora, caixa, panellet i llenya. No s'han afegit entregues fictícies al manifest publicat.
- Una pestanya d'amfitrió connectada al Worker desplegat i un mòbil en iframe de 390 × 844. Càrrega sense errors. Els dos mostren els mateixos IDs de monstres i objectes, incloent-hi les dues carabasses i variants de troncs reutilitzats.
- Canvi de ronda 1 a 2: tots dos reben el portal B en lloc de l'A i el repartiment renovat d'arbres/paradetes, sense perdre el mode espectador.
- Els arbres continuen utilitzant InstancedMesh agrupats per proposta. Les col·lisions, regles i mides d'integració són les que ja tenia el joc.
- `node tools/check-references.cjs test-results/three-r128.cjs test-results/GLTFLoader-r128.cjs`: les 19 referències GLB continuen carregant i mantenint les mides i l'origen. ZIP regenerat amb la documentació actualitzada.
- Límit pràctic: si hi ha més propostes que llocs o aparicions, calen més rondes per veure-les totes. La càrrega inicial i la memòria creixen amb la quantitat i el pes dels models. Els fitxers de cada alumne s'han de publicar i registrar al manifest.
- Revisió abans de publicar: es conserva la castanyera nova local com a model per defecte (1.450 triangles, un material, una textura, 150.424 bytes). Carrega i es veu al configurador sense errors de consola. El catàleg i el ZIP també la inclouen.
- Guia d'entregues a `assets/guia-entregues.html`, revisada al navegador; inclou passos per a alumnat/professorat, JSON, exportació, alternança, publicació i resolució d'errors.

## Paleta obligatòria · 24/10/2026

- Nova `assets/paleta-castaween.png` de 512 × 512 px generada amb `tools/build-palette.py`: el quadrant de dalt a l'esquerra és idèntic píxel a píxel a la paleta antiga de 256 px; s'hi afegeixen 16 degradats (inclòs un degradat CURS) i 16 ulls. L'script comprova que no hi hagi colors "magenta" fora de la fila i el degradat CURS.
- `node --test server/test/*.test.js`: 21 proves correctes en la verificació final. El servidor descodifica el PNG incrustat i compara el SHA-256 de tots els píxels RGBA amb la paleta oficial (`server/palette-signature.js`). Rebutja les referències sense textura, una paleta retocada (fins i tot un sol píxel), dues textures, una imatge que no és PNG i un material que no fa servir la paleta. Accepta la paleta oficial antiga de 256 px.
- Joc en Chromium sense interfície: la castanyera nova i la plantilla (migrades amb `tools/migrate-palette.py`) passen com a «Paleta oficial»; el fitxer de prova amb paleta antiga passa amb avís i les UV queden dins del quadrant (màxim 0,406); la paleta retocada i el model amb colors per vèrtex surten en vermell i el botó per provar-los queda amagat. Tots els materials dels models de l'alumnat es dibuixen amb la textura oficial.
- PDF de l'alumnat i ZIP de referències regenerats.

## Entregues i aprovació · 24/10/2026

- Les 21 proves inclouen autenticació, caducitat, CSRF, quotes, estructura GLB, privacitat dels fitxers pendents i publicació reversible.
- Flux HTTP comprovat amb Wrangler local: obrir entregues, rebutjar paleta alterada, enviar GLB vàlid, verificar que el públic rep 404 i el professor el pot previsualitzar, aprovar i retirar.
- Navegador: formulari real amb nom, curs, codi i GLB; comprovant d'enviament i aparició a Pendents. Previsualització privada amb rotació, confirmació de revisió i aprovació al panell.
- Joc local amb el catàleg del Worker local: el model aprovat apareix entre els monstres sense modificar assets.json; cap error de càrrega a la prova.
- PDF de cinc pàgines renderitzat i revisat visualment després d'actualitzar el circuit d'entrega. ZIP regenerat amb la guia i la paleta actuals.
- Es conserven els canvis manuals de la paleta de 512 px, els GLB migrats i el mode espectador. La simulació i el protocol de les sales no s'han canviat en aquesta actualització.
- Worker desplegat amb migració SQLite de ReviewStore (versió 794c36c8-4f2f-4fb1-b46f-ef29bae4d80e). La prova HTTP de producció passa les quatre comprovacions: paleta alterada rebutjada, pendent privat, aprovació pública i retirada. Acaba amb entregues tancades i cap model de prova aprovat.
- Panell de producció comprovat al navegador amb sessió privada i previsualització del GLB retirat. El secret de revisió està configurat a Cloudflare i el fitxer local està ignorat per git.

# Verificació · 23/10/2026

## Automàtica

`node --test server/test/*.test.js`: **8 proves, 8 correctes**.

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

Els controls locals han permès forçar caigudes, torns i finals de ronda; no s'ha esperat una ronda natural completa de cinc minuts ni s'ha fet una prova amb cinquanta mòbils físics. Cal una prova de Wi-Fi al centre abans de la jornada.

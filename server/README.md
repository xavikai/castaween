# Castaween · repetidor WebSocket de l'aula

Joc: https://xavikai.github.io/castaween/

Worker: https://castaween-relay.carrotrevoltstudio.workers.dev

Configuració pública: `assets/online.json`, amb `{"servidor":"wss://castaween-relay.carrotrevoltstudio.workers.dev"}`. No conté cap credencial. Les credencials de Wrangler es desen fora del repositori.

## A l'aula

1. Professor: obre el joc a l'ordinador del projector i prem **Obre una sala (professor)**. Comparteix el codi de quatre xifres; la pantalla mostra les persones de cada curs. Prem **Comença**.
2. Alumnes: configura **Personatge**, després **Juga → curs → codi → Entra a l'arena**. Mou-te amb el joystick i prem LLANÇA. Els controls i les regles són els del joc original.
3. El professor veu la partida amb el mode espectador existent: càmera automàtica, seguir castanyeres i vista general. Només ell inicia la ronda següent. **Mira una partida** permet entrar com a espectador remot, sense ocupar cap plaça.
4. Mantén l'ordinador del professor despert, connectat a Internet i el joc en primer pla. Tancar l'amfitrió tanca la sala. Per acabar, **Surt de la sala**. No deixis sales obertes quan no es fan servir.

Hi ha 10 places per curs, amb bots a les places buides. La persona número 11 va a la cua FIFO. Una caiguda o un torn de 90 s deixa entrar la primera de la cua; sense cua no hi ha límit de torn. Es manté la reaparició original de 3 s. Si algú es desconnecta, entra la primera de la cua o un bot. Les rondes duren 300 segons de simulació, amb l'acceleració de proves desactivada en línia.

**Juga amb bots** està sempre disponible. Si falta la configuració, el flux original amb bots continua funcionant. Si no es pot establir la connexió, s'inicia una partida local amb un avís. Un codi inexistent mostra un error i permet corregir-lo. Una interrupció durant la partida retorna al menú; es pot tornar a entrar o triar bots.

## Arquitectura

- `index.html` continua sent l'únic fitxer del joc. L'amfitrió executa la simulació existent de bots, monstres, projectils, llenya, fogueres, torradores, cues i rondes.
- `worker.js` dirigeix `/room/1234?role=host` o `/room/1234` a **un Durable Object per codi**. El primer socket amfitrió reserva el codi mentre està connectat. El navegador prova un altre codi si està ocupat.
- `wrangler.toml` declara `new_sqlite_classes = ["Room"]`, compatible amb Workers Free. No hi ha KV, base de dades de partides ni simulació al servidor.
- S'utilitza **WebSocket Hibernation API**: `state.acceptWebSocket`, `webSocketMessage`, `webSocketClose` i `webSocketError`. `serializeAttachment` conserva només rol, identificador i metadades de connexió/limitació quan el DO hiberna. No hi ha `setInterval`, alarmes ni sockets sortints al servidor.
- Les identitats les assigna el repetidor. Un alumne no pot enviar estat autoritari ni suplantar l'identificador d'un altre amb un camp JSON. El servidor limita mida i freqüència de missatges i valida els inputs.
- L'ACK sortint al professor, aproximadament cada segon, aprofita l'arribada d'estat i evita connexions unidireccionals inactives en proxys. No crea peticions entrants addicionals ni impedeix hibernar amb temporitzadors.

## Protocol

JSON, amb discriminador `t`:

```js
{t:"join", curs:0, nom:"Marta", look:{/* S.look */}}
{t:"input", mx:0.4, mz:-0.2, tir:true, construir:false, millorar:false}
{t:"estat", seq:12, full:false, up:[{id:"7",x:1.23,z:4.56}], del:["8"],
 meta:{/* fase, temps, cursos i ordre de cues */}, events:[{t:"impacte",x:1,z:2}]}
```

`curs` és l'índex 0–4 del curs al joc. `spectator:true` a `join` entra sense personatge; `millorar` conserva la millora de torradores dels canvis locals.

Inputs a un màxim de 10 Hz, només quan canvien; un toc curt de LLANÇA es conserva fins que s'ha enviat i s'envia després l'alliberament. Els inputs només es retransmeten al professor. L'amfitrió aplica la mateixa velocitat, cadència, punteria i construcció de la jugadora local.

Estat a 12 Hz durant el joc, amb posicions i valors decimals arrodonits a dues xifres. Fora de la ronda, 1 Hz. Cada entitat té un identificador estable: només s'envien camps modificats i identificadors eliminats. Una instantània completa s'envia en entrar, en iniciar la partida o per recuperar un salt de seqüència. No s'emmagatzemen instantànies al DO. Es sincronitzen també objectes, munició, vida, aspecte, cues, fogueres, nivells de torradores i esdeveniments de llançament, impacte, mort i entrega. Els mòbils interpolen les posicions durant 100 ms; no executen la simulació ni prediuen impactes.

## Pressupost del pla gratuït

Documentació oficial consultada el 23/10/2026:

- [Preus de Durable Objects](https://developers.cloudflare.com/durable-objects/platform/pricing/): Workers Free admet SQLite, 100.000 peticions/dia; els WebSocket entrants compten a 20:1 i els sortints no compten. Cada obertura WebSocket compta com una petició. També hi ha 13.000 GB-s/dia de durada; els límits són compartits amb altres DO del compte i es reinicien a les 00:00 UTC.
- [WebSockets i hibernació](https://developers.cloudflare.com/durable-objects/best-practices/websockets/).

Pitjor cas d'una ronda de 5 minuts amb 50 alumnes: tots canvien input contínuament a 10 Hz, i el professor emet a 12 Hz.

| Concepte | Càlcul | Peticions equivalents |
|---|---|---:|
| Inputs dels 50 alumnes | 50 × 10 × 300 / 20 | 7.500 |
| Estat de l'amfitrió | 12 × 300 / 20 | 180 |
| Entrada i instantània inicial de cada alumne | (50 + 50) / 20 | 5 |
| Obertura dels 51 WebSockets | 50 + 1 | 51 |
| Total, obrint una sala per ronda | | **7.736** |

**100.000 / 7.736 = 12 rondes completes/dia** en aquest escenari, amb unes 7.168 peticions de marge per espera, errors i resincronització. No és una garantia de capacitat quan el compte té altres consums. Amb les mateixes connexions obertes entre rondes, el límit pur de trànsit s'acosta a 13 rondes (13 × 7.680 + ~56 = 99.896), però el marge és massa petit per planificar-hi una jornada. Planifica **12** o menys.

La sala en espera/resultats emet 1 Hz: unes 180 peticions equivalents/hora, a més d'entrades i sortides. Els inputs que no canvien no s'envien, per tant l'ús real normalment és inferior al pitjor cas. Els ACK i les retransmissions sortints no afegeixen peticions. Amb l'assignació de 128 MB, fins i tot comptant tota la ronda com activa, el consum és inferior a 40 GB-s/ronda: el pressupost de peticions és el límit rellevant d'aquest càlcul. L'objecte no fa lectures/escriptures explícites de l'estat de joc a SQLite.

## Desenvolupar i desplegar

Des de `server/`:

```sh
npm install
npx wrangler login
# Alternativa quan localhost:8976 falla:
npx wrangler login --device --browser=false
npm test
npx wrangler deploy --dry-run
npx wrangler deploy
```

Copia el domini retornat a `assets/online.json`, amb `wss://` i sense `/room/...`. Fes commit i push a `main`; GitHub Pages publica la carpeta arrel. `/health` retorna JSON sense crear cap DO.

## Proves

`npm test` comprova encaminament, identitats, limitació d'inputs, recuperació d'attachments després d'hibernar, tancament de sala, diferències d'estat i admissió amb places reservades per reaparició.

Per repetir les proves del joc al navegador:

```sh
# Des de l'arrel del projecte:
node server/test/serve.cjs
```

Obre `http://127.0.0.1:53781/?qa=1` per a l'amfitrió i tres pestanyes `http://127.0.0.1:53781/mobile`. La ruta `/mobile` emmarca el joc en un viewport de 390 × 844; comprova el layout vertical al mateix navegador, però no emula maquinari, xarxa ni esdeveniments tàctils d'un dispositiu físic. Els controls **QA local** només s'injecten amb aquest servidor de proves; no són a `index.html` ni al joc publicat. Permeten enviar moviment durant un segon i llançar, forçar una caiguda, acostar el torn als 90 s i acabar la ronda sense esperar 5 minuts.

Amb la sala oberta pots completar les places amb sockets reals:

```sh
node server/test/live-clients.mjs CODI 8
```

Els clients de prova no simulen el joc. Fes servir `close` per desconnectar-los. Amb tres alumnes al mateix curs i vuit de prova hi ha deu persones jugant i una en cua.

## Limitacions

- No hi ha migració d'amfitrió ni recuperació d'una partida després de tancar l'ordinador del professor. Reconnectar un alumne crea una entrada nova, sense recuperar la plaça o els recursos anteriors.
- El codi curt és una invitació d'aula, sense comptes ni contrasenyes. Qui el conegui pot entrar. Hi ha un màxim de 151 connexions per sala, incloent l'amfitrió, espectadors i cues.
- Els models carregats només al Taller local no es transfereixen per WebSocket. Publica'ls a `assets/assets.json` perquè tots els dispositius els puguin veure; la personalització integrada sí que es comparteix.
- La fluïdesa depèn del professor, de la Wi-Fi i dels mòbils. La interpolació introdueix uns 100 ms visuals, a més del trajecte de xarxa. Si el navegador del professor limita l'activitat en segon pla o l'ordinador va lent, la simulació s'alenteix; cal mantenir-lo en primer pla.
- Les proves de navegador amb tres alumnes i sockets addicionals no substitueixen una prova de càrrega amb 50 mòbils físics a la Wi-Fi del centre.

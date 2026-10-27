# Castaween · repetidor WebSocket de l'aula

Joc: https://xavikai.github.io/castaween/

Worker: https://castaween-relay.carrotrevoltstudio.workers.dev

Configuració pública: `assets/online.json`, amb `{"servidor":"wss://castaween-relay.carrotrevoltstudio.workers.dev"}`. No conté cap credencial. Les credencials de Wrangler es desen fora del repositori.

## A l'aula

1. Professor: obre el joc a l'ordinador del projector i prem **Obre una sala (professor)**. Comparteix el codi de quatre xifres; la pantalla mostra les persones de cada curs. Prem **Comença**.
2. Alumnes: configura **Personatge** si vols, després **Mode en línia → nickname i curs → codi → Entra a l'arena**. El nickname (fins a 12 caràcters) es desa en aquest dispositiu, es veu damunt la castanyera i s'envia als avisos d'eliminació de tothom («Pau elimina Marta»). Mou-te amb el joystick i prem LLANÇA. Els controls i les regles són els del joc original.
3. El professor veu la partida amb el mode espectador existent: càmera automàtica, seguir castanyeres i vista general. Només ell inicia la ronda següent. **Mira una partida** permet entrar com a espectador remot, sense ocupar cap plaça.
4. Mantén l'ordinador del professor despert, connectat a Internet i el joc en primer pla. Tancar l'amfitrió tanca la sala. Per acabar, **Surt de la sala**. No deixis sales obertes quan no es fan servir.

Hi ha 10 places per curs, amb bots a les places buides. La persona número 11 va a la cua FIFO. Una caiguda o un torn de 90 s deixa entrar la primera de la cua; sense cua no hi ha límit de torn. Es manté la reaparició original de 3 s. Si algú es desconnecta, entra la primera de la cua o un bot. Les rondes duren 300 segons de simulació, amb l'acceleració de proves desactivada en línia.

**Mode local · bots** està sempre disponible: **nickname i curs → Comença partida local**, sense escriure cap codi ni obrir cap WebSocket. Si falta la configuració, el joc passa directament a una partida local. Si no es pot establir la connexió, s'inicia una partida local amb un avís. Un codi inexistent mostra un error i permet corregir-lo. Una interrupció durant la partida retorna al menú; es pot tornar a entrar o triar el mode local.

## Gent connectada i registre diari

Obre **https://castaween-relay.carrotrevoltstudio.workers.dev/estat** (s'actualitza cada 5 s):

- **Ara**: persones connectades al servidor, sales obertes i quanta gent hi ha jugant, mirant o entrant a cada sala.
- **Avui** i **Últims dies**: dispositius diferents que han jugat cada dia, separats per mode local, en línia i espectador, partides iniciades i màxim de gent connectada alhora. El mode local també compta: en començar una partida local el joc envia un avís al servidor (si no hi ha Internet, la partida funciona igual i no es compta).
- No es guarda cap nom ni nickname: cada navegador té un identificador aleatori i el servidor només en desa un resum per comptar-lo una vegada al dia. Les dades diàries es conserven 60 dies. JSON a `/api/estat`.
- **Hores de connexió**: sessions WebSocket anònimes de professor, jugadors i espectadors, amb sala, entrada, sortida i durada (hora de Catalunya). La durada activa s'actualitza cada 5 s; les sessions tancades conserven la durada final. Es mostren les actives i les 100 més recents i es conserva l'historial 60 dies. Si una sala deixa d'informar durant 3 hores, es marca la sortida com a aproximada amb l'última hora confirmada. Les connexions anteriors al desplegament del registre no tenen hora d'entrada recuperable.
- **Temps de joc local**: cada ronda local té una sessió anònima pròpia amb inici, final i temps real de joc, excloent pauses i resultats. No s'accelera amb el mode de proves. `assets/local-session.js` envia actualitzacions cada 15 s i també en pausar, reprendre, acabar, tornar al menú o sortir de la pàgina. Les actualitzacions pendents (fins a 100) es desen al navegador i es reenvien en recuperar Internet o tornar a obrir el joc. `/api/local` accepta actualitzacions numerades: els reintents no dupliquen sessions i els missatges antics no reobren una ronda acabada. Si falten actualitzacions durant 2 min, el panell conserva el temps confirmat i marca el final com a aproximat; una actualització pendent posterior el pot corregir. El recompte de connexions al servidor continua mostrant només WebSockets; el joc local té el seu propi indicador. El temps de les partides antigues no es pot recuperar.

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

## Entregues i revisió de models

- Alumnat: al menú del joc, **Envia el teu model GLB**, o obre [el formulari](https://castaween-relay.carrotrevoltstudio.workers.dev/models). Descarrega la paleta oficial, prepara el GLB i indica nom, curs, tipus i codi d'entrega de sis xifres.
- Professorat: [panell privat](https://castaween-relay.carrotrevoltstudio.workers.dev/revisio). Entra amb la contrasenya, obre les entregues i comparteix el codi (caduca al cap de vuit hores). Selecciona una proposta, gira la previsualització i confirma que l'has revisada abans d'aprovar-la. Pots rebutjar-la amb un comentari o retornar-la a pendent.
- Els fitxers pendents i rebutjats només són accessibles amb sessió de professor. L'aprovació els publica al catàleg del Worker; el joc els incorpora automàticament en recarregar. Recarregueu professor i mòbils abans de començar una sala. No cal editar JSON ni fer un push per cada entrega.
- És obligatori un únic material amb la paleta oficial PNG incrustada, UV i cap altra textura. El servidor descodifica i compara **tots els píxels RGBA**: no es pot substituir ni retocar, encara que la compressió del PNG canviï. La paleta oficial antiga de 256 px continua sent compatible. Els pressupostos depenen del tipus de model; les referències d'escala sense textura s'han de texturitzar abans d'entregar.

`ReviewStore` és un Durable Object SQLite separat, declarat a la migració `v2-model-reviews`. Desa fitxers i metadades, sense simular partides. No necessita R2 ni targeta per aquesta arquitectura. Les quotes de peticions, lectures, escriptures i emmagatzematge de Durable Objects són compartides amb les sales i la resta del compte: [límits oficials](https://developers.cloudflare.com/durable-objects/platform/limits/) i [preus oficials](https://developers.cloudflare.com/durable-objects/platform/pricing/). El càlcul de 12 rondes anterior reserva el pressupost al joc; les entregues i revisions també consumeixen peticions.

Límits de l'aplicació: **500 entregues, 100 MB totals, 200 entregues/dia, 100 aprovades**, i 180 entregues/hora per IP (per permetre l'aula darrere una mateixa connexió). El màxim per GLB és de 500 KB i alguns tipus tenen un pressupost inferior. Es conserven també les propostes rebutjades; no hi ha encara un botó d'esborrat definitiu ni còpia de seguretat automàtica. Descarrega les entregues que vulguis conservar. Aprovar publica també el nom i el curs; fes servir noms adequats per al web públic.

La contrasenya **no és al repositori**. En aquesta instal·lació es conserva a `server/.dev.vars`, ignorat per git: copia el valor després de `MODEL_REVIEW_PASSWORD=` per entrar. No el comparteixis amb l'alumnat. El codi d'entrega és diferent del codi de quatre xifres de les partides. Per configurar una instal·lació nova, crea aquest fitxer amb una contrasenya llarga (mínim 20 caràcters), executa `node tools/set-review-secret.cjs` des de l'arrel i desplega. L'eina envia el secret per entrada estàndard, sense mostrar-lo. La sessió dura vuit hores i fa servir cookie HttpOnly, SameSite i Secure en producció; els POST comproven l'origen i els intents de login estan limitats.

Prova local: `npx wrangler dev --local --ip 127.0.0.1 --port 8787` des de `server/`, i `node server/test/serve.cjs --reviews` des de l'arrel. `node server/test/live-review.mjs` verifica el flux HTTP; per verificar producció, afegeix el domini HTTPS del Worker. La prova crea una proposta identificada com a prova, l'aprova breument i acaba rebutjant-la; restaura l'estat inicial d'obertura d'entregues.

## Desenvolupar i desplegar el Worker

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
- Els models carregats només al Taller local no es transfereixen per WebSocket. Aprova'ls al panell d'entregues, o publica'ls a `assets/assets.json`, perquè tots els dispositius els puguin veure; la personalització integrada sí que es comparteix.
- La fluïdesa depèn del professor, de la Wi-Fi i dels mòbils. La interpolació introdueix uns 100 ms visuals, a més del trajecte de xarxa. Si el navegador del professor limita l'activitat en segon pla o l'ordinador va lent, la simulació s'alenteix; cal mantenir-lo en primer pla.
- Les proves de navegador amb tres alumnes i sockets addicionals no substitueixen una prova de càrrega amb 50 mòbils físics a la Wi-Fi del centre.

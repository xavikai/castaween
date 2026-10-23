# Referències de monstres, arbres i objectes

1 unitat = 1 metre. Blender: Metric, Unit Scale 1.000, Length Meters. Importa GLB sense redimensionar. Eix Z amunt, cara principal cap a −Y, origen al centre de la base a terra. glTF fa servir +Y amunt i +Z davant; Blender converteix els eixos.

Els models són instantànies de la geometria real d’index.html, amb colors per vèrtex, transformacions aplicades i sense esquelet ni animacions. Les alçades són les de la guia d’entrega: el joc no s’ha modificat. L’amplada i fondària ajuden a comparar proporcions; el marge sí que ha de fer 1,20 m de llarg (X).

El JSON conté les mides exactes i els triangles de cada fitxer. Els models procedurals aleatoris s’exporten amb llavor fixa: són un exemplar, no totes les variants. Exclou-los de l’exportació de la teva entrega. Aplica Ctrl+A → All Transforms i exporta GLB amb +Y Up.

Aquests fitxers són referències de mides, no entregues optimitzades. Comprova els pressupostos de triangles, la paleta oficial i les animacions a ASSETS.md i al Taller. Les flames, llums, halos i textos flotants els afegeix el joc.

| Fitxer | Alt Z (m) | Ample X (m) | Fons Y (m) | Triangles / límit | Detalls |
|---|---:|---:|---:|---:|---|
| carabassa-referencia.glb | 1,500 | 1,313 | 1,313 | 152 / 800 | Referència estàtica del model integrat, ajustada a l’alçada d’entrega. Sense animacions ni efectes. |
| fantasma-referencia.glb | 1,900 | 1,745 | 1,745 | 97 / 800 | Referència estàtica del model integrat, ajustada a l’alçada d’entrega. Sense animacions ni efectes. |
| carabassot-referencia.glb | 3,300 | 2,555 | 2,555 | 182 / 2000 | Referència estàtica del model integrat, ajustada a l’alçada d’entrega. Sense animacions ni efectes. |
| castanyer-referencia.glb | 4,300 | 3,439 | 3,418 | 144 / 500 | Exemplar determinista amb copa i eriçons del peu; els arbres del joc varien. |
| pi-referencia.glb | 6,000 | 2,659 | 2,836 | 56 / 200 | Exemplar determinista de dues copes; els pins del joc varien. |
| casa-referencia.glb | 4,600 | 4,618 | 4,618 | 52 / 800 | Referència estàtica del model integrat, ajustada a l’alçada d’entrega. Sense animacions ni efectes. |
| roca-referencia.glb | 1,400 | 1,331 | 1,404 | 36 / 150 | Referència estàtica del model integrat, ajustada a l’alçada d’entrega. Sense animacions ni efectes. |
| marge-referencia.glb | 1,100 | 1,200 | 0,979 | 36 / 100 | Un segment del marge: alçada 1,10 m i llargada X 1,20 m; ajust independent de X per encaixar la repetició. |
| lapida-referencia.glb | 0,850 | 0,582 | 0,163 | 12 / 150 | Referència estàtica del model integrat, ajustada a l’alçada d’entrega. Sense animacions ni efectes. |
| arbre-sec-referencia.glb | 3,200 | 1,560 | 1,833 | 68 / 300 | Referència estàtica del model integrat, ajustada a l’alçada d’entrega. Sense animacions ni efectes. |
| carabassa-deco-referencia.glb | 0,650 | 0,803 | 0,803 | 80 / 300 | Referència estàtica del model integrat, ajustada a l’alçada d’entrega. Sense animacions ni efectes. |
| cripta-referencia.glb | 4,000 | 2,899 | 2,899 | 50 / 800 | Referència estàtica del model integrat, ajustada a l’alçada d’entrega. Sense animacions ni efectes. |
| portal-referencia.glb | 1,600 | 5,108 | 5,009 | 168 / 1500 | Referència estàtica del model integrat, ajustada a l’alçada d’entrega. Sense animacions ni efectes. |
| paradeta-referencia.glb | 3,600 | 6,366 | 1,948 | 548 / 1500 | Inclou taulell, tendal, sacs i productes. El rètol conserva la geometria però no la textura de text. |
| foguera-referencia.glb | 1,000 | 3,773 | 3,866 | 268 / 800 | Olla, vora, franja i troncs. Les flames i guspires són efectes del joc i no formen part del model substituïble. |
| torradora-referencia.glb | 1,300 | 1,217 | 1,186 | 128 / 600 | Referència estàtica del model integrat, ajustada a l’alçada d’entrega. Sense animacions ni efectes. |
| caixa-referencia.glb | 0,600 | 0,800 | 0,800 | 24 / 200 | Caixa base amb franja de foc. La icona flotant, el text i els halos els afegeix el joc. |
| panellet-referencia.glb | 0,550 | 0,682 | 0,695 | 164 / 200 | Panellet normal, sense halo, contorn lluminós ni feix de llum. |
| llenya-referencia.glb | 0,240 | 0,469 | 0,180 | 68 / 80 | Tronc recollible actual, sense halo ni contorn lluminós. |

El ZIP també inclou la castanyera actual i la plantilla animada d’1,80 m, amb la seva guia. Regeneració: node tools/export-world-references.cjs /ruta/a/three-r128.cjs; després node tools/package-references.cjs.

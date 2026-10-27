// Pin and self-host the game's existing Three.js version for reliable offline startup.
import fs from 'node:fs/promises';
const base = 'https://cdn.jsdelivr.net/npm/three@0.128.0/';
const entries = { 'three.min.js': 'build/three.min.js', 'CopyShader.js': 'examples/js/shaders/CopyShader.js',
  'LuminosityHighPassShader.js': 'examples/js/shaders/LuminosityHighPassShader.js', 'EffectComposer.js': 'examples/js/postprocessing/EffectComposer.js',
  'RenderPass.js': 'examples/js/postprocessing/RenderPass.js', 'ShaderPass.js': 'examples/js/postprocessing/ShaderPass.js',
  'UnrealBloomPass.js': 'examples/js/postprocessing/UnrealBloomPass.js', 'GLTFLoader.js': 'examples/js/loaders/GLTFLoader.js', 'SkeletonUtils.js': 'examples/js/utils/SkeletonUtils.js', 'LICENSE': 'LICENSE' };
const folder = 'assets/vendor/three-r128'; await fs.mkdir(folder, { recursive: true });
await Promise.all(Object.entries(entries).map(async ([name, source]) => {
  const response = await fetch(base + source, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw Error(response.status + ': ' + source);
  await fs.writeFile(folder + '/' + name, Buffer.from(await response.arrayBuffer()));
}));
console.log('Three.js r128 and its MIT license saved locally.');

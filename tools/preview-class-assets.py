"""Render GLB contact-sheet tiles without modifying source models (Blender --background)."""
import bpy, math, sys, json
from pathlib import Path
from mathutils import Vector

source, target = (Path(p).resolve() for p in sys.argv[sys.argv.index('--') + 1:])
target.mkdir(parents=True, exist_ok=True)
report = []
paths = [Path(item['destination']) for item in json.loads(source.read_text(encoding='utf-8'))] if source.suffix == '.json' else list(source.glob('*.glb'))
for index, path in enumerate(sorted(paths, key=lambda p: p.name.lower())):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(path))
    objects = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    points = [o.matrix_world @ Vector(corner) for o in objects for corner in o.bound_box]
    lo = Vector(tuple(min(p[i] for p in points) for i in range(3)))
    hi = Vector(tuple(max(p[i] for p in points) for i in range(3)))
    center = (lo + hi) / 2
    size = hi - lo
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = 8
    scene.cycles.use_denoising = False
    scene.render.threads_mode = 'FIXED'
    scene.render.threads = 4
    scene.render.resolution_x = 384
    scene.render.resolution_y = 384
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.world = bpy.data.worlds.new('Preview world')
    scene.world.use_nodes = True
    scene.world.node_tree.nodes['Background'].inputs[0].default_value = (0.08, 0.065, 0.11, 1)
    scene.world.node_tree.nodes['Background'].inputs[1].default_value = 0.65
    scene.view_settings.view_transform = 'Standard'
    bpy.ops.object.camera_add()
    camera = bpy.context.object
    extent = max(size)
    camera.location = center + Vector((0.8, -1.5, 0.8)).normalized() * extent * 3
    camera.rotation_euler = (center - camera.location).to_track_quat('-Z', 'Y').to_euler()
    camera.data.type = 'ORTHO'
    camera.data.ortho_scale = extent * 1.5
    scene.camera = camera
    for direction, energy in [((1, -2, 3), 4), ((-2, -1, 1), 2)]:
        bpy.ops.object.light_add(type='SUN')
        lamp = bpy.context.object
        lamp.rotation_euler = Vector(direction).to_track_quat('Z', 'Y').to_euler()
        lamp.data.energy = energy
        lamp.data.angle = math.radians(15)
    scene.render.filepath = str(target / (path.stem + '.png'))
    bpy.ops.render.render(write_still=True)
    report.append({'file': path.name, 'width': size.x, 'depth': size.y, 'height': size.z, 'meshes': len(objects), 'min': list(lo), 'max': list(hi)})
    print('PREVIEW', index + 1, path.name, flush=True)
(target / 'dimensions.json').write_text(json.dumps(report, indent=2), encoding='utf-8')

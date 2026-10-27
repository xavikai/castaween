"""Optimize imported copies: preserve UV/material borders, then reduce only if needed."""
import bpy, bmesh, math, json, sys
from pathlib import Path
plan = json.loads(Path(sys.argv[sys.argv.index('--') + 1]).read_text(encoding='utf-8'))
for item in plan:
    if not item['optimize']:
        continue
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=item['source'])
    objects = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects: obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    if len(objects) > 1: bpy.ops.object.join()
    obj = bpy.context.object
    if item['triangles'] > item['limit']:
        mesh = obj.data
        bm = bmesh.new(); bm.from_mesh(mesh)
        bmesh.ops.dissolve_limit(bm, angle_limit=math.radians(0.5), use_dissolve_boundaries=False,
            verts=list(bm.verts), edges=list(bm.edges), delimit={'MATERIAL', 'SEAM', 'UV', 'NORMAL'})
        bm.to_mesh(mesh); bm.free(); mesh.update(); mesh.calc_loop_triangles()
        count = len(mesh.loop_triangles)
        if count > item['limit']:
            modifier = obj.modifiers.new('Mobile triangle budget', 'DECIMATE')
            modifier.ratio = (item['limit'] - 12) / count
            modifier.use_collapse_triangulate = True
            bpy.ops.object.modifier_apply(modifier=modifier.name)
    # Merge only static deliveries; none of these models contains a skin or animation.
    bpy.ops.export_scene.gltf(filepath=item['destination'], export_format='GLB', use_selection=True,
        export_animations=False, export_cameras=False, export_lights=False, export_extras=False,
        export_image_format='AUTO', export_yup=True)
    obj.data.calc_loop_triangles()
    print('OPTIMIZED', item['sourceName'], item['triangles'], '->', len(obj.data.loop_triangles), flush=True)

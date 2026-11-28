"""Bake the Yeonmok crossings, shrine, gate and broken cart with one metric camera.
Run blender -b -t 3 --python-exit-code 1 -P topview/tools/render-structures.py.
One metre of level ground projects to 40 pixels; all structural dimensions are metres.
"""
from pathlib import Path
from math import cos, sin, pi, sqrt
import random
import json
import bpy
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/props'
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 24
scene.cycles.use_denoising = False
scene.render.film_transparent = True
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.view_settings.view_transform = 'Standard'
scene.render.resolution_percentage = 100
scene.world = bpy.data.worlds.new('Overcast sky')
scene.world.use_nodes = True
sky = scene.world.node_tree.nodes.get('Background')
sky.inputs[0].default_value = (.45,.52,.51,1)
sky.inputs[1].default_value = .72

def light(name, xyz, power, tint):
    lamp=bpy.data.lights.new(name,'SUN');lamp.energy=power;lamp.angle=.20;lamp.color=tint
    obj=bpy.data.objects.new(name,lamp);scene.collection.objects.link(obj);obj.location=xyz
    obj.rotation_euler=(-obj.location).to_track_quat('-Z','Y').to_euler()

light('Northwest sun',(-9,0,16),2.05,(1,.92,.78))
light('Soft sky bounce',(2,-8,6),.76,(.80,.86,.89))
cam=bpy.data.cameras.new('One dimetric lens');cam.type='ORTHO';cam.sensor_fit='HORIZONTAL'
eye=bpy.data.objects.new('Camera',cam);scene.collection.objects.link(eye);scene.camera=eye
eye.location=(sqrt(.375)*38,-sqrt(.375)*38,.5*38)
eye.rotation_euler=(-eye.location).to_track_quat('-Z','Y').to_euler()

def weathered(name, dark, light, scale, stretch=(1,1,1)):
    mat=bpy.data.materials.new(name);mat.use_nodes=True
    nodes=mat.node_tree.nodes;link=mat.node_tree.links.new;shader=nodes.get('Principled BSDF')
    tex=nodes.new('ShaderNodeTexCoord');axis=nodes.new('ShaderNodeVectorMath');axis.operation='MULTIPLY'
    axis.inputs[1].default_value=stretch;link(tex.outputs['Object'],axis.inputs[0])
    noise=nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=scale;noise.inputs['Detail'].default_value=4
    link(axis.outputs[0],noise.inputs[0]);ramp=nodes.new('ShaderNodeValToRGB')
    for e,color,pos in zip(ramp.color_ramp.elements,[dark,light],[.25,.77]):
        e.color=(*color,1);e.position=pos
    link(noise.outputs['Fac'],ramp.inputs['Fac']);link(ramp.outputs[0],shader.inputs['Base Color'])
    bump=nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.17;bump.inputs['Distance'].default_value=.035
    link(noise.outputs['Fac'],bump.inputs['Height']);link(bump.outputs[0],shader.inputs['Normal'])
    shader.inputs['Roughness'].default_value=.90
    return mat

stone=weathered('Granite',(.060,.068,.062),(.27,.27,.218),4.6)
stone2=weathered('Granite, shadow seam',(.035,.045,.042),(.183,.191,.167),5)
pine=weathered('Weathered pine',(.065,.043,.028),(.255,.187,.105),4.5,(1,9,8))
railwood=weathered('Old sill beam',(.045,.032,.025),(.181,.129,.078),5,(8,1,8))
joint=weathered('Wet joints',(.020,.025,.022),(.081,.083,.062),8)
iron=weathered('Forged iron',(.024,.028,.027),(.071,.077,.068),9)
rope=weathered('Hemp',(.083,.061,.032),(.22,.174,.104),12)
moss=weathered('Lichen',(.067,.078,.039),(.18,.189,.092),11)
assets=[]

def mesh_piece(name, vertices, faces, material, bevel=0):
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(vertices,[],faces);mesh.update()
    obj=bpy.data.objects.new(name,mesh);scene.collection.objects.link(obj);obj.data.materials.append(material)
    if bevel:
        mod=obj.modifiers.new('Worn edges','BEVEL');mod.width=bevel;mod.segments=1
        obj.modifiers.new('Planar faces','WEIGHTED_NORMAL')
    assets.append((obj,foreground))
    return obj

def box(name,s,t,z,ds,dt,dz,mat,jitter=0,bevel=0):
    corners=[(-1,-1),(1,-1),(1,1),(-1,1)]
    # Independent corners on the long stones break the ruler-straight rims.
    offsets=[(rng.uniform(-jitter,jitter),rng.uniform(-jitter,jitter)) for _ in corners]
    v=[position(s+a*ds/2+dx,t+b*dt/2+dy,z+h*dz/2) for h in (-1,1) for (a,b),(dx,dy) in zip(corners,offsets)]
    faces=[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]
    mesh_piece(name,v,[tuple(reversed(f)) for f in faces],mat,bevel)

def rod(name,a,b,radius,mat,n=8):
    a,b=Vector(position(*a)),Vector(position(*b));axis=(b-a).normalized()
    u=axis.cross(Vector((0,0,1)) if abs(axis.z)<.9 else Vector((0,1,0))).normalized();v=axis.cross(u)
    verts=[p+radius*(u*cos(i*2*pi/n)+v*sin(i*2*pi/n)) for p in (a,b) for i in range(n)]
    faces=[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    mesh_piece(name,verts,faces,mat)

def position(s,t,z):
    # Design (X,Y,Z) maps to Blender (X,-Y,Z).
    return (t,s,z) if timber else (s,-t,z)

landmarks={}
def map_points(name,coordinates):
    bpy.context.view_layer.update()
    points=[]
    for s,t,z in coordinates:
        v=world_to_camera_view(scene,eye,Vector(position(s,t,z)))
        points.append([round(v.x*scene.render.resolution_x/2,3),round((1-v.y)*scene.render.resolution_y/2,3)])
    landmarks[name]=points

for timber,length,width,height in [(True,10.544,392,256),(False,10.852,400,256)]:
    rng=random.Random(1701 if timber else 305)
    asset='bridge_ne' if timber else 'bridge_se'
    foreground=False
    for s in (-length/2,0,length/2):
        for t in (-.70,0,.70):
            box('Mortared footing',s,t,-.52,.66,.71,.48,stone2,.025,.04)
            box('Pier cap',s+.018,t,-.245,.82,.72,.19,stone,.022,.027)
    if timber:
        for t in (-.79,.79):
            box('Long bearer',0,t,-.21,length,.21,.29,railwood,bevel=.035)
        count=39
        for j in range(count):
            s=length*((j+.5)/count-.5);t=rng.uniform(-.018,.018)
            box('Cross plank',s,t,-.055,length/count-.008,2.11+rng.uniform(-.025,.03),.11,pine,.009,.012)
            for side in (-1,1):box('Peg',s,side*.81,.006,.041,.053,.013,iron,bevel=.003)
    else:
        box('Continuous stone bed',0,0,-.16,length,2.16,.25,stone2,bevel=.03)
        for row,t in enumerate((-.72,0,.72)):
            step=length/10;edges=[-length/2]+[-length/2+step*(j+(.42 if row==1 else 0)) for j in range(1,10)]+[length/2]
            for i,(lo,hi) in enumerate(zip(edges,edges[1:])):
                z=rng.uniform(-.004,.004)
                box('Dressed granite slab',(lo+hi)/2,t,z-.052,hi-lo-.012,.704,.10,stone if (row+i)%4 else stone2,.012,.025)
                if rng.random()<.36:
                    for _ in range(2):box('Lichen fleck',rng.uniform(lo+.05,hi-.05),t+rng.uniform(-.31,.31),.001,.045,.07,.007,moss,.013)
    for side in (-1,1):
        foreground=side==1
        t=side*1.12
        if timber:
            n=6
            for j in range(n):
                s=(j/(n-1)-.5)*length;top=.78+rng.uniform(-.05,.045)
                box('Cut post',s,t,top/2-.12,.20,.20,top+.24,railwood,.01,.019)
                for z in (.56,.61,.66):box('Hemp binding',s,t,z,.216,.214,.024,rope,bevel=.007)
                if j+1<n:
                    end=s+length/(n-1);middle=(s+end)/2
                    rod('Upper rail',(s,t,.63),(end,t,.62),.054,railwood)
                    rod('Worn rope',(s,t,.44),(middle,t,.36),.024,rope)
                    rod('Worn rope',(middle,t,.36),(end,t,.44),.024,rope)
        else:
            for j in range(8):
                s=length*((j+.5)/8-.5)
                box('Granite curb',s,t,.08,length/8-.021,.17,.23,stone2,.018,.024)
            for idx in range(5):
                s=length*(idx/4-.5)
                box('Pier',s,t,.275,.23,.255,.55,stone,.014,.029)
                box('Sloped coping',s,t,.57,.30,.32,.13,stone,.012,.042)
                if idx<4 and not (side==1 and idx==2):
                    box('Parapet beam',s+length/8,t,.35,length/4-.14,.145,.13,stone2,bevel=.018)
    cam.ortho_scale=width/40
    scene.render.resolution_x=2*width;scene.render.resolution_y=2*height
    map_points(asset+'/deck', [(-length/2,0,0),(length/2,0,0),(0,-1.05,0),(0,1.05,0)])
    for suffix in ('','-near'):
        for obj,near in assets:obj.hide_render=bool(suffix) and not near
        scene.render.filepath=str(OUT/(asset+suffix+'.png'));bpy.ops.render.render(write_still=True)
    for obj,_ in assets:bpy.data.objects.remove(obj,do_unlink=True)
    assets.clear()

# The next three objects use the same stage, metres, sky and camera. A raised camera
# target changes the transparent margin around a tall sprite, not the projection.
timber=False
foreground=False
tile=weathered('Glazed fired clay',(.043,.048,.053),(.184,.188,.174),6.7)
edge=weathered('Kiln-worn tile lids',(.068,.067,.058),(.235,.223,.188),8)
earth=weathered('Clay plaster',(.10,.089,.065),(.22,.208,.168),8)
undyed=weathered('Worn grain sacks',(.12,.09,.048),(.32,.26,.161),10)
red=weathered('Old vermilion cord',(.10,.019,.012),(.24,.046,.023),9)

def export_landmark(name,width,height,anchor,folder=OUT,layers=None,markers=None):
    cam.ortho_scale=width/40
    # Shift camera in its own screen-up vector, expressed in metres at 40px/m.
    up=eye.rotation_euler.to_matrix()@Vector((0,1,0))
    origin=Vector((sqrt(.375)*38,-sqrt(.375)*38,.5*38))
    eye.location=origin+up*((anchor-.5)*height/40)
    scene.render.resolution_x=2*width;scene.render.resolution_y=2*height
    for key,points in (markers or {}).items():map_points(name+'/'+key,points)
    for suffix,layer in layers or [('',None)]:
        for obj,part in assets:
            obj.hide_render=layer is not None and part!=layer
        scene.render.filepath=str(folder/(name+suffix+'.png'));bpy.ops.render.render(write_still=True)
    for obj,_ in assets:bpy.data.objects.remove(obj,do_unlink=True)
    assets.clear()

def ellipsoid(name,s,t,z,radii,mat):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=14,ring_count=8,location=position(s,t,z))
    obj=bpy.context.object;obj.name=name;obj.scale=radii;obj.data.materials.append(mat);assets.append((obj,foreground))

rng.seed(401)
# Small roadside shrine: the shut door rises 1.95m from its 0.20m granite sill.
for j in range(3):
    for i in range(4):
        box('Plinth block',(i-1.5)*.47,(j-1)*.56,.086,.47,.56,.172,stone,.009,.025)
box('Threshold',0,.774,.183,1.72,.27,.034,stone2,bevel=.018)
box('Walls',0,0,1.22,1.59,1.35,2.03,earth,bevel=.016)
for x in (-.79,.79):
    for y in (-.70,.70):
        box('Corner stone',x,y,.265,.244,.244,.17,stone,.009,.019)
        box('Dark red pine column',x,y,1.36,.162,.162,2.07,railwood,bevel=.012)
for y in (-.702,.705):
    box('Tie beam',0,y,2.25,1.76,.17,.20,railwood,bevel=.012)
    box('Cill beam',0,y,.29,1.7,.154,.17,pine,bevel=.012)
for x in (-.8,.8):
    for y in (-.5,-.23,.04,.31,.5):
        box('Side lattice stud',x,y,1.22,.055,.05,1.82,railwood,bevel=.006)
    for z in (.55,1.50,1.96):
        box('Side lattice rail',x,0,z,.07,1.38,.063,pine,bevel=.005)
for x in (-.505,.505):
    box('Door jamb',x,.766,1.175,.11,.13,1.95,railwood,bevel=.010)
box('Door lintel',0,.766,2.215,1.15,.15,.13,railwood,bevel=.010)
for i in range(8):
    box('Door leaf',-.45+(i+.5)*.1125,.735,1.175,.109,.091,1.95,pine,bevel=.004)
for z in (.47,1.68):
    for x in (-.225,.225):
        box('Door strap',x,.794,z,.36,.023,.037,iron,bevel=.004)
for x in (-.056,.056):
    rod('Iron pull',(x,.799,1.19),(x,.830,1.13),.021,iron)
    rod('Prayer cord',(x,.836,1.13),(x+.033,.839,.99),.009,red)
# More visible rafters carry the weight of the projected tiled overhang.
foreground=True
for x in [-.90,-.60,-.31,0,.31,.60,.90]:
    box('Bracket block',x,0,2.35,.16,1.86,.16,railwood,bevel=.018)
    box('Rafter block',x,0,2.45,.19,2.04,.095,pine,bevel=.016)
def roof_z(x,y):
    pitch=abs(y)/1.03
    return 3.17-1.18*pitch+.49*pitch*pitch+.16*(abs(x)/1.17)**3*(.38+.62*pitch)
for face in (-1,1):
    cols,rows=18,6
    for col in range(cols):
        a=-1.2+2.4*col/cols;b=a+2.4/cols+.006
        y=face*1.067;z=roof_z(a,y)+.036
        rod('Round end tile',(a,y,z),(a,y+face*.042,z-.016),.046,edge,10)
        for row in range(rows):
            y1=face*row*1.06/rows;y2=face*(row+1)*1.06/rows
            verts=[position(x,y,roof_z(x,y)+off) for x,y,off in [(a,y1,-.007),(b,y1,-.007),(b,y2,.009),(a,y2,.009)]]
            mesh_piece('Pan tile',verts,[(0,1,2,3),(3,2,1,0)],tile)
            rod('Round seam tile',(a,y1,roof_z(a,y1)+.025),(a,y2,roof_z(a,y2)+.032),.039,tile,7)
    for x in (-1.18,1.18):
        rod('Gable edge',(x,0,roof_z(x,0)),(x,face*1.06,roof_z(x,1.06)),.057,railwood)
    rod('Eave fascia',(-1.19,face*1.04,roof_z(-1.19,1.04)-.03),(1.19,face*1.04,roof_z(1.19,1.04)-.03),.052,railwood)
for i in range(16):
    x=-1.25+i*2.50/16
    rod('Ridge cap',(x,0,roof_z(x,0)+.044),(x+.159,0,roof_z(x+.159,0)+.05),.087,edge if i%4==0 else tile)
for end in (-1,1):
    rod('Rising ridge finial',(end*1.18,0,roof_z(1.18,0)+.04),(end*1.25,0,roof_z(1.18,0)+.16),.079,tile)
    ellipsoid('Terminal',end*1.25,0,roof_z(1.18,0)+.17,(.058,.065,.067),edge)
export_landmark('shrine',184,184,.78,layers=[('',None),('-base',False),('-roof',True)],
                markers={'door':[(-.45,.766,.20),(-.45,.766,2.15),(.45,.766,.20)]})
foreground=False
# Ruined timber gate retains two crumbling stone wings and a clear 1.35m opening.
for side in (-1,1):
    s=side*(.675+.10)
    box('Gate socket',s,0,.112,.36,.41,.224,stone,.012,.025)
    box('Gate post',s,0,1.13,.20,.25,2.26,railwood,bevel=.021)
    for tier,count in [(0,3),(1,3),(2,2),(3,1)]:
        for i in range(count):
            x=side*(.98+.23+i*.46+.065*(tier%2))
            box('Broken wing ashlar',x,0,.174+tier*.32,.46,.42+(tier==0)*.10,.32,stone if (i+tier)%3 else stone2,.032,.047)
    box('Post bracket',s,0,2.087,.32,.34,.075,iron,bevel=.012)
foreground=True
box('Lintel',0,0,2.165,2.44,.28,.23,pine,.018,.031)
box('Weather cap',-.08,0,2.32,2.52,.34,.105,railwood,.023,.027)
for s in (-1.01,.55):
    box('Moss on the cap',s,0,2.376,.18,.18,.010,moss,.024)
export_landmark('ruin_gate',176,162,.72,layers=[('',None),('-base',False),('-roof',True)],
                markers={'opening':[(-.675,0,0),(-.675,0,2.05),(.675,0,0)]})
foreground=False
# A broken grain cart. Both wheels use a 0.90m rim; the fallen one lies flat.
for x in [-.57,-.38,-.19,0,.19,.38,.57]:
    box('Bedboard',x,0,.48,.178,1.85,.085,pine,bevel=.012)
for side in (-1,1):
    for z in (.59,.78,.95):
        box('Sideboard',side*.65,0,z,.068,1.85,.16,pine,bevel=.017)
    for t in (-.79,.60):
        box('Upright brace',side*.69,t,.73,.087,.11,.62,railwood,bevel=.009)
    rod('Shaft',(side*.48,-.81,.44),(side*.48,-1.65,.026),.055,railwood)
for x in (-.57,-.38,-.19,0,.19,.38,.57):
    box('Rear board',x,.91,.73,.18,.083,.47,pine,bevel=.009)
rod('Axle',(-.82,.22,.45),(.81,.22,.45),.071,railwood)
def wheel(s,t,z,fallen):
    def rim(angle,r):
        return (s+r*cos(angle),t+r*sin(angle),z) if fallen else (s,t+r*cos(angle),z+r*sin(angle))
    center=(s,t,z)
    for j in range(16):
        a=j*2*pi/16;b=(j+1)*2*pi/16
        rod('Wheel felloe',rim(a,.42),rim(b,.42),.031,pine)
        rod('Iron tyre',rim(a,.443),rim(b,.443),.010,iron)
        if j%2==0:rod('Spoke',center,rim(a,.402),.022,railwood)
    ellipsoid('Hub',s,t,z,(.084,.092,.080),railwood)
wheel(.72,.22,.45,False);wheel(-.78,-.48,.052,True)
for x,y in [(-.25,.36),(.23,.45),(-.08,-.13)]:
    ellipsoid('Woven rice sack',x,y,.72,(.29,.44,.22),undyed)
    for i in (-1,1):
        rod('Tied grain sack',(x-.21,y+i*.30,.83),(x+.21,y+i*.30,.83),.013,rope)
export_landmark('grain_cart',136,100,.65,markers={'wheel':[(.72,.22,0),(.72,.22,.90)]})
(ROOT/'editable/structure-landmarks.json').write_text(json.dumps(landmarks,indent=2)+'\n')

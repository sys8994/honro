"""Source walking edge profile, shared by BODY mask and SURFACE skin.
Only the lower paint boundary changes; source top/collision coordinates do not.
"""
def edge_depth(x):
    distance=min(max(0,x),max(0,2022-x))
    knots=[(0,1),(5,3),(10,2),(15,9),(22,12),(30,18)]
    for (a,u),(b,v) in zip(knots,knots[1:]):
        if distance<=b:return u+(v-u)*(distance-a)/(b-a)
    return 18

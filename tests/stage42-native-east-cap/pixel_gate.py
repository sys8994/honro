def exact_stock(a,b):
    assert len(a)==len(b) and len(a)%4==0
    changed=max_delta=alpha_changed=0
    for i in range(0,len(a),4):
        if a[i:i+4]==b[i:i+4]:continue
        changed+=1
        alpha_changed+=a[i+3]!=b[i+3]
        max_delta=max(max_delta,max(abs(a[i+j]-b[i+j]) for j in range(4)))
    return {'pass':changed==0,'changed_rgba_pixels':changed,'alpha_diff_pixels':alpha_changed,'max_channel_delta':max_delta}

def exact_protected(a,b,inside,opaque):
    assert len(a)==len(b)==4*len(inside)==4*len(opaque)
    changed=outside=old=0
    for i,m in enumerate(inside):
        if a[4*i:4*i+4]==b[4*i:4*i+4]:continue
        changed+=1
        outside+=not m
        old+=opaque[i]==255
    return {'pass':changed>0 and outside==0 and old==0,'changed':changed,'outside':outside,'old_opaque':old}

import hashlib,re
def sha(b):return hashlib.sha256(b).hexdigest()
ADDR=re.compile(r"^(web/[A-Za-z0-9_.\-/]+)\.([a-f0-9]{16})\.([A-Za-z0-9]+)$")

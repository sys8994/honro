import re, math
import numpy as np

def rd(p, e):
    if len(p) <= 2:
        return p
    a = p[0]
    v = p[-1] - a
    norm = v @ v
    t = np.clip((p - a) @ v / (norm or 1), 0, 1)
    d = np.linalg.norm(p - a - t[:, None] * v, axis=1)
    k = int(d.argmax())
    if d[k] <= e:
        return p[[0, -1]]
    return np.concatenate((rd(p[:k + 1], e)[:-1], rd(p[k:], e)))

def area(p):
    return float(np.sum(p[:-1, 0] * p[1:, 1] - p[1:, 0] * p[:-1, 1]) / 2)

def subparse(s):
    out = []
    cur = None
    for op, st in re.findall('([MLCZmlcz])([^MLCZmlcz]*)', s):
        nums = [float(x) for x in re.findall('[-+]?(?:\\d*\\.\\d+|\\d+)(?:[eE][-+]?\\d+)?', st)]
        if op == 'M':
            cur = np.array(nums)
            out.append(cur)
        elif op == 'L':
            cur = np.array(nums)
            out.append(cur)
        elif op == 'C':
            a = cur
            b, c, z = np.array(nums).reshape(3, 2)
            length = np.linalg.norm(b - a) + np.linalg.norm(c - b) + np.linalg.norm(z - c)
            steps = max(2, min(128, math.ceil(length / 2)))
            for t in np.linspace(0, 1, steps + 1)[1:]:
                out.append((1 - t) ** 3 * a + 3 * (1 - t) ** 2 * t * b + 3 * (1 - t) * t * t * c + t ** 3 * z)
            cur = z
        elif op.upper() == 'Z':
            out.append(out[0])
    return np.array(out)

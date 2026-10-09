"""Genera img/icon-192.png e img/icon-512.png (mismo dibujo que img/icon.svg) sin dependencias."""
import os, struct, zlib

WEB = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RED, WHITE, LIGHT = (44, 51, 47), (239, 236, 236), (113, 106, 86)


def bez(p0, p1, p2, p3, n=24):
    return [tuple((1-t)**3*a + 3*(1-t)**2*t*b + 3*(1-t)*t**2*c + t**3*d for a, b, c, d in zip(p0, p1, p2, p3))
            for t in (i / n for i in range(n + 1))]


# Páginas del libro (coordenadas en 512×512, como el SVG)
LEFT = bez((120, 170), (160, 154), (200, 154), (244, 176)) + [(244, 346)] + bez((244, 346), (200, 326), (160, 326), (120, 340))[1:]
RIGHT = bez((392, 170), (352, 154), (312, 154), (268, 176)) + [(268, 346)] + bez((268, 346), (312, 326), (352, 326), (392, 340))[1:]
LINES = [((146, 210), (218, 206)), ((146, 240), (218, 236)), ((146, 270), (218, 266)),
         ((294, 206), (366, 210)), ((294, 236), (366, 240)), ((294, 266), (366, 270))]


def inside(x, y, poly):
    c = False
    for (x1, y1), (x2, y2) in zip(poly, poly[1:] + poly[:1]):
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
            c = not c
    return c


def seg_dist(x, y, a, b):
    (x1, y1), (x2, y2) = a, b
    dx, dy = x2 - x1, y2 - y1
    t = max(0, min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)))
    return ((x - x1 - t * dx) ** 2 + (y - y1 - t * dy) ** 2) ** .5


def color(x, y):
    # esquinas redondeadas (r=96)
    r = 96
    cx, cy = min(max(x, r), 512 - r), min(max(y, r), 512 - r)
    if (x - cx) ** 2 + (y - cy) ** 2 > r * r:
        return None
    if 120 <= x <= 392 and 372 <= y <= 388:
        return LIGHT
    if inside(x, y, LEFT) or inside(x, y, RIGHT):
        if any(seg_dist(x, y, a, b) <= 3.5 for a, b in LINES):
            return RED
        return WHITE
    return RED


def render(size, ss=3):
    rows = []
    k = 512 / size
    for py in range(size):
        row = bytearray([0])
        for px in range(size):
            acc = [0, 0, 0, 0]
            for sy in range(ss):
                for sx in range(ss):
                    c = color((px + (sx + .5) / ss) * k, (py + (sy + .5) / ss) * k)
                    if c:
                        acc[0] += c[0]; acc[1] += c[1]; acc[2] += c[2]; acc[3] += 255
            n = ss * ss
            a = acc[3] // n
            if a:
                cov = acc[3] / 255
                row += bytes([round(acc[0] / cov), round(acc[1] / cov), round(acc[2] / cov), a])
            else:
                row += b"\0\0\0\0"
        rows.append(bytes(row))
    raw = b"".join(rows)

    def chunk(t, d):
        return struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xffffffff)
    return (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0))
            + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b""))


for s in (192, 512):
    with open(os.path.join(WEB, "img", f"icon-{s}.png"), "wb") as f:
        f.write(render(s, ss=3 if s == 192 else 2))
    print("img/icon-%d.png" % s)

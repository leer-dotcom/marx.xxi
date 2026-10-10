"""Genera los PNG del icono a partir de img/icon.svg e img/icon-maskable.svg, sin dependencias.

  img/icon-192.png, img/icon-512.png   icono con esquinas redondeadas (img/icon.svg)
  img/icon-maskable-512.png            a sangre, con el dibujo reducido a la zona segura (img/icon-maskable.svg)
  img/apple-touch-icon.png (180)       a sangre (iOS redondea las esquinas)
  img/favicon-32.png                   reserva para navegadores sin favicon SVG

Los SVG solo usan <rect> y <path> con M/L/Z (polígonos), que es lo que este script sabe pintar.
"""
import os, re, struct, zlib

WEB = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def hexrgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def load(name):
    s = open(os.path.join(WEB, "img", name), encoding="utf-8").read()
    vb = [float(v) for v in re.search(r'viewBox="([^"]+)"', s).group(1).split()]
    rect = re.search(r"<rect\b[^>]*>", s)
    rxm = re.search(r'rx="([\d.]+)"', rect.group(0)) if rect else None
    rx = float(rxm.group(1)) if rxm else 0
    bg = hexrgb(re.search(r'fill="(#[0-9A-Fa-f]{6})"', rect.group(0)).group(1)) if rect else None
    shapes = []
    for d, fill in re.findall(r'<path d="([^"]+)" fill="(#[0-9A-Fa-f]{6})"', s):
        polys = []
        for sub in re.findall(r"M([^MZ]+)Z", d):
            nums = [float(v) for v in re.findall(r"-?[\d.]+", sub)]
            polys.append(list(zip(nums[0::2], nums[1::2])))
        shapes.append((polys, hexrgb(fill)))
    return vb, rx, bg, shapes


def inside(x, y, poly):
    c = False
    for (x1, y1), (x2, y2) in zip(poly, poly[1:] + poly[:1]):
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
            c = not c
    return c


def render(name, size, ss=3, rounded=True):
    (vx, vy, vw, vh), rx, bg, shapes = load(name)
    if not rounded:
        rx = 0
    k = vw / size

    def color(x, y):
        if rx:
            cx, cy = min(max(x, vx + rx), vx + vw - rx), min(max(y, vy + rx), vy + vh - rx)
            if (x - cx) ** 2 + (y - cy) ** 2 > rx * rx:
                return None
        col = bg
        for polys, fill in shapes:  # el último que contiene el punto gana (orden del SVG)
            n = sum(inside(x, y, p) for p in polys)
            if n % 2:
                col = fill
        return col

    rows = []
    for py in range(size):
        row = bytearray([0])
        for px in range(size):
            acc = [0, 0, 0, 0]
            for sy in range(ss):
                for sx in range(ss):
                    c = color(vx + (px + (sx + .5) / ss) * k, vy + (py + (sy + .5) / ss) * k)
                    if c:
                        acc[0] += c[0]; acc[1] += c[1]; acc[2] += c[2]; acc[3] += 255
            a = acc[3] // (ss * ss)
            if a:
                cov = acc[3] / 255
                row += bytes([round(acc[0] / cov), round(acc[1] / cov), round(acc[2] / cov), a])
            else:
                row += b"\0\0\0\0"
        rows.append(bytes(row))

    def chunk(t, d):
        return struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xffffffff)
    return (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0))
            + chunk(b"IDAT", zlib.compress(b"".join(rows), 9)) + chunk(b"IEND", b""))


JOBS = [("icon.svg", 192, "icon-192.png", True, 3), ("icon.svg", 512, "icon-512.png", True, 2),
        ("icon.svg", 32, "favicon-32.png", True, 4),
        ("icon-maskable.svg", 512, "icon-maskable-512.png", False, 2),
        ("icon-maskable.svg", 180, "apple-touch-icon.png", False, 3)]

if __name__ == "__main__":
    for src, size, out, rounded, ss in JOBS:
        with open(os.path.join(WEB, "img", out), "wb") as f:
            f.write(render(src, size, ss, rounded))
        print("img/" + out)

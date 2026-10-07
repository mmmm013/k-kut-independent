import os, zlib, struct, numpy as np

S = 260
yy, xx = np.mgrid[0:S, 0:S].astype(float)
cx, cy = S/2.0, S/2.0 + 14
rx, ry = S*0.46, S*0.38

rgba = np.zeros((S, S, 4), dtype=np.uint8)

# --- body: squat ellipse ---
d = ((xx-cx)/rx)**2 + ((yy-cy)/ry)**2
body = d <= 1.0

# shading: lit from upper-left, plus vertical ribs
nz = np.sqrt(np.clip(1.0-d, 0, 1))
lx, ly = -0.45, -0.55
nxn = (xx-cx)/rx
nyn = (yy-cy)/ry
lam = np.clip(-(nxn*lx + nyn*ly)*0.45 + nz*0.45 + 0.55, 0.35, 1.18)
rib = 0.86 + 0.14*np.cos(np.arcsin(np.clip(nxn, -1, 1))*5.0)
shade = np.clip(lam*rib, 0.10, 1.0)

base = np.array([232, 118, 20], dtype=float)       # pumpkin orange
rgba[..., 0] = np.where(body, np.clip(base[0]*shade + 18, 0, 255), 0)
rgba[..., 1] = np.where(body, np.clip(base[1]*shade + 10, 0, 255), 0)
rgba[..., 2] = np.where(body, np.clip(base[2]*shade, 0, 255), 0)
rgba[..., 3] = np.where(body, 255, 0)

# --- stem ---
# short stem that leans right, thicker at the base
stem_t = np.clip((cy-ry+14 - yy)/40.0, 0, 1)            # 0 at base, 1 at tip
stem_cx = cx + stem_t*16
stem_w = 13 - stem_t*5
stem = (np.abs(xx-stem_cx) < stem_w) & (yy > cy-ry-26) & (yy < cy-ry+14)
rgba[stem] = [74, 102, 38, 255]

# --- carved face: glowing cut-outs ---
glow = np.array([255, 214, 92], dtype=np.uint8)

def tri(ax, ay, bx, by, gx, gy):
    # barycentric inside test
    v0x, v0y = bx-ax, by-ay
    v1x, v1y = gx-ax, gy-ay
    v2x, v2y = xx-ax, yy-ay
    den = v0x*v1y - v1x*v0y
    u = (v2x*v1y - v1x*v2y)/den
    v = (v0x*v2y - v2x*v0y)/den
    return (u >= 0) & (v >= 0) & (u+v <= 1)

eye_l = tri(cx-62, cy-30, cx-20, cy-30, cx-41, cy+12)
eye_r = tri(cx+20, cy-30, cx+62, cy-30, cx+41, cy+12)
nose  = tri(cx, cy+4, cx-14, cy+30, cx+14, cy+30)

# jagged grin that curves up at the corners
smile = cy + 44 - ((xx-cx)/76.0)**2 * 26          # upper edge of the mouth
mouth = (np.abs(xx-cx) < 76) & (yy > smile) & (yy < smile + 30)
teeth = np.zeros_like(mouth)
for t in (-60, -24, 12, 48):
    teeth |= tri(cx+t, cy+96, cx+t+28, cy+96, cx+t+14, cy+30) & (yy > smile + 11)
mouth = mouth & ~teeth

face = (eye_l | eye_r | nose | mouth) & body
rgba[face] = [glow[0], glow[1], glow[2], 255]

# soft dark rim just inside the silhouette
rim = body & (d > 0.90)
rgba[rim, 0] = (rgba[rim, 0]*0.55).astype(np.uint8)
rgba[rim, 1] = (rgba[rim, 1]*0.50).astype(np.uint8)
rgba[rim, 2] = (rgba[rim, 2]*0.50).astype(np.uint8)


def write_png(path, arr):
    h, w, _ = arr.shape
    raw = b"".join(b"\x00" + arr[r].tobytes() for r in range(h))
    def chunk(tag, data):
        c = struct.pack(">I", len(data)) + tag + data
        return c + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
    png = (b"\x89PNG\r\n\x1a\n"
           + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0))
           + chunk(b"IDAT", zlib.compress(raw, 9))
           + chunk(b"IEND", b""))
    open(path, "wb").write(png)

write_png(os.path.join(os.environ.get("CUT_WORKDIR", "."), "pumpkin.png"), rgba)
print("pumpkin.png", S, "x", S, "opaque px:", int((rgba[...,3] > 0).sum()))

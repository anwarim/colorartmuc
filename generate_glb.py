#!/usr/bin/env python3
# ============================================================
# Color Art Munich — Generate GLB files for AR (v2)
# Run from inside your colorartmuc/ folder:
#   python3 generate_glb.py
# Requires: pip install Pillow
# ============================================================

import struct, json, os, io
from PIL import Image

PAINTINGS_DIR = 'images/paintings-to-ar'
GLB_DIR       = 'images/ar'
MAX_DIM_PX    = 1024
JPEG_QUALITY  = 82
REAL_MAX_M    = 1.0

def create_painting_glb(img_path, output_path):
    try:
        img = Image.open(img_path).convert('RGB')
    except Exception as e:
        print(f"  Cannot open: {e}")
        return False

    w_px, h_px = img.size
    if max(w_px, h_px) > MAX_DIM_PX:
        ratio = MAX_DIM_PX / max(w_px, h_px)
        img = img.resize((int(w_px * ratio), int(h_px * ratio)), Image.LANCZOS)
        w_px, h_px = img.size

    buf = io.BytesIO()
    img.save(buf, format='JPEG', quality=JPEG_QUALITY)
    img_bytes = buf.getvalue()

    aspect = w_px / h_px
    if aspect >= 1:
        w_m, h_m = REAL_MAX_M, REAL_MAX_M / aspect
    else:
        w_m, h_m = REAL_MAX_M * aspect, REAL_MAX_M
    w, h = w_m / 2, h_m / 2

    # XY plane, normal facing -Z (toward camera when placed on wall)
    positions = [-w, h, 0.0,  w, h, 0.0,  -w, -h, 0.0,  w, -h, 0.0]
    uvs       = [0.0, 0.0,   1.0, 0.0,    0.0, 1.0,     1.0, 1.0]
    normals   = [0.0, 0.0, -1.0] * 4
    indices   = [0, 1, 2,  2, 1, 3]

    def pack_pad(fmt, data):
        d = struct.pack(fmt, *data)
        return d + b'\x00' * ((4 - len(d) % 4) % 4)

    idx_buf  = pack_pad(f'{len(indices)}H', indices)
    pos_buf  = pack_pad(f'{len(positions)}f', positions)
    uv_buf   = pack_pad(f'{len(uvs)}f', uvs)
    norm_buf = pack_pad(f'{len(normals)}f', normals)
    img_buf  = img_bytes + b'\x00' * ((4 - len(img_bytes) % 4) % 4)

    geo_buf  = idx_buf + pos_buf + uv_buf + norm_buf
    bin_buf  = geo_buf + img_buf

    o0 = 0
    o1 = o0 + len(idx_buf)
    o2 = o1 + len(pos_buf)
    o3 = o2 + len(uv_buf)
    o4 = o3 + len(norm_buf)

    gltf = {
        "asset": {"version": "2.0"},
        "scene": 0,
        "scenes": [{"nodes": [0]}],
        "nodes": [{"mesh": 0}],
        "meshes": [{"primitives": [{"attributes": {"POSITION": 1, "TEXCOORD_0": 2, "NORMAL": 3}, "indices": 0, "material": 0}]}],
        "materials": [{"pbrMetallicRoughness": {"baseColorTexture": {"index": 0}, "metallicFactor": 0.0, "roughnessFactor": 0.95}, "doubleSided": True}],
        "textures": [{"source": 0, "sampler": 0}],
        "samplers": [{"magFilter": 9729, "minFilter": 9987, "wrapS": 33071, "wrapT": 33071}],
        "images": [{"bufferView": 4, "mimeType": "image/jpeg"}],
        "accessors": [
            {"bufferView": 0, "componentType": 5123, "count": 6,  "type": "SCALAR"},
            {"bufferView": 1, "componentType": 5126, "count": 4,  "type": "VEC3", "min": [-w,-h,0.0], "max": [w,h,0.0]},
            {"bufferView": 2, "componentType": 5126, "count": 4,  "type": "VEC2"},
            {"bufferView": 3, "componentType": 5126, "count": 4,  "type": "VEC3"},
        ],
        "bufferViews": [
            {"buffer": 0, "byteOffset": o0, "byteLength": len(idx_buf),  "target": 34963},
            {"buffer": 0, "byteOffset": o1, "byteLength": len(pos_buf),  "target": 34962},
            {"buffer": 0, "byteOffset": o2, "byteLength": len(uv_buf),   "target": 34962},
            {"buffer": 0, "byteOffset": o3, "byteLength": len(norm_buf), "target": 34962},
            {"buffer": 0, "byteOffset": o4, "byteLength": len(img_bytes)},
        ],
        "buffers": [{"byteLength": len(bin_buf)}]
    }

    json_bytes = json.dumps(gltf, separators=(',',':')).encode()
    json_bytes += b' ' * ((4 - len(json_bytes) % 4) % 4)

    jc = struct.pack('<II', len(json_bytes), 0x4E4F534A) + json_bytes
    bc = struct.pack('<II', len(bin_buf),    0x004E4942) + bin_buf
    total = 12 + len(jc) + len(bc)
    hdr   = struct.pack('<III', 0x46546C67, 2, total)

    with open(output_path, 'wb') as f:
        f.write(hdr + jc + bc)
    return total


if __name__ == '__main__':
    os.makedirs(GLB_DIR, exist_ok=True)
    paintings = sorted([f for f in os.listdir(PAINTINGS_DIR) if f.lower().endswith(('.jpg','.jpeg','.png'))])
    print(f"Generating {len(paintings)} GLB files...\n")
    ok = 0
    for i, fname in enumerate(paintings, 1):
        glb_name = os.path.splitext(fname)[0] + '.glb'
        glb_path = os.path.join(GLB_DIR, glb_name)
        print(f"[{i}/{len(paintings)}] {fname} -> {glb_name}", end='  ')
        size = create_painting_glb(os.path.join(PAINTINGS_DIR, fname), glb_path)
        if size:
            print(f"OK {size//1024}KB")

            # delete source image after successful GLB creation
            try:
                os.remove(os.path.join(PAINTINGS_DIR, fname))
                print(f"   Deleted source: {fname}")
            except Exception as e:
                print(f"   Could not delete source: {e}")

            ok += 1
        else:
            print("FAILED")
    print(f"\nDone: {ok}/{len(paintings)} files in {GLB_DIR}/")
    print("git add images/ar/ && git commit -m 'Regenerate GLBs' && git push")

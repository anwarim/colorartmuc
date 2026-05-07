#!/usr/bin/env python3
# ============================================================
# Color Art Munich — Generate GLB files for AR viewing
# Run this from inside your colorartmuc/ folder:
#   python3 generate_glb.py
# Requires: pip install Pillow
# ============================================================

import struct, json, os, io
from PIL import Image

PAINTINGS_DIR = 'images/paintings'
GLB_DIR       = 'images/ar'
MAX_DIM_PX    = 1024  # resize for smaller GLB files
JPEG_QUALITY  = 82

def create_painting_glb(img_path, output_path):
    try:
        img = Image.open(img_path).convert('RGB')
    except Exception as e:
        print(f"  ❌ Cannot open image: {e}")
        return False

    # Resize for smaller file size
    w_px, h_px = img.size
    if max(w_px, h_px) > MAX_DIM_PX:
        ratio = MAX_DIM_PX / max(w_px, h_px)
        img = img.resize((int(w_px * ratio), int(h_px * ratio)), Image.LANCZOS)
        w_px, h_px = img.size

    buf = io.BytesIO()
    img.save(buf, format='JPEG', quality=JPEG_QUALITY)
    img_bytes = buf.getvalue()

    # Real world dimensions (max 1 meter)
    aspect = w_px / h_px
    if aspect >= 1:
        w_m, h_m = 1.0, 1.0 / aspect
    else:
        w_m, h_m = aspect, 1.0
    w, h = w_m / 2, h_m / 2

    # Geometry buffers
    positions = [-w,  h, 0,   w,  h, 0,   -w, -h, 0,   w, -h, 0]
    uvs       = [0.0, 0.0,   1.0, 0.0,   0.0, 1.0,   1.0, 1.0]
    normals   = [0.0, 0.0, 1.0] * 4
    indices   = [0, 2, 1,   1, 2, 3]

    def pack_pad(fmt, data):
        d = struct.pack(fmt, *data)
        pad = (4 - len(d) % 4) % 4
        return d + b'\x00' * pad

    idx_buf  = pack_pad(f'{len(indices)}H', indices)
    pos_buf  = pack_pad(f'{len(positions)}f', positions)
    uv_buf   = pack_pad(f'{len(uvs)}f', uvs)
    norm_buf = pack_pad(f'{len(normals)}f', normals)
    img_pad  = b'\x00' * ((4 - len(img_bytes) % 4) % 4)
    img_buf  = img_bytes + img_pad

    geo_buf = idx_buf + pos_buf + uv_buf + norm_buf
    bin_buf = geo_buf + img_buf

    offsets = {
        'idx':  0,
        'pos':  len(idx_buf),
        'uv':   len(idx_buf) + len(pos_buf),
        'norm': len(idx_buf) + len(pos_buf) + len(uv_buf),
        'img':  len(geo_buf),
    }

    gltf = {
        "asset": {"version": "2.0", "generator": "ColorArtMuc-AR"},
        "scene": 0,
        "scenes": [{"nodes": [0]}],
        "nodes": [{"mesh": 0, "name": "Painting"}],
        "meshes": [{"primitives": [{
            "attributes": {"POSITION": 1, "TEXCOORD_0": 2, "NORMAL": 3},
            "indices": 0, "material": 0
        }]}],
        "materials": [{
            "pbrMetallicRoughness": {
                "baseColorTexture": {"index": 0},
                "metallicFactor": 0.0,
                "roughnessFactor": 1.0
            },
            "doubleSided": True
        }],
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
            {"buffer": 0, "byteOffset": offsets['idx'],  "byteLength": len(idx_buf),  "target": 34963},
            {"buffer": 0, "byteOffset": offsets['pos'],  "byteLength": len(pos_buf),  "target": 34962},
            {"buffer": 0, "byteOffset": offsets['uv'],   "byteLength": len(uv_buf),   "target": 34962},
            {"buffer": 0, "byteOffset": offsets['norm'], "byteLength": len(norm_buf), "target": 34962},
            {"buffer": 0, "byteOffset": offsets['img'],  "byteLength": len(img_bytes)},
        ],
        "buffers": [{"byteLength": len(bin_buf)}]
    }

    json_bytes = json.dumps(gltf, separators=(',', ':')).encode('utf-8')
    pad = (4 - len(json_bytes) % 4) % 4
    json_bytes += b' ' * pad

    json_chunk = struct.pack('<II', len(json_bytes), 0x4E4F534A) + json_bytes
    bin_chunk  = struct.pack('<II', len(bin_buf),    0x004E4942) + bin_buf
    total_len  = 12 + len(json_chunk) + len(bin_chunk)
    header     = struct.pack('<III', 0x46546C67, 2, total_len)

    with open(output_path, 'wb') as f:
        f.write(header + json_chunk + bin_chunk)

    return total_len

# ── Main ──────────────────────────────────────────────────────
if __name__ == '__main__':
    os.makedirs(GLB_DIR, exist_ok=True)

    paintings = sorted([f for f in os.listdir(PAINTINGS_DIR)
                        if f.endswith('.jpg') or f.endswith('.png')])

    print(f"🎨 Generating {len(paintings)} GLB files for AR...\n")
    total = len(paintings)
    ok = 0

    for i, fname in enumerate(paintings, 1):
        img_path = os.path.join(PAINTINGS_DIR, fname)
        glb_name = os.path.splitext(fname)[0] + '.glb'
        glb_path = os.path.join(GLB_DIR, glb_name)

        if os.path.exists(glb_path):
            print(f"[{i}/{total}] ⏭  Skipping {glb_name} (exists)")
            ok += 1
            continue

        print(f"[{i}/{total}] ⚙  {fname} → {glb_name}", end='  ')
        size = create_painting_glb(img_path, glb_path)
        if size:
            print(f"✅ {size//1024} KB")
            ok += 1
        else:
            print("❌ Failed")

    print(f"\n{'='*50}")
    print(f"✅ Done! {ok}/{total} GLB files in {GLB_DIR}/")
    print(f"{'='*50}")
    print("\nNext: git add images/ar/ && git commit -m 'Add AR GLB files' && git push")

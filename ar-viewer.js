// ============================================================
// Color Art Munich — AR Wall Viewer
// Uses Google's model-viewer + a dynamic GLB to show paintings
// on walls via WebXR (Android) and Quick Look (iOS)
// ============================================================

// Base64-encoded GLB template (flat 1x1m plane, texture slot = PAINTING_URI_PLACEHOLDER)
const GLB_TEMPLATE_B64 = "Z2xURgIAAABQBQAAqAQAAEpTT057ImFzc2V0Ijp7InZlcnNpb24iOiIyLjAiLCJnZW5lcmF0b3IiOiJDb2xvckFydE11YyBBUiJ9LCJzY2VuZSI6MCwic2NlbmVzIjpbeyJub2RlcyI6WzBdfV0sIm5vZGVzIjpbeyJtZXNoIjowLCJuYW1lIjoiUGFpbnRpbmcifV0sIm1lc2hlcyI6W3sibmFtZSI6IlBhaW50aW5nTWVzaCIsInByaW1pdGl2ZXMiOlt7ImF0dHJpYnV0ZXMiOnsiUE9TSVRJT04iOjEsIlRFWENPT1JEXzAiOjIsIk5PUk1BTCI6M30sImluZGljZXMiOjAsIm1hdGVyaWFsIjowfV19XSwibWF0ZXJpYWxzIjpbeyJuYW1lIjoiUGFpbnRpbmdNYXRlcmlhbCIsInBick1ldGFsbGljUm91Z2huZXNzIjp7ImJhc2VDb2xvclRleHR1cmUiOnsiaW5kZXgiOjB9LCJtZXRhbGxpY0ZhY3RvciI6MC4wLCJyb3VnaG5lc3NGYWN0b3IiOjEuMH0sImRvdWJsZVNpZGVkIjp0cnVlLCJhbHBoYU1vZGUiOiJPUEFRVUUifV0sInRleHR1cmVzIjpbeyJzb3VyY2UiOjAsInNhbXBsZXIiOjB9XSwic2FtcGxlcnMiOlt7Im1hZ0ZpbHRlciI6OTcyOSwibWluRmlsdGVyIjo5OTg3LCJ3cmFwUyI6MzMwNzEsIndyYXBUIjozMzA3MX1dLCJpbWFnZXMiOlt7InVyaSI6IlBBSU5USU5HX1VSSV9QTEFDRUhPTERFUiJ9XSwiYWNjZXNzb3JzIjpbeyJidWZmZXJWaWV3IjowLCJjb21wb25lbnRUeXBlIjo1MTIzLCJjb3VudCI6NiwidHlwZSI6IlNDQUxBUiJ9LHsiYnVmZmVyVmlldyI6MSwiY29tcG9uZW50VHlwZSI6NTEyNiwiY291bnQiOjQsInR5cGUiOiJWRUMzIiwibWluIjpbLTAuNSwtMC41LDBdLCJtYXgiOlswLjUsMC41LDBdfSx7ImJ1ZmZlclZpZXciOjIsImNvbXBvbmVudFR5cGUiOjUxMjYsImNvdW50Ijo0LCJ0eXBlIjoiVkVDMiJ9LHsiYnVmZmVyVmlldyI6MywiY29tcG9uZW50VHlwZSI6NTEyNiwiY291bnQiOjQsInR5cGUiOiJWRUMzIn1dLCJidWZmZXJWaWV3cyI6W3siYnVmZmVyIjowLCJieXRlT2Zmc2V0IjowLCJieXRlTGVuZ3RoIjoxMiwidGFyZ2V0IjozNDk2M30seyJidWZmZXIiOjAsImJ5dGVPZmZzZXQiOjEyLCJieXRlTGVuZ3RoIjo0OCwidGFyZ2V0IjozNDk2Mn0seyJidWZmZXIiOjAsImJ5dGVPZmZzZXQiOjYwLCJieXRlTGVuZ3RoIjozMiwidGFyZ2V0IjozNDk2Mn0seyJidWZmZXIiOjAsImJ5dGVPZmZzZXQiOjkyLCJieXRlTGVuZ3RoIjo0OCwidGFyZ2V0IjozNDk2Mn1dLCJidWZmZXJzIjpbeyJieXRlTGVuZ3RoIjoxNDB9XX0gjAAAAEJJTgAAAAIAAQABAAIAAwAAAAC/AAAAPwAAAAAAAAA/AAAAPwAAAAAAAAC/AAAAvwAAAAAAAAA/AAAAvwAAAAAAAAAAAACAPwAAgD8AAIA/AAAAAAAAAAAAAIA/AAAAAAAAAAAAAAAAAACAPwAAAAAAAAAAAACAPwAAAAAAAAAAAACAPwAAAAAAAAAAAACAPw==";

// ── Patch GLB texture URI at binary level ──────────────────────────────────────
function patchGlbTexture(b64Template, imageUrl) {
  const placeholder = "PAINTING_URI_PLACEHOLDER";
  
  // Decode base64 to binary string
  const binaryStr = atob(b64Template);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
  
  // Find the JSON chunk (starts at byte 12, length at bytes 12-15)
  const jsonLength = new DataView(bytes.buffer).getUint32(12, true);
  const jsonBytes  = bytes.slice(20, 20 + jsonLength);
  let jsonStr      = new TextDecoder().decode(jsonBytes);
  
  // Replace placeholder with actual image URL
  jsonStr = jsonStr.replace(placeholder, imageUrl);
  
  // Re-encode JSON chunk
  const newJsonBytes = new TextEncoder().encode(jsonStr);
  // Pad to 4 bytes
  const pad = (4 - (newJsonBytes.length % 4)) % 4;
  const paddedJson = new Uint8Array(newJsonBytes.length + pad);
  paddedJson.set(newJsonBytes);
  for (let i = newJsonBytes.length; i < paddedJson.length; i++) paddedJson[i] = 0x20;
  
  // Binary chunk starts after old JSON chunk
  const binStart  = 20 + jsonLength;
  const binChunk  = bytes.slice(binStart);
  
  // Rebuild GLB
  const newTotal  = 12 + 8 + paddedJson.length + binChunk.length;
  const glb       = new Uint8Array(newTotal);
  const view      = new DataView(glb.buffer);
  
  // Header
  view.setUint32(0, 0x46546C67, true); // magic "glTF"
  view.setUint32(4, 2, true);           // version
  view.setUint32(8, newTotal, true);    // total length
  
  // JSON chunk header
  view.setUint32(12, paddedJson.length, true);
  view.setUint32(16, 0x4E4F534A, true); // "JSON"
  glb.set(paddedJson, 20);
  
  // BIN chunk (unchanged)
  glb.set(binChunk, 20 + paddedJson.length);
  
  return glb;
}

// ── Create object URL for patched GLB ─────────────────────────────────────────
function createPaintingGlbUrl(imageUrl) {
  const glbBytes = patchGlbTexture(GLB_TEMPLATE_B64, imageUrl);
  const blob     = new Blob([glbBytes], { type: 'model/gltf-binary' });
  return URL.createObjectURL(blob);
}

// ── AR Modal ──────────────────────────────────────────────────────────────────
let arModal       = null;
let currentGlbUrl = null;

function initArModal() {
  if (arModal) return;

  // Inject model-viewer script once
  if (!document.querySelector('script[src*="model-viewer"]')) {
    const s = document.createElement('script');
    s.type = 'module';
    s.src  = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js';
    document.head.appendChild(s);
  }

  arModal = document.createElement('div');
  arModal.id = 'ar-modal';
  arModal.innerHTML = `
    <div class="ar-modal-inner">
      <button class="ar-close" id="ar-close">✕</button>
      <div class="ar-header">
        <span class="ar-label" id="ar-painting-title"></span>
        <p class="ar-hint">Tippen Sie auf <strong>AR ansehen</strong> um das Bild auf Ihrer Wand zu sehen</p>
      </div>
      <model-viewer
        id="ar-model-viewer"
        ar
        ar-modes="webxr scene-viewer quick-look"
        camera-controls
        touch-action="pan-y"
        shadow-intensity="0"
        exposure="1"
        style="width:100%;height:100%;background:transparent;"
        ar-button-label="AR ansehen"
      >
        <button slot="ar-button" class="ar-launch-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          Auf Wand ansehen
        </button>
      </model-viewer>
      <p class="ar-desktop-hint" id="ar-desktop-hint" style="display:none">
        📱 AR ist auf dem Smartphone verfügbar.<br>Öffnen Sie diese Seite auf iOS oder Android.
      </p>
    </div>
  `;
  document.body.appendChild(arModal);

  document.getElementById('ar-close').addEventListener('click', closeArModal);
  arModal.addEventListener('click', (e) => { if (e.target === arModal) closeArModal(); });

  // Detect if AR is supported
  setTimeout(() => {
    const mv = document.getElementById('ar-model-viewer');
    if (mv && !mv.canActivateAR) {
      document.getElementById('ar-desktop-hint').style.display = 'block';
    }
  }, 2000);
}

function openArModal(painting) {
  initArModal();

  // Set title
  document.getElementById('ar-painting-title').textContent = painting.title;

  // Revoke old URL
  if (currentGlbUrl) URL.revokeObjectURL(currentGlbUrl);

  // Build absolute image URL (needed for GLB texture)
  const imgPath    = 'images/paintings/' + painting.img;
  const absoluteUrl = new URL(imgPath, window.location.href).href;

  // Create patched GLB
  currentGlbUrl = createPaintingGlbUrl(absoluteUrl);

  const mv = document.getElementById('ar-model-viewer');
  mv.src   = currentGlbUrl;

  // Scale model to painting real size (default 1x1m if no size given)
  // paintings-data.js has size like "100x80x1,5 cm" → parse width/height
  let scaleX = 1.0, scaleY = 1.0;
  if (painting.size) {
    const match = painting.size.match(/(\d+)x(\d+)/);
    if (match) {
      scaleX = parseInt(match[1]) / 100; // cm → m
      scaleY = parseInt(match[2]) / 100;
    }
  }
  mv.setAttribute('scale', `${scaleX} ${scaleY} 0.02`);

  arModal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeArModal() {
  if (arModal) arModal.classList.remove('open');
  document.body.style.overflow = '';
}

// Export
window.openArModal  = openArModal;
window.closeArModal = closeArModal;

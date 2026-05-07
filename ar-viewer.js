// ============================================================
// Color Art Munich — AR Wall Viewer
// Android: Google Scene Viewer intent
// iOS/Desktop: instructions modal
// ============================================================

function openArModal(painting) {
  const existing = document.getElementById('ar-modal');
  if (existing) existing.remove();

  const imgPath     = 'images/paintings/' + painting.img;
  const absoluteUrl = new URL(imgPath, window.location.href).href;
  const isAndroid   = /android/i.test(navigator.userAgent);
  const isIos       = /iphone|ipad|ipod/i.test(navigator.userAgent);

  // Android Scene Viewer intent URL
  const sceneViewerUrl = 'intent://arvr.google.com/scene-viewer/1.0'
    + '?file=' + encodeURIComponent(absoluteUrl)
    + '&mode=ar_preferred'
    + '&resizable=false'
    + '&title=' + encodeURIComponent(painting.title)
    + '#Intent;scheme=https;package=com.google.android.googlequicksearchbox'
    + ';action=android.intent.action.VIEW'
    + ';S.browser_fallback_url=' + encodeURIComponent('https://play.google.com/store/apps/details?id=com.google.ar.core')
    + ';end;';

  const priceText = painting.sold
    ? 'Verkauft'
    : painting.price > 0
      ? painting.price.toLocaleString('de-DE') + ' \u20AC'
      : 'Preis auf Anfrage';

  const androidBtn = `
    <a class="ar-launch-btn" href="${sceneViewerUrl}">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
      </svg>
      Auf Wand ansehen (AR)
    </a>
    <p class="ar-note">Öffnet Google AR. Richten Sie die Kamera auf Ihre Wand.</p>`;

  const iosNote = `
    <p class="ar-note" style="text-align:center">
      Öffnen Sie diese Seite in <strong>Safari</strong> auf Ihrem iPhone.<br>
      Das AR-Symbol erscheint automatisch beim Bild.
    </p>`;

  const desktopNote = `
    <p class="ar-note" style="text-align:center">
      📱 AR ist auf dem Smartphone verfügbar.<br>
      Öffnen Sie die Seite auf Ihrem Android oder iPhone.
    </p>`;

  const modal = document.createElement('div');
  modal.id = 'ar-modal';
  modal.innerHTML = `
    <div class="ar-modal-inner">
      <button class="ar-close" id="ar-close-btn">&#10005;</button>
      <div class="ar-header">
        <span class="ar-label">${painting.title}</span>
        <span class="ar-price-tag">${priceText}</span>
      </div>
      <div class="ar-preview">
        <img src="${absoluteUrl}" alt="${painting.title}" />
      </div>
      <div class="ar-actions">
        ${isAndroid ? androidBtn : isIos ? iosNote : desktopNote}
      </div>
    </div>`;

  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => modal.classList.add('open'));

  document.getElementById('ar-close-btn').addEventListener('click', () => {
    modal.remove();
    document.body.style.overflow = '';
  });
  modal.addEventListener('click', (e) => {
    if (e.target === modal) { modal.remove(); document.body.style.overflow = ''; }
  });
}

window.openArModal = openArModal;

// ─── Mobile Navigation ─────────────────────────────────────
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('nav-links');

if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });

  // Close menu when a link is clicked
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => navLinks.classList.remove('open'));
  });
}

// ─── Scroll Fade-In ────────────────────────────────────────
const fadeEls = document.querySelectorAll('.fade-in');

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      // Stagger siblings slightly
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, i * 80);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

fadeEls.forEach(el => observer.observe(el));

// ─── Gallery Lightbox ──────────────────────────────────────
const lightbox     = document.getElementById('lightbox');
const lightboxImg  = document.getElementById('lightbox-img');
const lightboxClose = document.getElementById('lightbox-close');
const lightboxPrev = document.getElementById('lightbox-prev');
const lightboxNext = document.getElementById('lightbox-next');

if (lightbox) {
  const galleryItems = Array.from(document.querySelectorAll('.gallery-item img'));
  let currentIndex = 0;

  function openLightbox(index) {
    currentIndex = index;
    const src = galleryItems[index].src
      // Try to get full resolution from wixstatic by stripping resize params
      .replace(/\/v1\/fill\/[^/]+\/[^/]+$/, '')
      .replace(/\/v1\/fill\/[^/]+$/, '');
    lightboxImg.src = galleryItems[index].src; // use loaded src (already cached)
    lightboxImg.alt = galleryItems[index].alt;
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }

  function showNext() {
    currentIndex = (currentIndex + 1) % galleryItems.length;
    openLightbox(currentIndex);
  }

  function showPrev() {
    currentIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
    openLightbox(currentIndex);
  }

  // Attach click to each gallery item
  galleryItems.forEach((img, index) => {
    img.parentElement.addEventListener('click', () => openLightbox(index));
  });

  lightboxClose.addEventListener('click', closeLightbox);
  lightboxNext.addEventListener('click', (e) => { e.stopPropagation(); showNext(); });
  lightboxPrev.addEventListener('click', (e) => { e.stopPropagation(); showPrev(); });

  // Close on backdrop click
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape')      closeLightbox();
    if (e.key === 'ArrowRight')  showNext();
    if (e.key === 'ArrowLeft')   showPrev();
  });
}

// ─── Contact Form (Formspree) ──────────────────────────────
const form = document.getElementById('contact-form');
const formSuccess = document.getElementById('form-success');

if (form && formSuccess) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const btn = form.querySelector('.btn-submit');
    btn.textContent = 'Sende...';
    btn.disabled = true;

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        form.reset();
        formSuccess.style.display = 'block';
        btn.textContent = 'Gesendet ✓';
      } else {
        btn.textContent = 'Fehler — bitte erneut versuchen';
        btn.disabled = false;
      }
    } catch {
      btn.textContent = 'Fehler — bitte erneut versuchen';
      btn.disabled = false;
    }
  });
}

import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Universal carousel block.
 *
 * One block handles every carousel scenario from the inventory via section
 * classes: banner (hero/clickable), product, gallery, cards, variant, model.
 * Each child row of the block is one slide.
 *
 * Behaviour is tuned by class:
 *  - `banner`  : full-bleed, auto-plays, one slide visible
 *  - `product` / `cards` / `variant` / `model` : multi-item track, no autoplay
 *  - `gallery` : one large slide + thumbnail strip
 *
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const isBanner = block.classList.contains('banner');
  const isGallery = block.classList.contains('gallery');
  const autoplay = block.classList.contains('autoplay') || isBanner;

  const slides = [...block.children];
  const track = document.createElement('ul');
  track.className = 'carousel-track';

  slides.forEach((row, i) => {
    const slide = document.createElement('li');
    slide.className = 'carousel-slide';
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', 'slide');
    slide.setAttribute('aria-label', `${i + 1} of ${slides.length}`);
    moveInstrumentation(row, slide);
    while (row.firstElementChild) slide.append(row.firstElementChild);
    [...slide.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) {
        div.className = 'carousel-slide-image';
      } else {
        div.className = 'carousel-slide-body';
      }
    });
    // A slide wrapping a single link becomes fully clickable (clickable banner).
    const link = slide.querySelector('a');
    if (link && isBanner) {
      slide.classList.add('carousel-slide-clickable');
      slide.addEventListener('click', (e) => {
        if (e.target.closest('a')) return;
        link.click();
      });
    }
    track.append(slide);
  });

  // Optimise author-uploaded images.
  track.querySelectorAll('picture > img').forEach((img) => {
    const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimized.querySelector('img'));
    img.closest('picture').replaceWith(optimized);
  });

  const viewport = document.createElement('div');
  viewport.className = 'carousel-viewport';
  viewport.append(track);

  block.replaceChildren(viewport);

  const total = slides.length;
  if (total <= 1) return;

  let current = 0;
  const slideEls = [...track.children];

  const visibleCount = () => {
    const first = slideEls[0];
    if (!first) return 1;
    const gap = parseFloat(getComputedStyle(track).columnGap || '0') || 0;
    return Math.max(1, Math.round(viewport.clientWidth / (first.offsetWidth + gap)));
  };

  const maxIndex = () => Math.max(0, total - visibleCount());

  const update = () => {
    current = Math.min(Math.max(current, 0), maxIndex());
    const offset = slideEls[current] ? slideEls[current].offsetLeft : 0;
    track.style.transform = `translateX(-${offset}px)`;
    block.querySelectorAll('.carousel-dot').forEach((dot, i) => {
      dot.setAttribute('aria-current', i === current ? 'true' : 'false');
    });
  };

  const go = (dir) => {
    const next = current + dir;
    if (next < 0) current = maxIndex();
    else if (next > maxIndex()) current = 0;
    else current = next;
    update();
  };

  // Navigation arrows.
  const nav = document.createElement('div');
  nav.className = 'carousel-nav';
  ['prev', 'next'].forEach((kind) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `carousel-arrow carousel-arrow-${kind}`;
    btn.setAttribute('aria-label', kind === 'prev' ? 'Previous slide' : 'Next slide');
    btn.addEventListener('click', () => go(kind === 'prev' ? -1 : 1));
    nav.append(btn);
  });
  viewport.append(nav);

  // Dots / thumbnails.
  const dots = document.createElement('div');
  dots.className = isGallery ? 'carousel-thumbs' : 'carousel-dots';
  slideEls.forEach((slide, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'carousel-dot';
    dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
    if (isGallery) {
      const pic = slide.querySelector('picture');
      if (pic) dot.append(pic.cloneNode(true));
    }
    dot.addEventListener('click', () => { current = i; update(); });
    dots.append(dot);
  });
  block.append(dots);

  // Touch / drag support.
  let startX = null;
  viewport.addEventListener('pointerdown', (e) => { startX = e.clientX; });
  viewport.addEventListener('pointerup', (e) => {
    if (startX === null) return;
    const delta = e.clientX - startX;
    if (Math.abs(delta) > 40) go(delta < 0 ? 1 : -1);
    startX = null;
  });

  // Autoplay (banner only), pause on hover/focus.
  let timer = null;
  if (autoplay) {
    const start = () => { timer = setInterval(() => go(1), 6000); };
    const stop = () => { clearInterval(timer); timer = null; };
    block.addEventListener('mouseenter', stop);
    block.addEventListener('mouseleave', start);
    block.addEventListener('focusin', stop);
    block.addEventListener('focusout', start);
    start();
  }

  window.addEventListener('resize', update);
  update();
}

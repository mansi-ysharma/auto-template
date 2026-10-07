import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const rows = [...block.children];

  // First row may be a heading-only row (single cell, no image).
  let heading = '';
  if (rows.length && rows[0].children.length === 1 && !rows[0].querySelector('picture')) {
    heading = rows[0].textContent.trim();
    rows.shift();
  }

  const variants = rows.map((row) => {
    const cells = [...row.children];
    return {
      row,
      name: cells[0] ? cells[0].textContent.trim() : '',
      swatch: cells[1] ? cells[1].textContent.trim() : '',
      picture: cells[2] ? cells[2].querySelector('picture') : null,
      image: cells[2] ? cells[2].querySelector('img') : null,
      price: cells[3] ? cells[3].textContent.trim() : '',
    };
  });

  block.textContent = '';

  if (heading) {
    const h = document.createElement('h2');
    h.className = 'variant-selector-heading';
    h.textContent = heading;
    block.append(h);
  }

  const preview = document.createElement('div');
  preview.className = 'variant-selector-preview';
  const previewImage = document.createElement('div');
  previewImage.className = 'variant-selector-preview-image';
  preview.append(previewImage);

  const info = document.createElement('div');
  info.className = 'variant-selector-info';
  const nameEl = document.createElement('p');
  nameEl.className = 'variant-selector-name';
  nameEl.setAttribute('aria-live', 'polite');
  const priceEl = document.createElement('p');
  priceEl.className = 'variant-selector-price';
  info.append(nameEl, priceEl);
  preview.append(info);
  block.append(preview);

  const swatches = document.createElement('div');
  swatches.className = 'variant-selector-swatches';
  swatches.setAttribute('role', 'group');
  swatches.setAttribute('aria-label', 'Choose a variant');
  block.append(swatches);

  const buttons = [];

  const select = (index) => {
    const variant = variants[index];
    if (!variant) return;

    previewImage.textContent = '';
    if (variant.image) {
      const pic = createOptimizedPicture(
        variant.image.src,
        variant.image.alt || variant.name,
        true,
        [{ width: '900' }],
      );
      moveInstrumentation(variant.image, pic.querySelector('img'));
      previewImage.append(pic);
    }
    nameEl.textContent = variant.name;
    priceEl.textContent = variant.price;

    buttons.forEach((btn, i) => {
      btn.setAttribute('aria-pressed', i === index ? 'true' : 'false');
      btn.tabIndex = i === index ? 0 : -1;
    });
  };

  variants.forEach((variant, index) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'variant-selector-swatch';
    btn.setAttribute('aria-label', variant.name);
    btn.setAttribute('aria-pressed', 'false');
    moveInstrumentation(variant.row, btn);

    if (variant.swatch) {
      btn.style.setProperty('--variant-swatch-color', variant.swatch);
      btn.classList.add('variant-selector-swatch-color');
    } else if (variant.image) {
      const thumb = createOptimizedPicture(
        variant.image.src,
        variant.name,
        false,
        [{ width: '80' }],
      );
      btn.append(thumb);
    }

    btn.addEventListener('click', () => select(index));
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        const next = (index + 1) % buttons.length;
        buttons[next].focus();
        select(next);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = (index - 1 + buttons.length) % buttons.length;
        buttons[prev].focus();
        select(prev);
      }
    });

    buttons.push(btn);
    swatches.append(btn);
  });

  if (variants.length) select(0);
}

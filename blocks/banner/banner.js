import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const FLYOUT_DELAY = 1500;

/**
 * loads and decorates the banner block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const isFlyout = block.classList.contains('flyout');
  const [row] = block.children;
  if (!row) return;

  const cells = [...row.children];
  const imageCell = cells[0];
  const textCell = cells[1];

  // background image
  const bg = document.createElement('div');
  bg.className = 'banner-bg';
  const img = imageCell?.querySelector('img');
  if (img) {
    const optimized = createOptimizedPicture(
      img.src,
      img.getAttribute('alt') || '',
      false,
      [{ width: '1600' }],
    );
    moveInstrumentation(img, optimized.querySelector('img'));
    bg.append(optimized);
  }

  // content (text + CTAs)
  const content = document.createElement('div');
  content.className = 'banner-content';
  if (textCell) {
    while (textCell.firstElementChild) {
      content.append(textCell.firstElementChild);
    }
  }
  content.querySelectorAll('a').forEach((a) => {
    a.classList.add('button');
  });

  block.textContent = '';
  block.append(bg, content);

  if (isFlyout) {
    const storageKey = 'banner-flyout-dismissed';
    if (sessionStorage.getItem(storageKey) === 'true') {
      block.remove();
      return;
    }

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'banner-close';
    close.setAttribute('aria-label', 'Close banner');
    close.innerHTML = '&times;';
    close.addEventListener('click', () => {
      block.classList.remove('banner-open');
      sessionStorage.setItem(storageKey, 'true');
    });
    block.append(close);

    const reveal = () => block.classList.add('banner-open');
    const onScroll = () => {
      if (window.scrollY > 200) {
        reveal();
        window.removeEventListener('scroll', onScroll);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    setTimeout(reveal, FLYOUT_DELAY);
  }
}

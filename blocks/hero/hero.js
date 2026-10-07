import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Hero block.
 *
 * Authored as a document block table (name row "Hero" + one content cell), the
 * pipeline nests the content in row/cell wrappers: `.hero > div > div > …`.
 * The hero styling expects the content (picture, eyebrow, h1, copy, CTAs) to be
 * direct children of `.hero`, so we flatten any wrapper divs here. When the block
 * is already flat (hand-authored / auto-blocked) this is a no-op.
 *
 * @param {Element} block The hero block element
 */
export default function decorate(block) {
  // Flatten document-authored row/cell wrappers.
  const cells = block.querySelectorAll(':scope > div');
  if (cells.length && [...cells].every((c) => c.children.length && [...c.children].every((g) => g.tagName === 'DIV'))) {
    const frag = document.createDocumentFragment();
    block.querySelectorAll(':scope > div > div').forEach((cell) => {
      while (cell.firstChild) frag.append(cell.firstChild);
    });
    block.textContent = '';
    block.append(frag);
  }

  // Optimise the background image.
  const img = block.querySelector('picture > img');
  if (img) {
    const optimized = createOptimizedPicture(img.src, img.getAttribute('alt') || '', true, [{ width: '2000' }]);
    moveInstrumentation(img, optimized.querySelector('img'));
    img.closest('picture').replaceWith(optimized);
  }
}

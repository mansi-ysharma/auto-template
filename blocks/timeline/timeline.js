import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Builds a single event list item from an authored row.
 * @param {Element} row the authored row
 * @returns {Element} the decorated <li>
 */
function buildEvent(row) {
  const li = document.createElement('li');
  li.className = 'timeline-event';
  moveInstrumentation(row, li);

  const cells = [...row.children];
  const [dateCell, titleCell, textCell, imageCell] = cells;

  const marker = document.createElement('span');
  marker.className = 'timeline-marker';
  marker.setAttribute('aria-hidden', 'true');

  const content = document.createElement('div');
  content.className = 'timeline-content';

  const date = document.createElement('p');
  date.className = 'timeline-date';
  date.textContent = dateCell ? dateCell.textContent.trim() : '';

  const title = document.createElement('h3');
  title.className = 'timeline-title';
  title.textContent = titleCell ? titleCell.textContent.trim() : '';

  content.append(date, title);

  if (textCell) {
    const text = document.createElement('div');
    text.className = 'timeline-text';
    while (textCell.firstChild) text.append(textCell.firstChild);
    content.append(text);
  }

  if (imageCell && imageCell.querySelector('img')) {
    const img = imageCell.querySelector('img');
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    const figure = document.createElement('figure');
    figure.className = 'timeline-image';
    figure.append(optimizedPic);
    content.append(figure);
  }

  li.append(marker, content);
  return li;
}

/**
 * loads and decorates the timeline block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const isCarousel = block.classList.contains('carousel');
  const rows = [...block.children];

  // The block-level `heading` field is rendered by the backend as a leading
  // row that has a single cell containing only text (no image, no event data).
  let headingText = '';
  let itemRows = rows;
  const firstRow = rows[0];
  if (firstRow
    && firstRow.children.length === 1
    && !firstRow.querySelector('picture, img')
    && firstRow.textContent.trim()) {
    headingText = firstRow.textContent.trim();
    itemRows = rows.slice(1);
  }

  const ol = document.createElement('ol');
  ol.className = 'timeline-list';
  itemRows.forEach((row) => ol.append(buildEvent(row)));

  block.replaceChildren();

  if (headingText) {
    const heading = document.createElement('h2');
    heading.className = 'timeline-heading';
    heading.textContent = headingText;
    block.append(heading);
  }

  if (isCarousel) {
    const track = document.createElement('div');
    track.className = 'timeline-track';
    track.append(ol);

    const nav = document.createElement('div');
    nav.className = 'timeline-nav';

    const prev = document.createElement('button');
    prev.type = 'button';
    prev.className = 'timeline-arrow timeline-prev';
    prev.setAttribute('aria-label', 'Previous events');
    prev.textContent = '‹';

    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'timeline-arrow timeline-next';
    next.setAttribute('aria-label', 'Next events');
    next.textContent = '›';

    const step = () => Math.max(track.clientWidth * 0.8, 200);
    prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
    next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));

    nav.append(prev, next);
    block.append(track, nav);
  } else {
    block.append(ol);
  }
}

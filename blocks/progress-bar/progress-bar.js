import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * loads and decorates the progress-bar block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const rows = [...block.children];

  // Leading single-cell numeric row carries the block-level `current` field.
  let current = 1;
  let itemRows = rows;
  const firstRow = rows[0];
  if (firstRow
    && firstRow.children.length === 1
    && /^\d+$/.test(firstRow.textContent.trim())) {
    current = parseInt(firstRow.textContent.trim(), 10);
    itemRows = rows.slice(1);
  }

  const total = itemRows.length;
  if (current < 1) current = 1;
  if (total && current > total) current = total;

  const ol = document.createElement('ol');
  ol.className = 'progress-bar-list';

  itemRows.forEach((row, i) => {
    const stepIndex = i + 1;
    const li = document.createElement('li');
    li.className = 'progress-bar-step';
    moveInstrumentation(row, li);

    const label = row.textContent.trim();

    if (stepIndex < current) {
      li.classList.add('is-completed');
    } else if (stepIndex === current) {
      li.classList.add('is-current');
      li.setAttribute('aria-current', 'step');
    } else {
      li.classList.add('is-upcoming');
    }

    const marker = document.createElement('span');
    marker.className = 'progress-bar-marker';
    marker.setAttribute('aria-hidden', 'true');
    if (stepIndex < current) {
      marker.classList.add('progress-bar-check');
      marker.textContent = '✓';
    } else {
      marker.textContent = String(stepIndex);
    }

    const status = document.createElement('span');
    status.className = 'progress-bar-status';
    if (stepIndex < current) status.textContent = 'Completed: ';
    else if (stepIndex === current) status.textContent = 'Current: ';
    else status.textContent = 'Upcoming: ';

    const text = document.createElement('span');
    text.className = 'progress-bar-label';
    text.textContent = label;

    li.append(marker, status, text);
    ol.append(li);
  });

  block.replaceChildren(ol);
}

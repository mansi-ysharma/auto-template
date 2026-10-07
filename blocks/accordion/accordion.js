import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const singleOpen = block.classList.contains('single');
  const details = [];

  [...block.children].forEach((row) => {
    const headerCell = row.children[0];
    const contentCell = row.children[1];

    const detail = document.createElement('details');
    detail.className = 'accordion-item';
    moveInstrumentation(row, detail);

    const summary = document.createElement('summary');
    summary.className = 'accordion-item-title';
    if (headerCell) {
      while (headerCell.firstElementChild) summary.append(headerCell.firstElementChild);
      if (!summary.hasChildNodes() && headerCell.textContent.trim()) {
        summary.textContent = headerCell.textContent.trim();
      }
    }

    const body = document.createElement('div');
    body.className = 'accordion-item-body';
    if (contentCell) {
      while (contentCell.firstElementChild) body.append(contentCell.firstElementChild);
      if (!body.hasChildNodes() && contentCell.textContent.trim()) {
        body.textContent = contentCell.textContent.trim();
      }
    }

    detail.append(summary, body);
    details.push(detail);
  });

  if (singleOpen) {
    details.forEach((detail) => {
      detail.addEventListener('toggle', () => {
        if (detail.open) {
          details.forEach((other) => {
            if (other !== detail) other.open = false;
          });
        }
      });
    });
  }

  block.replaceChildren(...details);
}

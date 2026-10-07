import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * loads and decorates the menu block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const rows = [...block.children];

  // Leading single-cell text row (no link) carries the block-level `heading`.
  let headingText = '';
  let itemRows = rows;
  const firstRow = rows[0];
  if (firstRow
    && firstRow.children.length === 1
    && !firstRow.querySelector('a')
    && firstRow.textContent.trim()) {
    headingText = firstRow.textContent.trim();
    itemRows = rows.slice(1);
  }

  const nav = document.createElement('nav');
  nav.className = 'menu-nav';
  nav.setAttribute('aria-label', headingText || 'Section navigation');

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'menu-toggle';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', 'menu-list');
  toggle.textContent = headingText || 'Menu';

  if (headingText) {
    const heading = document.createElement('p');
    heading.className = 'menu-heading';
    heading.textContent = headingText;
    nav.append(heading);
  }

  const ul = document.createElement('ul');
  ul.className = 'menu-list';
  ul.id = 'menu-list';

  const currentPath = window.location.pathname;

  itemRows.forEach((row) => {
    const li = document.createElement('li');
    li.className = 'menu-item';
    moveInstrumentation(row, li);

    const cells = [...row.children];
    const [labelCell, linkCell] = cells;

    const link = (linkCell || labelCell).querySelector('a');
    const href = link ? link.getAttribute('href') : '';
    let label = labelCell ? labelCell.textContent.trim() : '';
    if (!label && link) label = link.textContent.trim();

    const a = document.createElement('a');
    a.className = 'menu-link';
    a.href = href;
    a.textContent = label;

    try {
      const linkPath = new URL(href, window.location.origin).pathname;
      if (href && linkPath === currentPath) {
        a.setAttribute('aria-current', 'page');
        a.classList.add('is-active');
      }
    } catch {
      // ignore invalid hrefs
    }

    li.append(a);
    ul.append(li);
  });

  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    nav.classList.toggle('is-open', !expanded);
  });

  nav.append(toggle, ul);
  block.replaceChildren(nav);
}

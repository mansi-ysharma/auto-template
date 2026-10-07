/**
 * loads and decorates the sticky-cta block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const [row] = block.children;
  if (!row) return;

  const cell = row.firstElementChild;

  // read showAfter from a second cell if authored, else default 300
  let showAfter = 300;
  const cells = [...row.children];
  if (cells[1]) {
    const parsed = parseInt(cells[1].textContent.trim(), 10);
    if (!Number.isNaN(parsed)) showAfter = parsed;
  }

  const content = document.createElement('div');
  content.className = 'sticky-cta-content';
  if (cell) {
    while (cell.firstElementChild) {
      content.append(cell.firstElementChild);
    }
  }
  content.querySelectorAll('a').forEach((a) => {
    a.classList.add('button');
  });

  const dismiss = document.createElement('button');
  dismiss.type = 'button';
  dismiss.className = 'sticky-cta-dismiss';
  dismiss.setAttribute('aria-label', 'Dismiss');
  dismiss.innerHTML = '&times;';
  dismiss.addEventListener('click', () => {
    block.classList.add('sticky-cta-dismissed');
  });

  block.textContent = '';
  block.append(content, dismiss);

  const onScroll = () => {
    if (window.scrollY > showAfter) {
      block.classList.add('sticky-cta-visible');
    } else {
      block.classList.remove('sticky-cta-visible');
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

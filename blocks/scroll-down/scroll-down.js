/**
 * loads and decorates the scroll-down block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const [row] = block.children;
  const label = row?.textContent.trim() || '';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'scroll-down-button';
  btn.setAttribute('aria-label', label || 'Scroll down');

  if (label) {
    const span = document.createElement('span');
    span.className = 'scroll-down-label';
    span.textContent = label;
    btn.append(span);
  }

  const chevron = document.createElement('span');
  chevron.className = 'scroll-down-chevron';
  chevron.setAttribute('aria-hidden', 'true');
  btn.append(chevron);

  btn.addEventListener('click', () => {
    const section = block.closest('.section');
    const next = section?.nextElementSibling;
    if (next) {
      next.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
    }
  });

  block.textContent = '';
  block.append(btn);
}

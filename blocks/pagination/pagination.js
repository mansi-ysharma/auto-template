// NOTE: The dealer-locator block has its own built-in pagination.
// This standalone pagination block is for generic listing containers.

/**
 * Reads a single cell's trimmed text content from a row.
 * @param {Element} row The row element
 * @param {number} index The cell index
 * @returns {string} Trimmed text content
 */
function cellText(row, index) {
  const cell = row.children[index];
  return cell ? cell.textContent.trim() : '';
}

/**
 * loads and decorates the pagination block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  const configRow = rows[0];
  const target = configRow ? cellText(configRow, 0) : '';
  const pageSize = Math.max(1, parseInt((configRow && cellText(configRow, 1)) || '9', 10) || 9);

  block.textContent = '';

  const targetEl = target ? document.querySelector(target) : null;
  if (!targetEl) {
    // Target not found — no-op gracefully.
    return;
  }

  const nav = document.createElement('nav');
  nav.className = 'pagination-nav';
  nav.setAttribute('aria-label', 'Pagination');
  block.append(nav);

  const state = { page: 1 };

  const render = () => {
    const items = [...targetEl.children];
    const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
    if (state.page > pageCount) state.page = pageCount;

    const start = (state.page - 1) * pageSize;
    const end = start + pageSize;
    items.forEach((item, i) => {
      item.hidden = i < start || i >= end;
    });

    nav.innerHTML = '';
    // Hide controls when everything fits on one page.
    if (pageCount <= 1) return;

    const makeBtn = (label, page, disabled, current) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pagination-btn';
      btn.textContent = label;
      if (disabled) btn.disabled = true;
      if (current) btn.setAttribute('aria-current', 'page');
      btn.addEventListener('click', () => {
        state.page = page;
        render();
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      return btn;
    };

    nav.append(makeBtn('Prev', state.page - 1, state.page === 1, false));
    for (let i = 1; i <= pageCount; i += 1) {
      nav.append(makeBtn(String(i), i, false, i === state.page));
    }
    nav.append(makeBtn('Next', state.page + 1, state.page === pageCount, false));
  };

  render();
}

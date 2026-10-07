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

const VIEW_LABELS = {
  list: 'List',
  grid: 'Grid',
  map: 'Map',
};

/**
 * loads and decorates the view-selector block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  const configRow = rows[0];
  const target = configRow ? cellText(configRow, 0) : '';

  const rawViews = (configRow && cellText(configRow, 1)) || 'list, grid';
  const views = rawViews
    .split(',')
    .map((v) => v.trim().toLowerCase())
    .filter((v) => VIEW_LABELS[v]);
  const validViews = views.length ? views : ['list', 'grid'];

  block.textContent = '';

  const group = document.createElement('div');
  group.className = 'view-selector-group';
  group.setAttribute('role', 'group');
  group.setAttribute('aria-label', 'Select view');

  const targetEl = target ? document.querySelector(target) : null;
  const storageKey = target ? `view-selector:${target}` : '';

  const applyView = (view) => {
    if (targetEl) {
      targetEl.dataset.view = view;
      targetEl.classList.remove('view-list', 'view-grid', 'view-map');
      targetEl.classList.add(`view-${view}`);
    }
    group.querySelectorAll('.view-selector-btn').forEach((btn) => {
      btn.setAttribute('aria-pressed', String(btn.dataset.view === view));
    });
    if (storageKey) {
      try {
        window.sessionStorage.setItem(storageKey, view);
      } catch (e) {
        // sessionStorage unavailable — ignore.
      }
    }
  };

  validViews.forEach((view) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'view-selector-btn';
    btn.dataset.view = view;
    btn.textContent = VIEW_LABELS[view];
    btn.setAttribute('aria-pressed', 'false');
    btn.addEventListener('click', () => applyView(view));
    group.append(btn);
  });

  block.append(group);

  // Restore remembered choice, else default to the first view.
  let initial = validViews[0];
  if (storageKey) {
    try {
      const stored = window.sessionStorage.getItem(storageKey);
      if (stored && validViews.includes(stored)) initial = stored;
    } catch (e) {
      // sessionStorage unavailable — ignore.
    }
  }
  applyView(initial);
}

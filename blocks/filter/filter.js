import { moveInstrumentation } from '../../scripts/scripts.js';

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
 * loads and decorates the filter block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  const configRow = rows[0];
  const target = configRow ? cellText(configRow, 0) : '';
  const title = (configRow && cellText(configRow, 1)) || 'Filter';

  const groups = rows.slice(1).map((row) => ({
    row,
    label: cellText(row, 0),
    key: cellText(row, 1),
    options: cellText(row, 2)
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
  })).filter((g) => g.key && g.options.length);

  block.textContent = '';

  const heading = document.createElement('h3');
  heading.className = 'filter-title';
  heading.textContent = title;
  block.append(heading);

  const form = document.createElement('form');
  form.className = 'filter-form';
  form.setAttribute('aria-label', title);

  groups.forEach((group) => {
    const fieldset = document.createElement('fieldset');
    fieldset.className = 'filter-group';
    fieldset.dataset.key = group.key;
    moveInstrumentation(group.row, fieldset);

    const legend = document.createElement('legend');
    legend.className = 'filter-group-label';
    legend.textContent = group.label || group.key;
    fieldset.append(legend);

    group.options.forEach((value) => {
      const id = `filter-${group.key}-${value}`.replace(/\s+/g, '-').toLowerCase();
      const wrapper = document.createElement('label');
      wrapper.className = 'filter-option';
      wrapper.setAttribute('for', id);

      const input = document.createElement('input');
      input.type = 'checkbox';
      input.id = id;
      input.className = 'filter-checkbox';
      input.dataset.key = group.key;
      input.value = value;

      const span = document.createElement('span');
      span.textContent = value;

      wrapper.append(input, span);
      fieldset.append(wrapper);
    });

    form.append(fieldset);
  });

  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'filter-clear';
  clearBtn.textContent = 'Clear all';
  form.append(clearBtn);

  block.append(form);

  const targetEl = target ? document.querySelector(target) : null;
  if (!targetEl) {
    // Target not found — no-op gracefully.
    return;
  }

  const applyFilters = () => {
    // Collect checked values grouped by key.
    const active = {};
    form.querySelectorAll('.filter-checkbox:checked').forEach((cb) => {
      const { key } = cb.dataset;
      if (!active[key]) active[key] = [];
      active[key].push(cb.value);
    });

    const activeKeys = Object.keys(active);
    [...targetEl.children].forEach((item) => {
      // An item matches if it satisfies EVERY active group (>=1 checked value).
      const matches = activeKeys.every((key) => {
        const attr = item.getAttribute(`data-${key}`);
        if (attr === null) return false;
        const itemValues = attr.split(',').map((v) => v.trim());
        return active[key].some((v) => itemValues.includes(v));
      });
      item.hidden = !matches;
    });
  };

  form.addEventListener('change', applyFilters);
  clearBtn.addEventListener('click', () => {
    form.querySelectorAll('.filter-checkbox:checked').forEach((cb) => {
      cb.checked = false;
    });
    applyFilters();
  });
}

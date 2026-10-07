import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

function parseSpecs(cell) {
  if (!cell) return [];
  const lines = [...cell.querySelectorAll('p, li')]
    .map((el) => el.textContent.trim())
    .filter(Boolean);
  const source = lines.length ? lines : cell.textContent.split('\n');
  return source
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf(':');
      if (idx === -1) return { label: line, value: '' };
      return {
        label: line.slice(0, idx).trim(),
        value: line.slice(idx + 1).trim(),
      };
    });
}

export default function decorate(block) {
  const rows = [...block.children];

  let heading = '';
  let maxCompare = 3;

  // Optional leading config row(s): single-cell rows with no image.
  while (
    rows.length
    && rows[0].children.length <= 2
    && !rows[0].querySelector('picture')
  ) {
    const cells = [...rows[0].children];
    const text = cells[0] ? cells[0].textContent.trim() : '';
    const second = cells[1] ? cells[1].textContent.trim() : '';
    if (/^\d+$/.test(text) && !second) {
      maxCompare = parseInt(text, 10);
    } else if (/^\d+$/.test(second)) {
      heading = text;
      maxCompare = parseInt(second, 10);
    } else {
      heading = text;
    }
    rows.shift();
  }

  const products = rows.map((row, i) => {
    const cells = [...row.children];
    return {
      id: `product-${i}`,
      row,
      name: cells[0] ? cells[0].textContent.trim() : '',
      image: cells[1] ? cells[1].querySelector('img') : null,
      price: cells[2] ? cells[2].textContent.trim() : '',
      specs: parseSpecs(cells[3]),
    };
  });

  block.textContent = '';

  if (heading) {
    const h = document.createElement('h2');
    h.className = 'product-comparison-heading';
    h.textContent = heading;
    block.append(h);
  }

  const selected = new Set();

  const grid = document.createElement('div');
  grid.className = 'product-comparison-grid';

  const tray = document.createElement('div');
  tray.className = 'product-comparison-tray';
  tray.hidden = true;
  tray.setAttribute('aria-live', 'polite');

  const trayItems = document.createElement('div');
  trayItems.className = 'product-comparison-tray-items';

  const trayActions = document.createElement('div');
  trayActions.className = 'product-comparison-tray-actions';

  const compareBtn = document.createElement('button');
  compareBtn.type = 'button';
  compareBtn.className = 'product-comparison-compare';
  compareBtn.textContent = 'Compare';

  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'product-comparison-clear';
  clearBtn.textContent = 'Clear';

  trayActions.append(compareBtn, clearBtn);
  tray.append(trayItems, trayActions);

  const dialog = document.createElement('div');
  dialog.className = 'product-comparison-table';
  dialog.hidden = true;

  const checkboxes = new Map();

  const updateCheckboxStates = () => {
    const atMax = selected.size >= maxCompare;
    products.forEach((product) => {
      const cb = checkboxes.get(product.id);
      cb.disabled = atMax && !selected.has(product.id);
    });
  };

  const renderTray = () => {
    trayItems.textContent = '';
    tray.hidden = selected.size === 0;
    if (selected.size) dialog.hidden = true;

    products
      .filter((p) => selected.has(p.id))
      .forEach((product) => {
        const item = document.createElement('div');
        item.className = 'product-comparison-tray-item';

        if (product.image) {
          const pic = createOptimizedPicture(
            product.image.src,
            product.name,
            false,
            [{ width: '120' }],
          );
          item.append(pic);
        }

        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'product-comparison-remove';
        remove.setAttribute('aria-label', `Remove ${product.name} from comparison`);
        remove.textContent = '×';
        remove.addEventListener('click', () => {
          selected.delete(product.id);
          checkboxes.get(product.id).checked = false;
          updateCheckboxStates();
          renderTray();
        });

        item.append(remove);
        trayItems.append(item);
      });

    compareBtn.disabled = selected.size < 2;
  };

  const renderTable = () => {
    const chosen = products.filter((p) => selected.has(p.id));
    dialog.textContent = '';
    if (!chosen.length) return;

    // Union of spec labels, preserving first-seen order.
    const labels = [];
    chosen.forEach((p) => p.specs.forEach((s) => {
      if (!labels.includes(s.label)) labels.push(s.label);
    }));

    const table = document.createElement('table');

    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    headRow.append(document.createElement('th'));
    chosen.forEach((product) => {
      const th = document.createElement('th');
      th.scope = 'col';
      th.textContent = `${product.name}${product.price ? ` — ${product.price}` : ''}`;
      headRow.append(th);
    });
    thead.append(headRow);
    table.append(thead);

    const tbody = document.createElement('tbody');
    labels.forEach((label) => {
      const tr = document.createElement('tr');
      const th = document.createElement('th');
      th.scope = 'row';
      th.textContent = label;
      tr.append(th);
      chosen.forEach((product) => {
        const td = document.createElement('td');
        const match = product.specs.find((s) => s.label === label);
        td.textContent = match ? match.value : '—';
        tr.append(td);
      });
      tbody.append(tr);
    });
    table.append(tbody);
    dialog.append(table);
  };

  products.forEach((product) => {
    const card = document.createElement('div');
    card.className = 'product-comparison-card';
    moveInstrumentation(product.row, card);

    if (product.image) {
      const pic = createOptimizedPicture(
        product.image.src,
        product.name,
        false,
        [{ width: '400' }],
      );
      moveInstrumentation(product.image, pic.querySelector('img'));
      const imgWrap = document.createElement('div');
      imgWrap.className = 'product-comparison-card-image';
      imgWrap.append(pic);
      card.append(imgWrap);
    }

    const body = document.createElement('div');
    body.className = 'product-comparison-card-body';
    const name = document.createElement('p');
    name.className = 'product-comparison-card-name';
    name.textContent = product.name;
    const price = document.createElement('p');
    price.className = 'product-comparison-card-price';
    price.textContent = product.price;
    body.append(name, price);

    const label = document.createElement('label');
    label.className = 'product-comparison-check';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.addEventListener('change', () => {
      if (cb.checked) selected.add(product.id);
      else selected.delete(product.id);
      updateCheckboxStates();
      renderTray();
    });
    label.append(cb, document.createTextNode(' Add to compare'));
    body.append(label);

    checkboxes.set(product.id, cb);
    card.append(body);
    grid.append(card);
  });

  compareBtn.addEventListener('click', () => {
    renderTable();
    dialog.hidden = false;
    dialog.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  clearBtn.addEventListener('click', () => {
    selected.clear();
    checkboxes.forEach((cb) => { cb.checked = false; });
    updateCheckboxStates();
    renderTray();
    dialog.hidden = true;
  });

  block.append(grid, dialog, tray);
  renderTray();
  updateCheckboxStates();
}

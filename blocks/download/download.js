import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Builds one download row.
 * @param {Element} row authored row
 * @param {boolean} selectable whether to render a checkbox
 * @param {number} index row index (for label association)
 * @returns {Element} the decorated <li>
 */
function buildItem(row, selectable, index) {
  const li = document.createElement('li');
  li.className = 'download-item';
  moveInstrumentation(row, li);

  const cells = [...row.children];
  const [titleCell, fileCell, descCell, typeCell, sizeCell] = cells;

  const title = titleCell ? titleCell.textContent.trim() : '';
  const link = fileCell ? fileCell.querySelector('a') : null;
  const href = link ? link.getAttribute('href') : '';
  const description = descCell ? descCell.textContent.trim() : '';
  const fileType = typeCell ? typeCell.textContent.trim() : '';
  const fileSize = sizeCell ? sizeCell.textContent.trim() : '';

  let checkbox;
  if (selectable) {
    checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'download-checkbox';
    checkbox.id = `download-item-${index}`;
    checkbox.dataset.href = href;
    checkbox.dataset.title = title;
    li.append(checkbox);
  }

  const body = document.createElement('div');
  body.className = 'download-body';

  const titleEl = document.createElement(selectable ? 'label' : 'span');
  titleEl.className = 'download-item-title';
  titleEl.textContent = title;
  if (selectable) titleEl.setAttribute('for', `download-item-${index}`);
  body.append(titleEl);

  if (description) {
    const desc = document.createElement('p');
    desc.className = 'download-item-description';
    desc.textContent = description;
    body.append(desc);
  }

  if (fileType || fileSize) {
    const meta = document.createElement('p');
    meta.className = 'download-item-meta';
    meta.textContent = [fileType, fileSize].filter(Boolean).join(' · ');
    body.append(meta);
  }

  const action = document.createElement('a');
  action.className = 'download-item-action';
  action.href = href;
  action.setAttribute('download', '');
  action.textContent = 'Download';
  action.setAttribute('aria-label', title ? `Download ${title}` : 'Download file');
  if (!href) action.setAttribute('aria-disabled', 'true');

  li.append(body, action);
  return li;
}

/**
 * loads and decorates the download block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const rows = [...block.children];

  // Leading single-cell text rows carry block-level `heading` and `selectable`.
  let headingText = '';
  let selectable = true;
  let itemRows = rows;

  const firstRow = rows[0];
  const secondRow = rows[1];
  const looksLikeConfig = (row) => row
    && row.children.length === 1
    && !row.querySelector('a, picture, img');

  if (looksLikeConfig(firstRow)) {
    headingText = firstRow.textContent.trim();
    itemRows = rows.slice(1);
    if (looksLikeConfig(secondRow)) {
      const val = secondRow.textContent.trim().toLowerCase();
      selectable = !(val === 'false' || val === 'no' || val === 'off');
      itemRows = rows.slice(2);
    }
  }

  block.replaceChildren();

  if (headingText) {
    const heading = document.createElement('h2');
    heading.className = 'download-heading';
    heading.textContent = headingText;
    block.append(heading);
  }

  let masterCheckbox;
  let downloadSelectedBtn;
  if (selectable) {
    const controls = document.createElement('div');
    controls.className = 'download-controls';

    const masterLabel = document.createElement('label');
    masterLabel.className = 'download-select-all';
    masterCheckbox = document.createElement('input');
    masterCheckbox.type = 'checkbox';
    masterCheckbox.className = 'download-master';
    const masterText = document.createElement('span');
    masterText.textContent = 'Select all';
    masterLabel.append(masterCheckbox, masterText);

    downloadSelectedBtn = document.createElement('button');
    downloadSelectedBtn.type = 'button';
    downloadSelectedBtn.className = 'download-selected';
    downloadSelectedBtn.textContent = 'Download selected';
    downloadSelectedBtn.disabled = true;

    controls.append(masterLabel, downloadSelectedBtn);
    block.append(controls);
  }

  const ul = document.createElement('ul');
  ul.className = 'download-list';
  itemRows.forEach((row, i) => ul.append(buildItem(row, selectable, i)));
  block.append(ul);

  if (!selectable) return;

  const checkboxes = () => [...ul.querySelectorAll('.download-checkbox')];

  const syncMaster = () => {
    const boxes = checkboxes();
    const checked = boxes.filter((b) => b.checked).length;
    masterCheckbox.checked = checked > 0 && checked === boxes.length;
    masterCheckbox.indeterminate = checked > 0 && checked < boxes.length;
    downloadSelectedBtn.disabled = checked === 0;
  };

  masterCheckbox.addEventListener('change', () => {
    checkboxes().forEach((b) => { b.checked = masterCheckbox.checked; });
    syncMaster();
  });

  ul.addEventListener('change', (e) => {
    if (e.target.classList.contains('download-checkbox')) syncMaster();
  });

  downloadSelectedBtn.addEventListener('click', () => {
    checkboxes()
      .filter((b) => b.checked && b.dataset.href)
      .forEach((b) => {
        const a = document.createElement('a');
        a.href = b.dataset.href;
        a.setAttribute('download', '');
        document.body.append(a);
        a.click();
        a.remove();
      });
  });

  syncMaster();
}

import { moveInstrumentation } from '../../scripts/scripts.js';

let tabIdCounter = 0;

function focusTab(tabs, index) {
  const clamped = (index + tabs.length) % tabs.length;
  tabs[clamped].focus();
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const uid = tabIdCounter;
  tabIdCounter += 1;

  const tablist = document.createElement('div');
  tablist.className = 'tabs-list';
  tablist.setAttribute('role', 'tablist');

  const panels = [];
  const tabButtons = [];

  [...block.children].forEach((row, i) => {
    const labelCell = row.children[0];
    const contentCell = row.children[1];
    const label = labelCell ? labelCell.textContent.trim() : `Tab ${i + 1}`;

    const tabId = `tab-${uid}-${i}`;
    const panelId = `tabpanel-${uid}-${i}`;

    const tab = document.createElement('button');
    tab.className = 'tabs-tab';
    tab.type = 'button';
    tab.id = tabId;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panelId);
    tab.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    tab.tabIndex = i === 0 ? 0 : -1;
    tab.textContent = label;

    const panel = document.createElement('div');
    panel.className = 'tabs-panel';
    panel.id = panelId;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tabId);
    if (i !== 0) panel.hidden = true;

    moveInstrumentation(row, panel);
    if (contentCell) {
      while (contentCell.firstElementChild) panel.append(contentCell.firstElementChild);
      if (!panel.hasChildNodes() && contentCell.textContent.trim()) {
        panel.textContent = contentCell.textContent.trim();
      }
    }

    tablist.append(tab);
    tabButtons.push(tab);
    panels.push(panel);
  });

  function activateTab(index) {
    tabButtons.forEach((tab, i) => {
      const selected = i === index;
      tab.setAttribute('aria-selected', selected ? 'true' : 'false');
      tab.tabIndex = selected ? 0 : -1;
      panels[i].hidden = !selected;
    });
  }

  tabButtons.forEach((tab, i) => {
    tab.addEventListener('click', () => activateTab(i));
    tab.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          focusTab(tabButtons, i + 1);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          focusTab(tabButtons, i - 1);
          break;
        case 'Home':
          e.preventDefault();
          focusTab(tabButtons, 0);
          break;
        case 'End':
          e.preventDefault();
          focusTab(tabButtons, tabButtons.length - 1);
          break;
        default:
          break;
      }
    });
    tab.addEventListener('focus', () => activateTab(i));
  });

  block.replaceChildren(tablist, ...panels);
}

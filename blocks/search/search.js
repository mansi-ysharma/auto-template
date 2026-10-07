/**
 * Reads block configuration from the authored rows.
 * Rows, in order: [placeholder], [endpoint], [categories]
 * @param {Element} block
 * @returns {{placeholder:string, endpoint:string, categories:string[]}}
 */
function readConfig(block) {
  const rows = [...block.children];
  const cell = (i) => {
    const row = rows[i];
    if (!row) return '';
    const target = row.children[row.children.length - 1] || row;
    return target.textContent.trim();
  };
  const placeholder = cell(0) || 'Search...';
  const endpoint = cell(1) || '';
  const categories = (cell(2) || 'All')
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);
  return { placeholder, endpoint, categories };
}

/**
 * Renders a friendly placeholder message into the results region.
 * @param {Element} results
 * @param {string} message
 */
function renderMessage(results, message) {
  results.innerHTML = '';
  const p = document.createElement('p');
  p.className = 'search-message';
  p.textContent = message;
  results.append(p);
}

/**
 * Renders a list of result objects ({title, path, category?}).
 * @param {Element} results
 * @param {Array<object>} items
 * @param {string} activeCategory
 */
function renderResults(results, items, activeCategory) {
  results.innerHTML = '';
  const filtered = activeCategory && activeCategory.toLowerCase() !== 'all'
    ? items.filter((it) => (it.category || '').toLowerCase() === activeCategory.toLowerCase())
    : items;

  if (!filtered.length) {
    renderMessage(results, 'No results found.');
    return;
  }

  const list = document.createElement('ul');
  list.className = 'search-list';
  filtered.forEach((item) => {
    const li = document.createElement('li');
    li.className = 'search-item';
    const a = document.createElement('a');
    a.href = item.path || '#';
    a.textContent = item.title || item.path || 'Untitled';
    li.append(a);
    list.append(li);
  });
  results.append(list);
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const config = readConfig(block);
  let lastResults = [];
  let activeCategory = config.categories[0] || 'All';

  block.textContent = '';

  // --- search form ---
  const form = document.createElement('form');
  form.className = 'search-box';
  form.setAttribute('role', 'search');

  const input = document.createElement('input');
  input.type = 'search';
  input.className = 'search-input';
  input.name = 'q';
  input.placeholder = config.placeholder;
  input.setAttribute('aria-label', config.placeholder);

  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'search-submit';
  submit.textContent = 'Search';

  form.append(input, submit);

  // --- category tabs ---
  const tablist = document.createElement('div');
  tablist.className = 'search-tabs';
  tablist.setAttribute('role', 'tablist');
  const tabs = [];
  config.categories.forEach((cat, i) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'search-tab';
    tab.textContent = cat;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    tab.dataset.category = cat;
    tabs.push(tab);
    tablist.append(tab);
  });

  // --- results region ---
  const results = document.createElement('div');
  results.className = 'search-results';
  results.setAttribute('aria-live', 'polite');

  block.append(form, tablist, results);

  /**
   * Runs a query against the configured endpoint (or shows a placeholder).
   * @param {string} query
   */
  async function runSearch(query) {
    if (!query) {
      renderMessage(results, 'Type a query to search.');
      return;
    }
    if (!config.endpoint) {
      // TODO: wire search backend
      renderMessage(results, 'Connect a search backend via the endpoint config.');
      return;
    }
    renderMessage(results, 'Searching...');
    try {
      const res = await fetch(config.endpoint + encodeURIComponent(query));
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data = await res.json();
      lastResults = Array.isArray(data) ? data : [];
      renderResults(results, lastResults, activeCategory);
    } catch (err) {
      // TODO: wire search backend
      // eslint-disable-next-line no-console
      console.error('Search failed', err);
      renderMessage(results, 'Connect a search backend via the endpoint config.');
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    runSearch(input.value.trim());
  });

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      activeCategory = tab.dataset.category;
      tabs.forEach((t) => t.setAttribute('aria-selected', t === tab ? 'true' : 'false'));
      if (lastResults.length) {
        renderResults(results, lastResults, activeCategory);
      }
    });
  });

  // prefill from ?q= on load
  const params = new URLSearchParams(window.location.search);
  const initial = params.get('q');
  if (initial) {
    input.value = initial;
    runSearch(initial.trim());
  } else {
    renderMessage(results, 'Type a query to search.');
  }
}

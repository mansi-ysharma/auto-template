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
 * Reads a cell's inner HTML from a row.
 * @param {Element} row The row element
 * @param {number} index The cell index
 * @returns {string} Inner HTML
 */
function cellHtml(row, index) {
  const cell = row.children[index];
  return cell ? cell.innerHTML : '';
}

/**
 * Extracts an href from a cell that may hold an anchor.
 * @param {Element} row The row element
 * @param {number} index The cell index
 * @returns {string} The link href
 */
function cellLink(row, index) {
  const cell = row.children[index];
  if (!cell) return '';
  const anchor = cell.querySelector('a');
  if (anchor) return anchor.getAttribute('href') || '';
  return cell.textContent.trim();
}

/**
 * Populates a select with sorted unique values.
 * @param {HTMLSelectElement} select The select element
 * @param {string} placeholder The default option label
 * @param {string[]} values The candidate values
 */
function fillSelect(select, placeholder, values) {
  const unique = [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
  select.innerHTML = '';
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = placeholder;
  select.append(defaultOption);
  unique.forEach((value) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    select.append(option);
  });
}

/**
 * loads and decorates the dealer-locator block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  const configRow = rows[0];
  const title = configRow ? cellText(configRow, 0) : '';
  const pageSize = Math.max(1, parseInt((configRow && cellText(configRow, 1)) || '6', 10) || 6);

  const dealers = rows.slice(1).map((row) => ({
    row,
    name: cellText(row, 0),
    state: cellText(row, 1),
    city: cellText(row, 2),
    address: cellHtml(row, 3),
    phone: cellText(row, 4),
    latitude: cellText(row, 5),
    longitude: cellText(row, 6),
    link: cellLink(row, 7),
  }));

  block.textContent = '';

  // Header
  if (title) {
    const heading = document.createElement('h2');
    heading.className = 'dealer-locator-title';
    heading.textContent = title;
    block.append(heading);
  }

  // Controls: search + state + city (Location Selector) and view toggle.
  const controls = document.createElement('div');
  controls.className = 'dealer-locator-controls';

  const search = document.createElement('input');
  search.type = 'search';
  search.className = 'dealer-locator-search';
  search.placeholder = 'Search dealers, city, address…';
  search.setAttribute('aria-label', 'Search dealers');

  const stateSelect = document.createElement('select');
  stateSelect.className = 'dealer-locator-state';
  stateSelect.setAttribute('aria-label', 'Filter by state');
  fillSelect(stateSelect, 'All states', dealers.map((d) => d.state));

  const citySelect = document.createElement('select');
  citySelect.className = 'dealer-locator-city';
  citySelect.setAttribute('aria-label', 'Filter by city');
  fillSelect(citySelect, 'All cities', dealers.map((d) => d.city));

  const viewToggle = document.createElement('div');
  viewToggle.className = 'dealer-locator-view-toggle';
  viewToggle.setAttribute('role', 'group');
  viewToggle.setAttribute('aria-label', 'View mode');

  const listBtn = document.createElement('button');
  listBtn.type = 'button';
  listBtn.className = 'dealer-locator-view-btn';
  listBtn.textContent = 'List';
  listBtn.dataset.view = 'list';
  listBtn.setAttribute('aria-pressed', 'true');

  const mapBtn = document.createElement('button');
  mapBtn.type = 'button';
  mapBtn.className = 'dealer-locator-view-btn';
  mapBtn.textContent = 'Map';
  mapBtn.dataset.view = 'map';
  mapBtn.setAttribute('aria-pressed', 'false');

  viewToggle.append(listBtn, mapBtn);
  controls.append(search, stateSelect, citySelect, viewToggle);
  block.append(controls);

  // Body: results list + map placeholder region.
  const body = document.createElement('div');
  body.className = 'dealer-locator-body';

  const results = document.createElement('ul');
  results.className = 'dealer-locator-results';

  const mapRegion = document.createElement('div');
  mapRegion.className = 'dealer-locator-map map-canvas';
  mapRegion.setAttribute('role', 'region');
  mapRegion.setAttribute('aria-label', 'Dealer map');
  // TODO: Google Maps — render dealer pins here using latitude/longitude.
  const mapPlaceholder = document.createElement('div');
  mapPlaceholder.className = 'dealer-locator-map-placeholder map-placeholder';
  mapRegion.append(mapPlaceholder);

  body.append(results, mapRegion);
  block.append(body);

  // Pagination controls
  const pagination = document.createElement('nav');
  pagination.className = 'dealer-locator-pagination';
  pagination.setAttribute('aria-label', 'Dealer results pages');
  block.append(pagination);

  const state = { page: 1, filtered: dealers.slice() };

  const renderCard = (dealer) => {
    const li = document.createElement('li');
    li.className = 'dealer-locator-card';
    moveInstrumentation(dealer.row, li);

    const name = document.createElement('h3');
    name.className = 'dealer-locator-card-name';
    name.textContent = dealer.name || 'Dealer';
    li.append(name);

    const meta = document.createElement('p');
    meta.className = 'dealer-locator-card-meta';
    meta.textContent = [dealer.city, dealer.state].filter(Boolean).join(', ');
    if (meta.textContent) li.append(meta);

    if (dealer.address) {
      const address = document.createElement('div');
      address.className = 'dealer-locator-card-address';
      address.innerHTML = dealer.address;
      li.append(address);
    }

    if (dealer.phone) {
      const phone = document.createElement('a');
      phone.className = 'dealer-locator-card-phone';
      phone.href = `tel:${dealer.phone.replace(/[^+\d]/g, '')}`;
      phone.textContent = dealer.phone;
      li.append(phone);
    }

    if (dealer.link) {
      const link = document.createElement('a');
      link.className = 'dealer-locator-card-link';
      link.href = dealer.link;
      link.textContent = 'View details';
      li.append(link);
    }
    return li;
  };

  const renderMapPins = () => {
    mapPlaceholder.innerHTML = '';
    const heading = document.createElement('p');
    heading.className = 'map-placeholder-title';
    heading.textContent = 'Map preview (no API key configured)';
    mapPlaceholder.append(heading);

    const pins = document.createElement('ul');
    pins.className = 'map-marker-list';
    state.filtered.forEach((dealer) => {
      const li = document.createElement('li');
      li.className = 'map-marker';
      const pinTitle = document.createElement('span');
      pinTitle.className = 'map-marker-title';
      pinTitle.textContent = dealer.name || 'Dealer';
      li.append(pinTitle);
      const pinMeta = document.createElement('div');
      pinMeta.className = 'map-marker-address';
      pinMeta.textContent = [dealer.city, dealer.state].filter(Boolean).join(', ');
      li.append(pinMeta);
      pins.append(li);
    });
    mapPlaceholder.append(pins);
  };

  const renderPagination = (pageCount) => {
    pagination.innerHTML = '';
    if (pageCount <= 1) return;

    const makeBtn = (label, page, disabled, current) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'dealer-locator-page-btn';
      btn.textContent = label;
      if (disabled) btn.disabled = true;
      if (current) btn.setAttribute('aria-current', 'page');
      btn.addEventListener('click', () => {
        state.page = page;
        // eslint-disable-next-line no-use-before-define
        render();
        block.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      return btn;
    };

    pagination.append(makeBtn('Prev', state.page - 1, state.page === 1, false));
    for (let i = 1; i <= pageCount; i += 1) {
      pagination.append(makeBtn(String(i), i, false, i === state.page));
    }
    pagination.append(makeBtn('Next', state.page + 1, state.page === pageCount, false));
  };

  const render = () => {
    const pageCount = Math.max(1, Math.ceil(state.filtered.length / pageSize));
    if (state.page > pageCount) state.page = pageCount;
    const start = (state.page - 1) * pageSize;
    const pageItems = state.filtered.slice(start, start + pageSize);

    results.innerHTML = '';
    if (!pageItems.length) {
      const empty = document.createElement('li');
      empty.className = 'dealer-locator-empty';
      empty.textContent = 'No dealers match your search.';
      results.append(empty);
    } else {
      pageItems.forEach((dealer) => results.append(renderCard(dealer)));
    }

    renderMapPins();
    renderPagination(pageCount);
  };

  const applyFilters = () => {
    const term = search.value.trim().toLowerCase();
    const stateVal = stateSelect.value;
    const cityVal = citySelect.value;
    state.filtered = dealers.filter((dealer) => {
      if (stateVal && dealer.state !== stateVal) return false;
      if (cityVal && dealer.city !== cityVal) return false;
      if (term) {
        const haystack = [dealer.name, dealer.city, dealer.state, dealer.address]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
    state.page = 1;
    render();
  };

  search.addEventListener('input', applyFilters);
  stateSelect.addEventListener('change', applyFilters);
  citySelect.addEventListener('change', applyFilters);

  const setView = (view) => {
    block.dataset.view = view;
    listBtn.setAttribute('aria-pressed', String(view === 'list'));
    mapBtn.setAttribute('aria-pressed', String(view === 'map'));
  };
  listBtn.addEventListener('click', () => setView('list'));
  mapBtn.addEventListener('click', () => setView('map'));

  setView('list');
  render();
}

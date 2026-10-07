import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Reads a single cell's text content from a row.
 * @param {Element} row The row element
 * @param {number} index The cell index
 * @returns {string} Trimmed text content
 */
function cellText(row, index) {
  const cell = row.children[index];
  return cell ? cell.textContent.trim() : '';
}

/**
 * loads and decorates the map block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const rows = [...block.children];

  // The first row is the block-level config (apiKey, center "lat,lng", zoom).
  // The `classes` variant is applied to the block, not rendered as a cell.
  // Remaining rows are marker items (title, latitude, longitude, address).
  const configRow = rows[0];
  const apiKey = configRow ? cellText(configRow, 0) : '';
  const [latitude = '', longitude = ''] = (configRow ? cellText(configRow, 1) : '')
    .split(',').map((v) => v.trim());
  const zoom = (configRow && cellText(configRow, 2)) || '12';

  const isRoute = block.classList.contains('route');

  const markers = rows.slice(1).map((row) => ({
    row,
    title: cellText(row, 0),
    latitude: cellText(row, 1),
    longitude: cellText(row, 2),
    address: row.children[2] ? row.children[2].innerHTML : '',
  }));

  block.textContent = '';

  const canvas = document.createElement('div');
  canvas.className = 'map-canvas';
  canvas.setAttribute('role', 'region');
  canvas.setAttribute('aria-label', 'Map');

  // Persist config for the future Google Maps integration.
  canvas.dataset.apiKey = apiKey;
  canvas.dataset.latitude = latitude;
  canvas.dataset.longitude = longitude;
  canvas.dataset.zoom = zoom;
  canvas.dataset.route = isRoute ? 'true' : 'false';

  if (apiKey) {
    // TODO: load Google Maps JS API with apiKey, drop markers, fit bounds;
    // for classes=route draw a directions polyline.
    // Intentionally NOT injecting an external script here so the block works
    // without valid keys in local/dev environments.
    canvas.dataset.mapsPending = 'true';
  }

  // Graceful styled placeholder so the block always renders something useful.
  const placeholder = document.createElement('div');
  placeholder.className = 'map-placeholder';

  const heading = document.createElement('p');
  heading.className = 'map-placeholder-title';
  heading.textContent = apiKey ? 'Map preview' : 'Map preview (no API key configured)';
  placeholder.append(heading);

  if (isRoute && markers.length >= 2) {
    const routeHint = document.createElement('p');
    routeHint.className = 'map-route-hint';
    const origin = markers[0].title || 'Origin';
    const destination = markers[markers.length - 1].title || 'Destination';
    routeHint.textContent = `${origin} → ${destination}`;
    placeholder.append(routeHint);
  }

  if (markers.length) {
    const list = document.createElement('ul');
    list.className = 'map-marker-list';
    markers.forEach((marker) => {
      const li = document.createElement('li');
      li.className = 'map-marker';
      moveInstrumentation(marker.row, li);

      const markerTitle = document.createElement('span');
      markerTitle.className = 'map-marker-title';
      markerTitle.textContent = marker.title || 'Untitled marker';
      li.append(markerTitle);

      if (marker.address) {
        const address = document.createElement('div');
        address.className = 'map-marker-address';
        address.innerHTML = marker.address;
        li.append(address);
      }
      list.append(li);
    });
    placeholder.append(list);
  } else {
    const empty = document.createElement('p');
    empty.className = 'map-empty';
    empty.textContent = 'No locations added yet.';
    placeholder.append(empty);
  }

  canvas.append(placeholder);
  block.append(canvas);
}

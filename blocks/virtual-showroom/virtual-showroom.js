/**
 * loads and decorates the virtual-showroom block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const rows = [...block.children];

  // Optional block-level heading rendered as a leading single-cell text row.
  let headingText = '';
  let itemRows = rows;
  const firstRow = rows[0];
  if (firstRow
    && firstRow.children.length === 1
    && !firstRow.querySelector('picture, img')
    && firstRow.textContent.trim()) {
    headingText = firstRow.textContent.trim();
    itemRows = rows.slice(1);
  }

  // Collect frame image sources in authored order.
  const frames = itemRows
    .map((row) => row.querySelector('img'))
    .filter((img) => img)
    .map((img) => ({ src: img.src, alt: img.alt || '' }));

  block.replaceChildren();

  if (headingText) {
    const heading = document.createElement('h2');
    heading.className = 'virtual-showroom-heading';
    heading.textContent = headingText;
    block.append(heading);
  }

  if (frames.length === 0) return;

  const viewer = document.createElement('div');
  viewer.className = 'virtual-showroom-viewer';
  viewer.setAttribute('role', 'img');
  viewer.setAttribute(
    'aria-label',
    `360 degree view, frame 1 of ${frames.length}. Use left and right arrow keys to rotate.`,
  );
  viewer.tabIndex = 0;

  const img = document.createElement('img');
  img.className = 'virtual-showroom-image';
  img.src = frames[0].src;
  img.alt = frames[0].alt;
  img.draggable = false;
  viewer.append(img);

  block.append(viewer);

  // Single frame: static display, no controls.
  if (frames.length === 1) return;

  // Preload all frames.
  frames.forEach((frame) => {
    const pre = new Image();
    pre.src = frame.src;
  });

  const hint = document.createElement('p');
  hint.className = 'virtual-showroom-hint';
  hint.textContent = 'Drag to rotate';
  hint.setAttribute('aria-hidden', 'true');

  const counter = document.createElement('p');
  counter.className = 'virtual-showroom-counter';
  counter.setAttribute('aria-hidden', 'true');

  block.append(hint, counter);

  let current = 0;
  const setFrame = (index) => {
    const total = frames.length;
    const next = ((index % total) + total) % total;
    if (next === current) return;
    current = next;
    img.src = frames[current].src;
    counter.textContent = `${current + 1} / ${total}`;
    viewer.setAttribute(
      'aria-label',
      `360 degree view, frame ${current + 1} of ${total}. Use left and right arrow keys to rotate.`,
    );
  };
  counter.textContent = `1 / ${frames.length}`;

  // Pointer drag scrubbing.
  let dragging = false;
  let startX = 0;
  let startFrame = 0;
  const sensitivity = () => Math.max(viewer.clientWidth / frames.length, 6);

  const onDown = (e) => {
    dragging = true;
    startX = e.clientX;
    startFrame = current;
    viewer.classList.add('is-dragging');
    viewer.setPointerCapture(e.pointerId);
    hint.classList.add('is-hidden');
  };
  const onMove = (e) => {
    if (!dragging) return;
    const delta = e.clientX - startX;
    const steps = Math.round(delta / sensitivity());
    setFrame(startFrame + steps);
  };
  const onUp = (e) => {
    dragging = false;
    viewer.classList.remove('is-dragging');
    if (viewer.hasPointerCapture(e.pointerId)) viewer.releasePointerCapture(e.pointerId);
  };

  viewer.addEventListener('pointerdown', onDown);
  viewer.addEventListener('pointermove', onMove);
  viewer.addEventListener('pointerup', onUp);
  viewer.addEventListener('pointercancel', onUp);

  // Keyboard rotation.
  viewer.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') {
      setFrame(current + 1);
      e.preventDefault();
    } else if (e.key === 'ArrowLeft') {
      setFrame(current - 1);
      e.preventDefault();
    }
  });
}

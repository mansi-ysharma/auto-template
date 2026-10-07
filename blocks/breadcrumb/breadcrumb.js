function prettify(segment) {
  return decodeURIComponent(segment)
    .replace(/\.[^/.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  const homeLabel = rows[0]?.children[0]?.textContent.trim() || 'Home';
  const homeHref = rows[1]?.children[0]?.textContent.trim()
    || rows[0]?.children[1]?.textContent.trim()
    || '/';

  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Breadcrumb');

  const ol = document.createElement('ol');
  ol.className = 'breadcrumb-list';

  const segments = window.location.pathname.split('/').filter(Boolean);

  const items = [{ label: homeLabel, href: homeHref, current: segments.length === 0 }];
  segments.forEach((segment, i) => {
    const isLast = i === segments.length - 1;
    const href = `/${segments.slice(0, i + 1).join('/')}`;
    items.push({ label: prettify(segment), href, current: isLast });
  });

  items.forEach((item) => {
    const li = document.createElement('li');
    li.className = 'breadcrumb-item';
    if (item.current) {
      const span = document.createElement('span');
      span.setAttribute('aria-current', 'page');
      span.textContent = item.label;
      li.append(span);
    } else {
      const a = document.createElement('a');
      a.href = item.href;
      a.textContent = item.label;
      li.append(a);
    }
    ol.append(li);
  });

  nav.append(ol);
  block.replaceChildren(nav);
}

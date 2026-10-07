const STORAGE_KEY = 'cookie-consent';

/**
 * loads and decorates the cookie-consent block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  // hide immediately if a choice was already made
  if (localStorage.getItem(STORAGE_KEY)) {
    block.remove();
    return;
  }

  const cells = [...(block.querySelector(':scope > div')?.children || [])];
  const messageCell = cells[0];
  const acceptLabel = cells[1]?.textContent.trim() || 'Accept';
  const declineLabel = cells[2]?.textContent.trim() || 'Decline';

  const message = document.createElement('div');
  message.className = 'cookie-consent-message';
  if (messageCell) {
    while (messageCell.firstElementChild) {
      message.append(messageCell.firstElementChild);
    }
  }

  const actions = document.createElement('div');
  actions.className = 'cookie-consent-actions';

  const makeButton = (label, choice, variant) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `button cookie-consent-${variant}`;
    btn.textContent = label;
    btn.addEventListener('click', () => {
      localStorage.setItem(STORAGE_KEY, choice);
      // TODO: wire to consent/martech
      document.dispatchEvent(
        new CustomEvent('cookie-consent', { detail: { choice } }),
      );
      block.remove();
    });
    return btn;
  };

  const accept = makeButton(acceptLabel, 'accepted', 'accept');
  const decline = makeButton(declineLabel, 'declined', 'decline');
  actions.append(decline, accept);

  block.textContent = '';
  block.setAttribute('role', 'dialog');
  block.setAttribute('aria-live', 'polite');
  block.setAttribute('aria-label', 'Cookie consent');
  block.append(message, actions);

  accept.focus();
}

/**
 * Reads a simple key/value config from the authored rows.
 * Each row is expected to be a single cell (block-level field values in order).
 * @param {Element} block the block element
 * @returns {object} config
 */
function readConfig(block) {
  const rows = [...block.children];
  const [titleRow, welcomeRow, providerRow, widgetRow] = rows;

  const cfg = {
    title: 'Chat with us',
    welcome: null,
    providerScript: '',
    widgetId: '',
  };

  if (titleRow && titleRow.textContent.trim()) cfg.title = titleRow.textContent.trim();
  if (welcomeRow) {
    const clone = welcomeRow.cloneNode(true);
    cfg.welcome = clone;
  }
  if (providerRow && providerRow.textContent.trim()) {
    cfg.providerScript = providerRow.textContent.trim();
  }
  if (widgetRow && widgetRow.textContent.trim()) cfg.widgetId = widgetRow.textContent.trim();

  return cfg;
}

/**
 * loads and decorates the chatbot block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const cfg = readConfig(block);
  block.replaceChildren();

  const launcher = document.createElement('button');
  launcher.type = 'button';
  launcher.className = 'chatbot-launcher';
  launcher.setAttribute('aria-haspopup', 'dialog');
  launcher.setAttribute('aria-expanded', 'false');
  launcher.setAttribute('aria-label', cfg.title);
  launcher.innerHTML = '<span class="chatbot-launcher-icon" aria-hidden="true">💬</span>';

  const panel = document.createElement('div');
  panel.className = 'chatbot-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'false');
  panel.setAttribute('aria-label', cfg.title);
  panel.hidden = true;

  const header = document.createElement('div');
  header.className = 'chatbot-header';
  const heading = document.createElement('h3');
  heading.className = 'chatbot-title';
  heading.textContent = cfg.title;
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'chatbot-close';
  closeBtn.setAttribute('aria-label', 'Close chat');
  closeBtn.textContent = '×';
  header.append(heading, closeBtn);

  const log = document.createElement('div');
  log.className = 'chatbot-log';
  log.setAttribute('role', 'log');
  log.setAttribute('aria-live', 'polite');

  const appendMessage = (text, from) => {
    const msg = document.createElement('div');
    msg.className = `chatbot-message chatbot-message-${from}`;
    if (typeof text === 'string') {
      msg.textContent = text;
    } else {
      msg.append(text);
    }
    log.append(msg);
    log.scrollTop = log.scrollHeight;
    return msg;
  };

  const form = document.createElement('form');
  form.className = 'chatbot-input-form';
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'chatbot-input';
  input.setAttribute('aria-label', 'Type your message');
  input.placeholder = 'Type your message…';
  input.autocomplete = 'off';
  const sendBtn = document.createElement('button');
  sendBtn.type = 'submit';
  sendBtn.className = 'chatbot-send';
  sendBtn.textContent = 'Send';
  form.append(input, sendBtn);

  panel.append(header, log, form);

  if (cfg.providerScript) {
    // TODO: inject provider script (providerScript/widgetId) and hand off
    // to the third-party chat widget. Values available:
    //   cfg.providerScript = external widget script URL
    //   cfg.widgetId       = provider widget/site id
    // Left as a stub to avoid loading an external script without valid keys.
    const notice = document.createElement('p');
    notice.className = 'chatbot-provider-notice';
    notice.textContent = 'Live chat is configured. The provider widget will load here.';
    log.append(notice);
  } else {
    // Mock conversation.
    const welcome = document.createElement('div');
    welcome.className = 'chatbot-welcome';
    if (cfg.welcome && cfg.welcome.textContent.trim()) {
      while (cfg.welcome.firstChild) welcome.append(cfg.welcome.firstChild);
    } else {
      welcome.textContent = 'Hi! How can we help you today?';
    }
    appendMessage(welcome, 'bot');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      appendMessage(text, 'user');
      input.value = '';
      window.setTimeout(() => {
        appendMessage('Thanks! A support agent will be with you shortly.', 'bot');
      }, 500);
    });
  }

  // Toggle + focus handling.
  const open = () => {
    panel.hidden = false;
    launcher.setAttribute('aria-expanded', 'true');
    block.classList.add('chatbot-open');
    input.focus();
  };
  const close = () => {
    panel.hidden = true;
    launcher.setAttribute('aria-expanded', 'false');
    block.classList.remove('chatbot-open');
    launcher.focus();
  };

  launcher.addEventListener('click', () => {
    if (panel.hidden) open();
    else close();
  });
  closeBtn.addEventListener('click', close);

  panel.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      close();
      return;
    }
    // Focus-trap-lite: keep Tab within the panel.
    if (e.key === 'Tab') {
      const focusable = panel.querySelectorAll('button, input, a[href]');
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        last.focus();
        e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === last) {
        first.focus();
        e.preventDefault();
      }
    }
  });

  block.append(launcher, panel);
}

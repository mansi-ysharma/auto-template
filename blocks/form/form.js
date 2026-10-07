import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Reads the block-level configuration from data attributes / first rows.
 * The container block model stores config on the block element as data-*
 * attributes when authored, but for robustness we also fall back to
 * sensible defaults.
 * @param {Element} block
 * @returns {{action:string, successMessage:string, submitLabel:string}}
 */
function readConfig(block) {
  return {
    action: block.dataset.action || '',
    successMessage: block.dataset.successMessage || 'Thank you.',
    submitLabel: block.dataset.submitLabel || 'Submit',
  };
}

/**
 * Parses a single authored field row into a field descriptor.
 * Each row is a set of nested cell divs in a fixed order matching the
 * `form-field` model: [kind, label, required, options].
 * The field key (`name`) is derived from the label; the placeholder falls
 * back to the label at build time.
 * @param {Element} row
 * @returns {object}
 */
function readField(row) {
  const cells = [...row.children];
  const cell = (i) => (cells[i] ? cells[i].textContent.trim() : '');
  const label = cell(1);
  const required = cell(2).toLowerCase();
  return {
    fieldType: (cell(0) || 'text').toLowerCase(),
    label,
    name: label.toLowerCase().replace(/\s+/g, '-') || 'field',
    placeholder: '',
    required: required === 'true' || required === 'yes',
    options: cell(3)
      ? cell(3).split(',').map((o) => o.trim()).filter(Boolean)
      : [],
    row,
  };
}

/**
 * Displays an inline validation error for a control.
 * @param {Element} control
 * @param {string} message
 */
function setError(control, message) {
  control.setAttribute('aria-invalid', 'true');
  const wrapper = control.closest('.form-field');
  if (!wrapper) return;
  let err = wrapper.querySelector('.form-error');
  if (!err) {
    err = document.createElement('p');
    err.className = 'form-error';
    err.setAttribute('role', 'alert');
    wrapper.append(err);
  }
  err.textContent = message;
}

/**
 * Clears an inline validation error for a control.
 * @param {Element} control
 */
function clearError(control) {
  control.removeAttribute('aria-invalid');
  const wrapper = control.closest('.form-field');
  const err = wrapper && wrapper.querySelector('.form-error');
  if (err) err.remove();
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TEL_RE = /^[+]?[\d\s()-]{6,}$/;

/**
 * Builds a labelled field wrapper with a shared id/for association.
 * @param {object} field
 * @param {number} index
 * @returns {{wrapper:HTMLElement, id:string}}
 */
function buildWrapper(field, index) {
  const wrapper = document.createElement('div');
  wrapper.className = `form-field form-field-${field.fieldType}`;
  const id = `form-${field.name || 'field'}-${index}`;
  moveInstrumentation(field.row, wrapper);
  return { wrapper, id };
}

/**
 * Adds a label element to a wrapper.
 */
function addLabel(wrapper, id, field) {
  if (!field.label) return;
  const label = document.createElement('label');
  label.setAttribute('for', id);
  label.textContent = field.label;
  if (field.required) {
    const req = document.createElement('span');
    req.className = 'form-required';
    req.setAttribute('aria-hidden', 'true');
    req.textContent = ' *';
    label.append(req);
  }
  wrapper.append(label);
}

/**
 * Adds help text to a wrapper and links it via aria-describedby.
 */
function addHelp(wrapper, id, control, field) {
  if (!field.helpText) return;
  const help = document.createElement('p');
  help.className = 'form-help';
  help.id = `${id}-help`;
  help.textContent = field.helpText;
  wrapper.append(help);
  control.setAttribute('aria-describedby', help.id);
}

/**
 * Renders an OTP field: 6 single-character inputs plus a stub verify flow.
 * @param {object} field
 * @param {string} id
 * @returns {HTMLElement} the group element (also exposes .otpValue())
 */
function buildOtp(field, id) {
  const group = document.createElement('div');
  group.className = 'form-otp';
  group.setAttribute('role', 'group');
  if (field.label) group.setAttribute('aria-label', field.label);

  const inputs = [];
  for (let i = 0; i < 6; i += 1) {
    const input = document.createElement('input');
    input.type = 'text';
    input.inputMode = 'numeric';
    input.maxLength = 1;
    input.className = 'form-otp-digit';
    input.id = `${id}-${i}`;
    input.setAttribute('aria-label', `Digit ${i + 1}`);
    input.autocomplete = 'off';
    input.addEventListener('input', () => {
      input.value = input.value.replace(/\D/g, '');
      if (input.value && inputs[i + 1]) inputs[i + 1].focus();
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !input.value && inputs[i - 1]) {
        inputs[i - 1].focus();
      }
    });
    inputs.push(input);
    group.append(input);
  }

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'form-otp-action';
  btn.textContent = 'Send OTP';

  const status = document.createElement('span');
  status.className = 'form-otp-status';
  status.setAttribute('role', 'status');

  let sent = false;
  btn.addEventListener('click', () => {
    // TODO: integrate OTP backend (send/verify)
    if (!sent) {
      sent = true;
      btn.textContent = 'Verify';
      status.textContent = 'OTP sent (simulated).';
      inputs[0].focus();
      return;
    }
    const code = inputs.map((inp) => inp.value).join('');
    if (/^\d{6}$/.test(code)) {
      group.dataset.verified = 'true';
      status.textContent = 'Verified.';
      status.classList.add('form-otp-verified');
    } else {
      group.dataset.verified = 'false';
      status.textContent = 'Enter all 6 digits.';
      status.classList.remove('form-otp-verified');
    }
  });

  group.append(btn, status);
  group.otpValue = () => inputs.map((inp) => inp.value).join('');
  group.isVerified = () => group.dataset.verified === 'true';
  return group;
}

/**
 * Renders a reCAPTCHA placeholder that is treated as passed client-side.
 * @param {object} field
 * @returns {HTMLElement}
 */
function buildRecaptcha() {
  const div = document.createElement('div');
  div.className = 'form-recaptcha';
  div.dataset.sitekey = '';
  div.textContent = 'reCAPTCHA';
  // TODO: load Google reCAPTCHA with data-sitekey
  return div;
}

/**
 * Builds the control element for a given field descriptor.
 * @param {object} field
 * @param {string} id
 * @returns {HTMLElement}
 */
function buildControl(field, id) {
  const { fieldType } = field;

  if (fieldType === 'otp') return buildOtp(field, id);
  if (fieldType === 'recaptcha') return buildRecaptcha(field);

  if (fieldType === 'textarea') {
    const ta = document.createElement('textarea');
    ta.id = id;
    ta.name = field.name;
    if (field.placeholder) ta.placeholder = field.placeholder;
    if (field.required) ta.required = true;
    return ta;
  }

  if (fieldType === 'select') {
    const select = document.createElement('select');
    select.id = id;
    select.name = field.name;
    if (field.required) select.required = true;
    if (field.placeholder) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = field.placeholder;
      opt.disabled = true;
      opt.selected = true;
      select.append(opt);
    }
    field.options.forEach((o) => {
      const opt = document.createElement('option');
      opt.value = o;
      opt.textContent = o;
      select.append(opt);
    });
    return select;
  }

  if (fieldType === 'radio' || fieldType === 'checkbox') {
    const set = document.createElement('fieldset');
    set.className = `form-choices form-choices-${fieldType}`;
    if (field.label) {
      const legend = document.createElement('legend');
      legend.textContent = field.label;
      set.append(legend);
    }
    field.options.forEach((o, i) => {
      const optId = `${id}-${i}`;
      const choice = document.createElement('div');
      choice.className = 'form-choice';
      const input = document.createElement('input');
      input.type = fieldType;
      input.id = optId;
      input.name = field.name;
      input.value = o;
      if (field.required && fieldType === 'radio' && i === 0) input.required = true;
      const label = document.createElement('label');
      label.setAttribute('for', optId);
      label.textContent = o;
      choice.append(input, label);
      set.append(choice);
    });
    return set;
  }

  // text, email, tel, number, date, hidden
  const input = document.createElement('input');
  input.type = fieldType === 'hidden' ? 'hidden' : fieldType;
  input.id = id;
  input.name = field.name;
  if (field.placeholder) input.placeholder = field.placeholder;
  if (field.required) input.required = true;
  return input;
}

/**
 * Validates the collected controls, returning true when valid.
 * @param {HTMLFormElement} form
 * @param {object[]} fields
 * @returns {boolean}
 */
function validate(form, fields) {
  let valid = true;
  fields.forEach((field) => {
    if (['hidden', 'recaptcha'].includes(field.fieldType)) return;
    const control = form.querySelector(`[name="${field.name}"]`);
    if (!control) return;
    clearError(control);
    const value = (control.value || '').trim();

    if (field.required && !value && field.fieldType !== 'otp') {
      setError(control, `${field.label || 'This field'} is required.`);
      valid = false;
      return;
    }
    if (value && field.fieldType === 'email' && !EMAIL_RE.test(value)) {
      setError(control, 'Enter a valid email address.');
      valid = false;
    }
    if (value && field.fieldType === 'tel' && !TEL_RE.test(value)) {
      setError(control, 'Enter a valid phone number.');
      valid = false;
    }
    if (value && field.fieldType === 'number' && Number.isNaN(Number(value))) {
      setError(control, 'Enter a valid number.');
      valid = false;
    }
  });
  return valid;
}

/**
 * Collects submitted values into a plain object.
 * @param {HTMLFormElement} form
 * @returns {object}
 */
function collect(form) {
  const data = {};
  const fd = new FormData(form);
  fd.forEach((value, key) => {
    if (data[key] !== undefined) {
      data[key] = [].concat(data[key], value);
    } else {
      data[key] = value;
    }
  });
  form.querySelectorAll('.form-otp').forEach((group, i) => {
    data[`otp${i === 0 ? '' : i}`] = group.otpValue();
  });
  return data;
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const config = readConfig(block);
  const fields = [...block.children].map(readField);

  const form = document.createElement('form');
  form.className = 'form-form';
  form.setAttribute('novalidate', '');
  if (config.action) form.action = config.action;

  fields.forEach((field, index) => {
    if (field.fieldType === 'hidden') {
      form.append(buildControl(field, `form-hidden-${index}`));
      return;
    }
    const { wrapper, id } = buildWrapper(field, index);
    const control = buildControl(field, id);
    const grouped = ['radio', 'checkbox'].includes(field.fieldType);
    if (!grouped) addLabel(wrapper, id, field);
    wrapper.append(control);
    addHelp(wrapper, id, control, field);
    form.append(wrapper);
  });

  const actions = document.createElement('div');
  actions.className = 'form-actions';
  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'form-submit';
  submit.textContent = config.submitLabel;
  actions.append(submit);
  form.append(actions);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate(form, fields)) return;

    const values = collect(form);
    submit.disabled = true;

    if (config.action) {
      try {
        await fetch(config.action, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });
      } catch (err) {
        // Never block on a missing/failing backend.
        // eslint-disable-next-line no-console
        console.error('Form submission failed', err);
      }
    } else {
      // eslint-disable-next-line no-console
      console.log('Form values', values);
    }

    const success = document.createElement('div');
    success.className = 'form-success';
    success.setAttribute('role', 'status');
    success.innerHTML = config.successMessage;
    form.replaceWith(success);
  });

  block.textContent = '';
  block.append(form);
}

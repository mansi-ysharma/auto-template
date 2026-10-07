function readConfig(block) {
  const config = {};
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (cells.length >= 2) {
      const key = cells[0].textContent.trim().toLowerCase().replace(/\s+/g, '');
      config[key] = cells[1].textContent.trim();
    }
  });
  return config;
}

export default function decorate(block) {
  const config = readConfig(block);

  const heading = config.heading || 'EMI Calculator';
  const currency = config.currency || '₹';
  const price = Number(config.price) || 1000000;
  const downPayment = Number(config.downpayment) || 100000;
  const interestRate = Number(config.interestrate) || 9;
  const tenureMonths = Number(config.tenuremonths) || 60;

  const money = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
  const fmt = (n) => `${currency}${money.format(Math.round(n))}`;

  block.textContent = '';

  const h = document.createElement('h2');
  h.className = 'emi-calculator-heading';
  h.textContent = heading;

  const form = document.createElement('form');
  form.className = 'emi-calculator-form';
  form.addEventListener('submit', (e) => e.preventDefault());

  const fields = [
    {
      key: 'price', label: 'Vehicle Price', value: price, min: 0, max: Math.max(price * 2, 100000), step: 10000, prefix: true,
    },
    {
      key: 'down', label: 'Down Payment', value: downPayment, min: 0, max: Math.max(price, 100000), step: 5000, prefix: true,
    },
    {
      key: 'rate', label: 'Interest Rate (% p.a.)', value: interestRate, min: 0, max: 30, step: 0.1, prefix: false,
    },
    {
      key: 'tenure', label: 'Tenure (months)', value: tenureMonths, min: 1, max: 120, step: 1, prefix: false,
    },
  ];

  const state = {};
  const rangeInputs = {};
  const numberInputs = {};

  fields.forEach((field) => {
    state[field.key] = field.value;

    const wrap = document.createElement('div');
    wrap.className = 'emi-calculator-field';

    const label = document.createElement('label');
    label.className = 'emi-calculator-label';
    label.textContent = field.label;
    const numberId = `emi-${field.key}-number`;
    label.setAttribute('for', numberId);

    const controls = document.createElement('div');
    controls.className = 'emi-calculator-controls';

    const range = document.createElement('input');
    range.type = 'range';
    range.className = 'emi-calculator-range';
    range.min = field.min;
    range.max = field.max;
    range.step = field.step;
    range.value = field.value;
    range.setAttribute('aria-label', field.label);

    const number = document.createElement('input');
    number.type = 'number';
    number.id = numberId;
    number.className = 'emi-calculator-number';
    number.min = field.min;
    number.step = field.step;
    number.value = field.value;

    rangeInputs[field.key] = range;
    numberInputs[field.key] = number;

    controls.append(range, number);
    wrap.append(label, controls);
    form.append(wrap);
  });

  const error = document.createElement('p');
  error.className = 'emi-calculator-error';
  error.setAttribute('role', 'alert');
  error.hidden = true;

  const result = document.createElement('div');
  result.className = 'emi-calculator-result';
  result.setAttribute('aria-live', 'polite');

  const emiRow = document.createElement('div');
  emiRow.className = 'emi-calculator-emi';
  const emiLabel = document.createElement('span');
  emiLabel.className = 'emi-calculator-emi-label';
  emiLabel.textContent = 'Monthly EMI';
  const emiValue = document.createElement('strong');
  emiValue.className = 'emi-calculator-emi-value';
  emiRow.append(emiLabel, emiValue);

  const summary = document.createElement('dl');
  summary.className = 'emi-calculator-summary';

  const makeSummary = (term) => {
    const dt = document.createElement('dt');
    dt.textContent = term;
    const dd = document.createElement('dd');
    summary.append(dt, dd);
    return dd;
  };

  const principalOut = makeSummary('Loan Amount');
  const interestOut = makeSummary('Total Interest');
  const totalOut = makeSummary('Total Payable');

  result.append(emiRow, summary);

  const compute = () => {
    const p = state.price - state.down;

    if (state.down >= state.price) {
      error.hidden = false;
      error.textContent = 'Down payment must be less than the vehicle price.';
      emiValue.textContent = fmt(0);
      principalOut.textContent = fmt(0);
      interestOut.textContent = fmt(0);
      totalOut.textContent = fmt(0);
      return;
    }
    error.hidden = true;

    const n = state.tenure;
    const r = state.rate / 12 / 100;

    let emi;
    if (r === 0) {
      emi = p / n;
    } else {
      const factor = (1 + r) ** n;
      emi = (p * r * factor) / (factor - 1);
    }

    const totalPayable = emi * n;
    const totalInterest = totalPayable - p;

    emiValue.textContent = fmt(emi);
    principalOut.textContent = fmt(p);
    interestOut.textContent = fmt(totalInterest);
    totalOut.textContent = fmt(totalPayable);
  };

  fields.forEach((field) => {
    const range = rangeInputs[field.key];
    const number = numberInputs[field.key];

    range.addEventListener('input', () => {
      state[field.key] = Number(range.value);
      number.value = range.value;
      compute();
    });

    number.addEventListener('input', () => {
      let val = Number(number.value);
      if (Number.isNaN(val)) return;
      if (val > Number(range.max)) {
        range.max = val;
      }
      if (val < field.min) val = field.min;
      state[field.key] = val;
      range.value = val;
      compute();
    });
  });

  block.append(h, form, error, result);
  compute();
}

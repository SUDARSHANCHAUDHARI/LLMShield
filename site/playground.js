// LLMShield playground. Uses the same compiled scanner as the CLI (copied to ./lib at deploy).
// Model text is untrusted: it is only ever written with textContent, never as HTML.
import {
  scanWith,
  getAttackRegistry,
  runMockSafe,
  runMockLeaky,
  callOpenRouter,
  toJsonReport,
  toMarkdownReport
} from './lib/browser.js';

const $ = id => document.getElementById(id);

const form = $('scan-form');
const runButton = $('run');
const formError = $('form-error');
const openRouterFields = $('openrouter-fields');
const results = $('results');
const resultsEmpty = $('results-empty');
const summary = $('summary');
const attackList = $('attack-list');
const findingsBox = $('findings');
const downloads = $('downloads');

let lastReport = null;

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key === 'text') node.textContent = value;
    else if (key === 'className') node.className = value;
    else node.setAttribute(key, value);
  }
  for (const child of children) node.append(child);
  return node;
}

function badge(level) {
  return el('span', { className: `badge ${level}`, text: level });
}

function selectedProvider() {
  return form.elements.provider.value;
}

function showError(message) {
  formError.textContent = message;
  formError.hidden = !message;
}

function providerFn(provider) {
  if (provider === 'mock') return runMockSafe;
  if (provider === 'mock-leaky') return runMockLeaky;
  const apiKey = $('api-key').value.trim();
  return request => callOpenRouter(request, apiKey);
}

function renderAttackRows() {
  attackList.replaceChildren(
    ...getAttackRegistry().map(attack =>
      el('li', { 'data-attack': attack.id }, [
        el('span', {}, [el('span', { text: attack.name }), el('br'), el('span', { className: 'meta', text: attack.category })]),
        el('span', { className: 'badge pending', text: 'waiting' })
      ])
    )
  );
}

function markAttack(attackId, finding) {
  const row = attackList.querySelector(`[data-attack="${CSS.escape(attackId)}"]`);
  if (!row) return;
  row.lastElementChild.replaceWith(finding ? badge(finding.risk) : el('span', { className: 'badge secure', text: 'held' }));
}

function renderSummary(report) {
  summary.replaceChildren(
    el('div', { className: 'stat' }, [badge(report.overallRisk), el('span', { className: 'label', text: 'overall risk' })]),
    el('div', { className: 'stat' }, [el('b', { text: String(report.score) }), el('span', { className: 'label', text: 'score / 100' })]),
    el('div', { className: 'stat' }, [el('b', { text: `${report.successfulAttacks} / ${report.totalAttacks}` }), el('span', { className: 'label', text: 'attacks got through' })]),
    el('div', { className: 'stat' }, [el('b', { text: report.leakStatus }), el('span', { className: 'label', text: 'worst leak' })])
  );
  summary.hidden = false;
}

function renderFindings(report) {
  if (report.findings.length === 0) {
    findingsBox.replaceChildren(el('p', { className: 'empty', text: 'No findings. Every attack was held.' }));
    return;
  }
  findingsBox.replaceChildren(
    ...report.findings.map(finding =>
      el('details', { className: 'finding' }, [
        el('summary', {}, [el('span', { text: finding.attackName }), badge(finding.risk)]),
        el('div', { className: 'body' }, [
          el('p', { text: `Leak status: ${finding.leakStatus}. Injected instruction followed: ${finding.injectionFollowed ? 'yes' : 'no'}.` }),
          el('strong', { text: 'Evidence' }),
          el('ul', {}, finding.evidence.map(item => el('li', { text: item }))),
          el('strong', { text: 'Model reply' }),
          el('pre', { text: finding.response }),
          el('p', { text: finding.recommendation })
        ])
      ])
    )
  );
}

function download(filename, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = el('a', { href: url, download: filename });
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

form.addEventListener('change', () => {
  openRouterFields.hidden = selectedProvider() !== 'openrouter';
});

form.addEventListener('submit', async event => {
  event.preventDefault();
  showError('');

  const provider = selectedProvider();
  const systemPrompt = $('system-prompt').value;
  const model = provider === 'openrouter' ? $('model').value.trim() : provider;

  if (!systemPrompt.trim()) return showError('Paste a system prompt to scan.');
  if (provider === 'openrouter' && !$('api-key').value.trim()) return showError('Enter your OpenRouter API key, or pick a demo model.');
  if (provider === 'openrouter' && !model) return showError('Enter an OpenRouter model, for example openai/gpt-4o-mini.');

  runButton.disabled = true;
  runButton.textContent = 'Scanning…';
  resultsEmpty.hidden = true;
  results.hidden = false;
  summary.hidden = true;
  downloads.hidden = true;
  findingsBox.replaceChildren();
  renderAttackRows();

  try {
    lastReport = await scanWith(
      { systemPrompt, provider, model, canary: $('canary').checked },
      providerFn(provider),
      ({ attack, finding }) => markAttack(attack.id, finding)
    );
    renderSummary(lastReport);
    renderFindings(lastReport);
    downloads.hidden = false;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    showError(
      error instanceof TypeError
        ? `Could not reach OpenRouter (${message}). Check your connection, or try again in a moment.`
        : message
    );
  } finally {
    runButton.disabled = false;
    runButton.textContent = 'Run scan';
  }
});

$('download-md').addEventListener('click', () => {
  if (lastReport) download('llmshield-report.md', toMarkdownReport(lastReport), 'text/markdown');
});

$('download-json').addEventListener('click', () => {
  if (lastReport) download('llmshield-report.json', toJsonReport(lastReport), 'application/json');
});

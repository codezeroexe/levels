#!/usr/bin/env node
// Install the Levels skills for coding agents other than Claude Code.
//
//   npx github:codezeroexe/levels            detect agents and install
//   node install.js --help                   all options
//
// Node 18 or newer, no dependencies. skills/ in this repository stays the
// source: each SKILL.md is translated while it is copied, nothing generated
// is committed.

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const readline = require('readline');

const SRC = path.join(__dirname, 'skills');
const MARK = '.levels-install';
const FILE_MARK = 'levels-install: managed by install.js';
const STATE = '.levels-agents.json';

// Agents with fixed models. Sources:
// Codex: https://learn.chatgpt.com/docs/models and .../agent-configuration/subagents.md
// Gemini: https://ai.google.dev/gemini-api/docs/models and https://geminicli.com/docs/core/subagents.md
// Agents with chosen models (opencode, Cursor, Copilot) ask at install or on first run.
const AGENTS = {
  codex: {
    label: 'Codex CLI',
    detect: { commands: ['codex'], dirs: ['.codex'] },
    invoke: '$name',
    models: { planner: 'gpt-6.1-sol', heavy: 'gpt-6.1-sol', light: 'gpt-6-luna' },
    effort: { planner: 'high', heavy: 'medium' },
    agentFile: (role) => path.join('.codex', 'agents', `levels-${role}.toml`),
    hint: 'a Codex model ID, for example gpt-6.1-sol or gpt-6-luna',
  },
  gemini: {
    label: 'Gemini CLI',
    detect: { commands: ['gemini'], dirs: ['.gemini'] },
    invoke: 'ask for the skill by name',
    models: { planner: 'gemini-4-argon', heavy: 'gemini-3.8-flash', light: 'gemini-3.5-flash-lite' },
    agentFile: (role) => path.join('.gemini', 'agents', `levels-${role}.md`),
    hint: 'a Gemini model ID, for example gemini-3.8-flash',
  },
  opencode: {
    label: 'opencode',
    detect: { commands: ['opencode'], dirs: [path.join('.config', 'opencode')] },
    invoke: '/name',
    choose: true,
    agentFile: (role) => path.join('.config', 'opencode', 'agents', `levels-${role}.md`),
    projectFile: (role) => path.join('.opencode', 'agents', `levels-${role}.md`),
    hint: 'provider/model, for example anthropic/claude-haiku-5-5',
  },
  cursor: {
    label: 'Cursor',
    detect: { commands: ['cursor-agent', 'cursor'], dirs: ['.cursor'] },
    invoke: '/name',
    choose: true,
    agentFile: (role) => path.join('.cursor', 'agents', `levels-${role}.md`),
    projectFile: (role) => path.join('.cursor', 'agents', `levels-${role}.md`),
    hint: 'a model ID from Cursor\'s model list, for example claude-haiku-5-5',
  },
  copilot: {
    label: 'GitHub Copilot CLI',
    detect: { commands: ['copilot'], dirs: ['.copilot'] },
    invoke: '/name',
    choose: true,
    agentFile: (role) => path.join('.copilot', 'agents', `levels-${role}.agent.md`),
    projectFile: (role) => path.join('.github', 'agents', `levels-${role}.agent.md`),
    hint: 'the model name as Copilot\'s /model list shows it',
  },
};

const ROLES = ['planner', 'heavy', 'light'];
const EXECUTORS = ['heavy', 'light'];

const EXECUTOR_TEXT = {
  heavy: 'Levels executor for sub-plans that cannot be fully written out in advance. Only start it for a Levels sub-plan.',
  light: 'Levels executor for fully specified sub-plans. Only start it for a Levels sub-plan.',
};

const EXECUTOR_PROMPT = [
  'You run one sub-plan from a Levels skill. Do exactly what the sub-plan says: the files, the steps and the done check it names.',
  'Do not change the scope, make design, architecture or security decisions, or review your own work.',
  'If a step is unclear or blocked, stop and report what is unclear. Do not guess.',
  'When you finish, report what you changed, file by file, and the result of the done check.',
].join('\n');

// ---------------------------------------------------------------- arguments

function parseArgs(argv) {
  const opts = { only: null, all: false, list: false, dryRun: false, uninstall: false,
    project: false, yes: false, force: false, help: false, models: {} };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => {
      if (i + 1 >= argv.length) fail(`${a} needs a value`);
      return argv[++i];
    };
    if (a === '--only') opts.only = next().split(',').map((s) => s.trim()).filter(Boolean);
    else if (a === '--all') opts.all = true;
    else if (a === '--list') opts.list = true;
    else if (a === '--dry-run') opts.dryRun = true;
    else if (a === '--uninstall') opts.uninstall = true;
    else if (a === '--project') opts.project = true;
    else if (a === '--yes' || a === '-y') opts.yes = true;
    else if (a === '--force') opts.force = true;
    else if (a === '--help' || a === '-h') opts.help = true;
    else if (a === '--models') {
      const [agent, list] = next().split('=');
      const parts = (list || '').split(',').map((s) => s.trim());
      if (!AGENTS[agent] || parts.length !== 3 || parts.some((p) => !p)) {
        fail('--models takes <agent>=<planner>,<heavy>,<light>');
      }
      opts.models[agent] = { planner: parts[0], heavy: parts[1], light: parts[2] };
    } else fail(`unknown option ${a}. Run with --help.`);
  }
  for (const id of opts.only || []) {
    if (id !== 'claude' && !AGENTS[id]) fail(`unknown agent ${id}. Known: ${Object.keys(AGENTS).join(', ')}, claude`);
  }
  return opts;
}

const HELP = `Install the Levels skills for coding agents other than Claude Code.

Usage: node install.js [options]
       npx github:codezeroexe/levels -- [options]

Options:
  --list              Show supported agents and which were found, then stop.
  --only a,b          Install for these agents only: ${Object.keys(AGENTS).join(', ')}.
                      "claude" prints the Claude Code install commands.
  --all               Install for every supported agent, found or not.
  --models a=p,h,l    Set the planner, heavy and light models for agent a.
  --project           Install into the current project instead of your home folder.
  --dry-run           Print what would change and change nothing.
  --uninstall         Remove what this installer wrote. Combine with --only to
                      remove one agent.
  --yes, -y           Do not ask questions. Agents without chosen models ask
                      on their first run.
  --force             Replace skill folders this installer did not write.
  --help, -h          Show this text.

Codex and Gemini CLI get fixed models. opencode, Cursor and Copilot ask which
models to use, here or on the first run of a skill.`;

function fail(msg) {
  console.error(`levels: ${msg}`);
  process.exit(1);
}

// ------------------------------------------------------------------ paths

function base(opts) {
  return opts.project ? process.cwd() : os.homedir();
}

function skillsRoot(opts) {
  return path.join(base(opts), '.agents', 'skills');
}

function agentPath(opts, id, role) {
  const agent = AGENTS[id];
  if (opts.project) return path.join(process.cwd(), (agent.projectFile || agent.agentFile)(role));
  return path.join(os.homedir(), agent.agentFile(role));
}

function onPath(cmd) {
  const dirs = (process.env.PATH || '').split(path.delimiter);
  const exts = process.platform === 'win32' ? (process.env.PATHEXT || '.EXE;.CMD').split(';') : [''];
  return dirs.some((d) => exts.some((e) => {
    try { return fs.statSync(path.join(d, cmd + e)).isFile(); } catch { return false; }
  }));
}

function detect(id) {
  const { commands, dirs } = AGENTS[id].detect;
  return commands.some(onPath) || dirs.some((d) => fs.existsSync(path.join(os.homedir(), d)));
}

// ------------------------------------------------------------ translation

// Exact replacements, applied in order. Whole lines first, then words.
const LINE_RULES = [
  ['Arguments: `$ARGUMENTS`',
    'Arguments: the text the user gave after the skill name. If there is none, use the defaults below.'],
  ['- Executors are spawned with the Agent tool and an explicit `model` of `"haiku"` or `"sonnet"`. Never leave the model unset.',
    '- Executors are started as the `levels-light` or `levels-heavy` sub-agent. Never run a sub-plan in a general sub-agent, because its model is not set.'],
  ['- If this session is not running Opus, say which model is running',
    '- If this session is not running the Planner model in your row of the table above, say which model is running'],
  ['spawn an Opus agent with no conversation history',
    'start a fresh sub-agent with no conversation history, on the Planner model if your agent lets you set it'],
  ['Use one AskUserQuestion call with four questions, each with `multiSelect: true`.',
    'Ask four questions in one ask-user call, each allowing several answers.'],
];

const WORD_RULES = [
  [/\(Opus\)/g, '(Planner)'],
  [/\bAskUserQuestion\b/g, 'the ask-user tool'],
  [/\bon Opus\b/g, 'on the Planner'],
  [/\bOpus\b/g, 'the Planner'],
  [/\bSonnet\b/g, 'Heavy'],
  [/\bHaiku\b/g, 'Light'],
];

// Anything left after translation that only Claude Code understands.
const LEFTOVER = /\$ARGUMENTS|\bAgent tool\b|AskUserQuestion|multiSelect|\b(Opus|Sonnet|Haiku)\b|"haiku"|"sonnet"/;

function splitSkill(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error('no frontmatter');
  const fields = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i < 0) throw new Error(`frontmatter line without a colon: ${line}`);
    let value = line.slice(i + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) value = JSON.parse(value);
    fields[line.slice(0, i).trim()] = value;
  }
  return { fields, body: m[2] };
}

function translateText(text) {
  for (const [from, to] of LINE_RULES) text = text.split(from).join(to);
  for (const [re, to] of WORD_RULES) text = text.replace(re, to);
  // "the Planner" at the start of a sentence or list item.
  return text.replace(/(^|[.!?]\s+|\n\s*(?:[-*]|\d+\.)\s+)the Planner/g, '$1The Planner');
}

function modelTable(installed) {
  const rows = ['| Agent | Planner | Heavy | Light |', '|---|---|---|---|'];
  for (const [id, models] of Object.entries(installed)) {
    const effort = AGENTS[id].effort || {};
    const cell = (r) => (models && models[r]
      ? `\`${models[r]}\`${effort[r] ? `, reasoning effort ${effort[r]}` : ''}`
      : 'not chosen');
    rows.push(`| ${AGENTS[id].label} | ${cell('planner')} | ${cell('heavy')} | ${cell('light')} |`);
  }
  return rows.join('\n');
}

function firstRunText(installed) {
  const open = Object.keys(installed).filter((id) => !installed[id]);
  if (!open.length) return '';
  const files = open.map((id) => {
    const a = AGENTS[id];
    return `- ${a.label}: \`${a.projectFile('light')}\` and \`${a.projectFile('heavy')}\`. Model format: ${a.hint}.`;
  }).join('\n');
  return `
If your row says "not chosen", do this before Step 1:

1. Look for the two sub-agent files for your agent in this project (listed below). If both exist, use them and go on.
2. Otherwise ask the user, in one round, which model to use as Planner, Heavy and Light, and whether to save the choice for this project or use it for this session only.
3. For this project: write the two files below, then tell the user to start a new session if your agent only reads sub-agents at start-up. Each file has the frontmatter fields \`name\` (\`levels-light\` or \`levels-heavy\`), \`description\` and \`model\`, and the executor instructions under the frontmatter: "${EXECUTOR_PROMPT.split('\n').join(' ')}"${open.includes('opencode') ? ' For opencode, also add `mode: subagent`.' : ''}
4. For this session only: pass the model when you start each sub-agent if your agent allows it. If it does not, say so and recommend **No delegation** at the delegation gate.

${files}
`;
}

function preamble(installed) {
  const invoke = Object.entries(installed)
    .map(([id]) => `${AGENTS[id].label}: ${AGENTS[id].invoke === '/name' ? '`/name`' : AGENTS[id].invoke === '$name' ? '`$name`' : AGENTS[id].invoke}`)
    .join('. ');
  return `## Models on this agent

This copy was installed by the Levels installer for agents other than Claude Code. The skill names three roles instead of Claude models:

- **Planner**: the model this session runs on. It plans, audits and reviews.
- **Heavy**: the \`levels-heavy\` sub-agent, for work that cannot be fully written out in advance.
- **Light**: the \`levels-light\` sub-agent, the default for fully specified work.

${modelTable(installed)}

Find your agent's row. "The Planner" in the steps below means the Planner model in that row. Start sub-plans with the sub-agent named \`levels-light\` or \`levels-heavy\`. If you cannot start a named sub-agent, say so and recommend **No delegation** at the delegation gate.
${firstRunText(installed)}
"The ask-user tool" means your agent's tool for asking the user a multiple-choice question. If you have none, ask in plain text with numbered options and wait for the answer.

Skill commands are written as \`/name\` below. How to start one on each agent: ${invoke}.

`;
}

function translateSkill(text, installed) {
  const { fields, body } = splitSkill(text);
  const meta = { 'opencode/slash': 'true' };
  if (fields.summary) meta.summary = translateText(fields.summary);
  if (fields['argument-hint']) meta['argument-hint'] = fields['argument-hint'];
  const head = [
    '---',
    `name: ${fields.name}`,
    `description: ${JSON.stringify(translateText(fields.description))}`,
    'metadata:',
    ...Object.entries(meta).map(([k, v]) => `  ${k}: ${JSON.stringify(v)}`),
    '---',
    '',
  ].join('\n');
  let out = translateText(body);
  const h1 = out.match(/^# .*\n\n?/m);
  const at = h1 ? h1.index + h1[0].length : 0;
  out = out.slice(0, at) + preamble(installed) + out.slice(at);
  const left = out.match(LEFTOVER) || head.match(LEFTOVER);
  if (left) throw new Error(`${fields.name}: Claude-only text left after translation: ${left[0]}`);
  return head + out;
}

// ------------------------------------------------------------ sub-agents

function agentFileText(id, role, model) {
  const name = `levels-${role}`;
  const desc = EXECUTOR_TEXT[role];
  if (id === 'codex') {
    const lines = [`# ${FILE_MARK}`, `name = ${JSON.stringify(name)}`, `description = ${JSON.stringify(desc)}`];
    if (model) lines.push(`model = ${JSON.stringify(model)}`);
    const effort = AGENTS.codex.effort[role];
    if (effort) lines.push(`model_reasoning_effort = ${JSON.stringify(effort)}`);
    lines.push(`developer_instructions = """\n${EXECUTOR_PROMPT}\n"""`, '');
    return lines.join('\n');
  }
  const fm = ['---', `name: ${name}`, `description: ${JSON.stringify(desc)}`];
  if (id === 'opencode') fm.push('mode: subagent');
  if (model) fm.push(`model: ${JSON.stringify(model)}`);
  fm.push('---', '', `<!-- ${FILE_MARK} -->`, '', EXECUTOR_PROMPT, '');
  return fm.join('\n');
}

// ---------------------------------------------------------- file actions

function owned(p) {
  let st;
  try { st = fs.lstatSync(p); } catch { return 'missing'; }
  if (st.isSymbolicLink()) return 'foreign';
  if (st.isDirectory()) return fs.existsSync(path.join(p, MARK)) ? 'ours' : 'foreign';
  return fs.readFileSync(p, 'utf8').includes(FILE_MARK) ? 'ours' : 'foreign';
}

function makeActions(opts) {
  const log = [];
  return {
    log,
    write(p, text) {
      log.push(`write  ${p}`);
      if (opts.dryRun) return;
      fs.mkdirSync(path.dirname(p), { recursive: true });
      fs.writeFileSync(p, text);
    },
    remove(p) {
      log.push(`remove ${p}`);
      if (opts.dryRun) return;
      fs.rmSync(p, { recursive: true, force: true });
    },
    note(msg) { log.push(`note   ${msg}`); },
  };
}

function readState(opts) {
  try { return JSON.parse(fs.readFileSync(path.join(skillsRoot(opts), STATE), 'utf8')); } catch { return {}; }
}

function writeSkills(opts, act, installed) {
  const root = skillsRoot(opts);
  for (const name of skillNames()) {
    const dest = path.join(root, name);
    if (owned(dest) === 'foreign') act.remove(dest); // only reached with --force
    const text = translateSkill(fs.readFileSync(path.join(SRC, name, 'SKILL.md'), 'utf8'), installed);
    act.write(path.join(dest, 'SKILL.md'), text);
    act.write(path.join(dest, MARK), 'Written by the Levels installer. Delete this folder to remove the skill.\n');
  }
  act.write(path.join(root, STATE), JSON.stringify(installed, null, 2) + '\n');
}

function skillNames() {
  return fs.readdirSync(SRC).filter((n) => fs.existsSync(path.join(SRC, n, 'SKILL.md'))).sort();
}

// Paths this run would replace that the installer did not write. A symlink
// counts, so a clone linked into a skills folder is never overwritten.
function conflicts(opts, agents) {
  const paths = skillNames().map((n) => path.join(skillsRoot(opts), n));
  for (const id of agents) for (const role of EXECUTORS) paths.push(agentPath(opts, id, role));
  return paths.filter((p) => owned(p) === 'foreign');
}

function removeSkills(opts, act) {
  const root = skillsRoot(opts);
  if (!fs.existsSync(root)) return;
  for (const name of fs.readdirSync(root)) {
    const p = path.join(root, name);
    if (owned(p) === 'ours' && fs.lstatSync(p).isDirectory()) act.remove(p);
  }
  if (fs.existsSync(path.join(root, STATE))) act.remove(path.join(root, STATE));
}

function writeAgents(opts, act, id, models) {
  for (const role of EXECUTORS) {
    act.write(agentPath(opts, id, role), agentFileText(id, role, models[role]));
  }
}

function removeAgents(opts, act, id) {
  for (const role of EXECUTORS) {
    const p = agentPath(opts, id, role);
    if (owned(p) === 'ours') act.remove(p);
  }
}

// ---------------------------------------------------------------- prompts

async function askModels(id) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const q = (s) => new Promise((r) => rl.question(s, (a) => r(a.trim())));
  console.log(`\n${AGENTS[id].label}: choose models now, or press Enter to choose on the first run of a skill.`);
  console.log(`Format: ${AGENTS[id].hint}.`);
  const out = {};
  for (const role of ROLES) {
    const a = await q(`  ${role[0].toUpperCase() + role.slice(1)} model: `);
    if (!a) { rl.close(); return null; }
    out[role] = a;
  }
  rl.close();
  return out;
}

// ------------------------------------------------------------------ main

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) { console.log(HELP); return; }

  const ids = Object.keys(AGENTS);
  if (opts.list) {
    for (const id of ids) {
      const how = AGENTS[id].choose ? 'models chosen by you' : 'fixed models';
      console.log(`${id.padEnd(9)} ${AGENTS[id].label.padEnd(20)} ${detect(id) ? 'found    ' : 'not found'} ${how}`);
    }
    console.log('claude    Claude Code          use the plugin (see README)');
    return;
  }

  if (opts.only && opts.only.includes('claude')) {
    console.log('Claude Code reads the skills from this repository directly. Install with:\n');
    console.log('  claude plugin marketplace add codezeroexe/levels');
    console.log('  claude plugin install levels@levels\n');
    opts.only = opts.only.filter((id) => id !== 'claude');
    if (!opts.only.length) return;
  }

  const targets = opts.only || (opts.all ? ids : ids.filter(detect));
  const act = makeActions(opts);
  const previous = readState(opts);

  if (opts.uninstall) {
    const remove = opts.only || Object.keys(previous).concat(ids.filter((id) => !(id in previous)));
    for (const id of remove) removeAgents(opts, act, id);
    const left = Object.fromEntries(Object.entries(previous).filter(([id]) => !remove.includes(id)));
    if (Object.keys(left).length) writeSkills(opts, act, left);
    else removeSkills(opts, act);
    finish(opts, act);
    return;
  }

  if (!targets.length) {
    console.log('No supported agent found. Run with --list to see what is looked for, or --only <agent> to install anyway.');
    return;
  }

  const clash = conflicts(opts, targets);
  if (clash.length && !opts.force) {
    fail(`these already exist and were not written by this installer, so nothing was changed:\n  ${clash.join('\n  ')}\n` +
      'Move or delete them, or run again with --force to replace them.');
  }

  const installed = { ...previous };
  for (const id of targets) {
    const agent = AGENTS[id];
    let models = opts.models[id] || (agent.choose ? previous[id] || null : agent.models);
    if (!models && agent.choose && !opts.yes && !opts.dryRun && process.stdin.isTTY) models = await askModels(id);
    installed[id] = models;
    if (models) writeAgents(opts, act, id, models);
    else act.note(`${agent.label}: no models chosen. The first run of a skill will ask.`);
  }
  writeSkills(opts, act, installed);

  const claudeCopy = path.join(os.homedir(), '.claude', 'skills', 'levels');
  if (!opts.project && fs.existsSync(claudeCopy) && targets.some((id) => id === 'opencode' || id === 'cursor')) {
    act.note('~/.claude/skills/levels exists. opencode and Cursor also read ~/.claude/skills, so they will list each skill twice.');
  }
  finish(opts, act, targets);
}

function finish(opts, act, targets) {
  for (const line of act.log) console.log(line);
  if (opts.dryRun) console.log('\nDry run: nothing was changed.');
  else if (targets) console.log(`\nInstalled for: ${targets.map((id) => AGENTS[id].label).join(', ')}. Start a new session in each agent to load the skills.`);
}

if (require.main === module) {
  main().catch((e) => fail(e.message));
}

module.exports = { translateSkill, agentFileText, AGENTS, LEFTOVER };

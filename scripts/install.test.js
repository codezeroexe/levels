// Checks for install.js. Run from the repository root:
//
//   node --test scripts/install.test.js
//
// Each test installs into a temporary home folder. No agent is started, so
// these check the files written, not whether an agent loads them.

'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const INSTALL = path.join(ROOT, 'install.js');
const { LEFTOVER } = require(INSTALL);
const SKILLS = fs.readdirSync(path.join(ROOT, 'skills')).sort();

function run(home, args, cwd = ROOT) {
  return execFileSync(process.execPath, [INSTALL, ...args], {
    cwd, env: { ...process.env, HOME: home, USERPROFILE: home }, encoding: 'utf8', stdio: 'pipe',
  });
}

function tmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'levels-'));
}

test('installs every skill with no Claude-only text left', () => {
  const home = tmp();
  run(home, ['--all', '--yes']);
  for (const name of SKILLS) {
    const text = fs.readFileSync(path.join(home, '.agents', 'skills', name, 'SKILL.md'), 'utf8');
    assert.match(text, new RegExp(`^---\\nname: ${name}\\ndescription: "`), name);
    assert.ok(text.includes('## Models on this agent'), `${name}: no models section`);
    const left = text.match(LEFTOVER);
    assert.strictEqual(left, null, `${name}: ${left && left[0]}`);
  }
});

test('writes sub-agents with fixed models for Codex and Gemini only', () => {
  const home = tmp();
  run(home, ['--all', '--yes']);
  const codex = fs.readFileSync(path.join(home, '.codex', 'agents', 'levels-light.toml'), 'utf8');
  assert.match(codex, /^model = "gpt-6-luna"$/m);
  const gemini = fs.readFileSync(path.join(home, '.gemini', 'agents', 'levels-heavy.md'), 'utf8');
  assert.match(gemini, /^model: "gemini-3.8-flash"$/m);
  for (const p of ['.config/opencode/agents/levels-light.md', '.cursor/agents/levels-light.md', '.copilot/agents/levels-light.agent.md']) {
    assert.ok(!fs.existsSync(path.join(home, p)), `${p} written without a model choice`);
  }
  const skill = fs.readFileSync(path.join(home, '.agents', 'skills', 'design-level', 'SKILL.md'), 'utf8');
  assert.match(skill, /\| opencode \| not chosen \| not chosen \| not chosen \|/);
  assert.match(skill, /\| Codex CLI \| `gpt-6.1-sol`, reasoning effort high, or `gpt-6-astra` \|/);
});

test('--models writes the chosen models', () => {
  const home = tmp();
  run(home, ['--only', 'copilot', '--models', 'copilot=A,B,C']);
  const heavy = fs.readFileSync(path.join(home, '.copilot', 'agents', 'levels-heavy.agent.md'), 'utf8');
  assert.match(heavy, /^model: "B"$/m);
  const skill = fs.readFileSync(path.join(home, '.agents', 'skills', 'levels', 'SKILL.md'), 'utf8');
  assert.match(skill, /\| GitHub Copilot CLI \| `A` \| `B` \| `C` \|/);
});

test('refuses to replace a symlinked skill folder and changes nothing', () => {
  const home = tmp();
  const skills = path.join(home, '.agents', 'skills');
  fs.mkdirSync(skills, { recursive: true });
  fs.symlinkSync(path.join(ROOT, 'skills', 'levels'), path.join(skills, 'levels'));
  assert.throws(() => run(home, ['--only', 'codex']));
  assert.deepStrictEqual(fs.readdirSync(skills), ['levels']);
  assert.ok(fs.lstatSync(path.join(skills, 'levels')).isSymbolicLink());
});

test('uninstall removes only what the installer wrote', () => {
  const home = tmp();
  run(home, ['--only', 'codex,gemini']);
  fs.mkdirSync(path.join(home, '.agents', 'skills', 'other'), { recursive: true });
  run(home, ['--uninstall', '--only', 'gemini']);
  assert.ok(!fs.existsSync(path.join(home, '.gemini', 'agents', 'levels-light.md')));
  const skill = fs.readFileSync(path.join(home, '.agents', 'skills', 'levels', 'SKILL.md'), 'utf8');
  assert.ok(!skill.includes('Gemini CLI |'), 'Gemini row still in the models table');
  run(home, ['--uninstall']);
  assert.deepStrictEqual(fs.readdirSync(path.join(home, '.agents', 'skills')), ['other']);
  assert.deepStrictEqual(fs.readdirSync(path.join(home, '.codex', 'agents')), []);
});

test('--project writes into the current folder', () => {
  const home = tmp();
  const project = tmp();
  run(home, ['--project', '--only', 'codex'], project);
  assert.ok(fs.existsSync(path.join(project, '.agents', 'skills', 'levels', 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(project, '.codex', 'agents', 'levels-heavy.toml')));
  assert.ok(!fs.existsSync(path.join(home, '.agents')));
});

test('--dry-run changes nothing', () => {
  const home = tmp();
  run(home, ['--all', '--yes', '--dry-run']);
  assert.deepStrictEqual(fs.readdirSync(home), []);
});

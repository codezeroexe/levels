<!-- levels
design: 0/3 gaps=9
backend: 0/3 gaps=11
test: 0/2 gaps=2
-->

# Levels

This is the record from the first test run of the skills, on a throwaway notes app: one Node server file, one HTML page, one JSON file for storage. `design-level` and `backend-level` ran in `audit` mode. `test-level` ran in `audit` mode and then in `build` mode. The person testing answered the skills' questions, so the profiles are marked as assumed.

## Design

- Date: 2026-10-13
- Target level: 3
- Reached level: 0
- Evidence: `public/index.html:3` has one inline style rule, no type scale, no palette and no viewport tag, so phone width is not handled.
- Open gaps (9): viewport and phone layout; spacing scale; type scale; palette with roles; tokens; loading, empty and error states; hover, focus and pressed states; concept, mark and favicon; entry surface.
- Chosen: nothing yet (audit mode).
- Note: target 3 is too high for a one-screen notes tool. Level 2 fits.

## Backend

- Date: 2026-10-13
- Target level: 3
- Reached level: 0
- Hosting profile (assumed): one machine, localhost only, one user, local JSON file, no deploy.
- Evidence: a malformed POST body crashes the process (`server.js:17`); `GET /../server.js` returns the source (`server.js:28`); the port is fixed in code (`server.js:32`); no tests, no lint.
- Edge cases: 3 entry points, 12 categories. Handled 0, not handled 14, does not apply 22.
- Edge cases not handled (first 4 of 14):
  - `POST /api/notes`, malformed body: the process exits.
  - `GET /<path>`, path traversal: any file the process can read is returned.
  - `POST /api/notes`, two requests at once: one note is lost between load and save.
  - `POST /api/notes`, after a delete: a new note reuses an existing id.
- Open gaps (11): crash on malformed body; path traversal; no input validation; write of `notes.json` is not atomic; lost update between load and save; id reuse after delete; missing or corrupt `notes.json` at start; no body size limit; no error format; configuration in code; no tests.
- Removed by the profile: rate limiting, authentication, encryption in transit, more than one instance.
- Note: target 3 is too high for a localhost tool. Level 2 fits.

## Test

- Date: 2026-10-13
- Target level: 2
- Reached level: 0
- Test profile (assumed): must never break: add a note, list notes, delete a note, notes survive a restart. Ships rarely, by one person. Cost of a failure: lost work. Time budget: 10 seconds.
- Ahead: every level 2 requirement is met. `npm test` runs 5 tests in under one second, with the same result twice. Three deliberate breaks (add, delete, save) each made a test fail.
- Critical behaviours tested: 4 of 4. Before the build: 0 of 4.
- Open gaps (2), both from level 1: no written checklist for the main flows by hand; no lint or type check.
- Bugs found, not fixed here: a malformed POST body crashes the server; `GET /../server.js` returns the source.

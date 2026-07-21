<a id="top"></a>

# AI Feature Specification — Code Quality

> Defines the final Module 14 code-quality audit for reuse, cleanliness, comments, dependencies, and professional folder organization. Use this document with `ai/ai-spec.md` and all implemented feature specifications.

> **Implementation owner:** Claude will run and implement this specification. Claude must audit before editing, preserve intentional and passing code, present genuine minimum-change options to the user, and wait for the user's selection before any structural refactor, dependency removal, file move/rename, or ambiguous deletion.

## Table of Contents

1. [Feature identity](#1-feature-identity)
2. [Feature goal](#2-feature-goal)
3. [Feature scope](#3-feature-scope)
4. [Requirements breakdown](#4-requirements-breakdown)
5. [Audit and cleanup flow](#5-audit-and-cleanup-flow)
6. [Interfaces and ownership](#6-interfaces-and-ownership)
7. [Evidence, validation, and state](#7-evidence-validation-and-state)
8. [Expected behavior](#8-expected-behavior)
9. [Technical constraints](#9-technical-constraints)
10. [Acceptance criteria](#10-acceptance-criteria)
11. [Feature Definition of Done](#11-feature-definition-of-done)
12. [Notes for AI tools](#12-notes-for-ai-tools)

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## 1. Feature identity

- **Feature name:** Code Quality
- **Related area:** Entire tracked repository, with emphasis on M14 client/backend additions and their shared boundaries
- **Specification file:** `ai/features/code-quality.feature.md`
- **Implementation branch:** `feature/m14-code-quality`
- **Grading requirements:** Code reusability, code cleanliness, meaningful comments, no unused/dead/commented-out code, and clean logical folder organization
- **Dependencies:** All functional and UI features are implemented before this final audit.
- **Claude deliverable:** An evidence-driven cleanup/refactor pass that improves or verifies quality without changing product behavior.
- **Completion evidence:** Inventory/caller analysis, decision records, focused checks, full diff review, regression results, and an honest list of manual/runtime gaps.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## 2. Feature goal

Demonstrate that the final Rocket Food Delivery repository is understandable, reusable, clean, and professionally organized.

This is not permission for a wholesale rewrite. Claude must distinguish genuine duplication/dead code from intentional role separation, defensive validation, compatibility support, development-only diagnostics, and framework-required files. When more than one safe minimum solution exists, Claude presents the options and waits for the user's choice.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## 3. Feature scope

### 3.1 In scope

- Inventory every tracked first-party source, specification, test, asset, configuration, and root deliverable.
- Confirm route files live under `client/app/` and reusable code lives in the appropriate existing folder.
- Audit repeated presentation, state, request, validation, storage, formatting, and theme logic for unnecessary duplication.
- Confirm API calls remain in services rather than screens/components.
- Confirm authentication storage/context, theme, icons, currency, validation, and result-state ownership remain centralized.
- Audit imports, exports, callers, routes, package usage, tests, and documentation references before declaring anything unused.
- Remove proven unused imports, variables, functions, unreachable branches, stale TODOs, debug-only experiments, and commented-out implementations.
- Preserve meaningful development-only diagnostics when they protect contract validation and contain no sensitive data.
- Audit comments/JSDoc/file headers for accuracy, usefulness, and synchronization with current code.
- Remove stale or misleading comments; do not remove explanations of non-obvious invariants, races, role boundaries, data mapping, compatibility, or recovery.
- Audit client dependencies for actual use, platform need, grading requirement, and lockfile consistency.
- Audit generated/local artifacts and ensure ignore rules prevent them from entering commits.
- Audit backend changes introduced for M14 for minimum scope, focused tests, compatibility, and documentation.
- Verify test names/fixtures/assertions match current API contracts.
- Verify canonical specification paths and eliminate stale duplicate contracts only when removal is proven safe and authorized.
- At project completion, after this feature is implemented and no feature remains, remove the inactive `ai/features/feature-name.feature.md` template as required by `ai/ai-spec.md`.
- Preserve the private `.omi/` implementation log as ignored/private; never stage it.
- Update `ai/ai-spec.md`, owning feature specs, README, Postman, and implementation log only when cleanup changes their factual truth.

Primary audit surfaces:

- `client/app/`
- `client/components/`
- `client/services/`
- `client/storage/`
- `client/contexts/`
- `client/constants/`
- `client/utils/`
- `server/src/main/java/`
- `server/src/test/java/`
- `ai/` and `ai/features/`
- `README.md`, `PostmanCollection.json`, `.gitignore`, package/lock/build files, and tracked deliverable folders

This is an audit boundary, not blanket edit permission. Every modification must map to a failed criterion and verified ownership/caller evidence.

### 3.2 Out of scope

- New product behavior, routes, APIs, fields, settings, visual redesign, or extra-mile features.
- Business-rule changes disguised as cleanup.
- Broad renaming, formatting, comment removal, or folder reshuffling for personal preference.
- Replacing established architecture/frameworks/languages.
- Changing backend schema, authentication, seed behavior, providers, or API contracts without a separate verified requirement and user-selected option.
- Removing a dependency merely because a search finds no import when grading, Expo configuration, peer dependencies, or tooling may require it.
- Extracting abstractions that make simple code harder to understand or couple behaviors that differ meaningfully.
- Combining Customer/Courier route files that must remain distinct navigation destinations.
- Deleting framework-reserved route/layout files, test fixtures, assets, or compatibility endpoints without caller/runtime evidence.
- Treating ignored build output, dependencies, caches, local environment files, or `.DS_Store` as tracked product-code defects.
- Editing `.omi/` planning sources except appending the required private implementation record.
- Staging, committing, merging, pushing, or mutating external systems without explicit authorization.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## 4. Requirements breakdown

### 4.1 Requirement A — Evidence-first inventory

- Begin with `git status --short`, `git ls-files`, `rg --files`, package manifests, and targeted symbol/import/caller searches.
- Separate tracked first-party files from ignored dependencies, build output, caches, environment files, and private working material.
- Record unrelated pre-existing changes and preserve them.
- Identify route/framework files whose usage is convention-based rather than import-based.
- Identify generated files that must remain tracked, such as lockfiles, versus generated output that must remain ignored.
- Do not classify a file as unused from filename or import search alone.

### 4.2 Requirement B — Reusable components

- Confirm truly shared presentation uses shared components where behavior and data contracts match.
- Preserve shared Account implementation behind separate Customer/Courier route wrappers.
- Preserve shared authenticated header, result states, icons, theme, currency, validation, API client, and session boundaries.
- Audit delivery/order rows and details for genuinely duplicated layout/formatting while recognizing their different field/status contracts.
- Audit repeated buttons, modals, request-state UI, and form feedback for practical reuse opportunities.
- Prefer a small shared primitive/helper only when it removes meaningful duplication without creating a configuration-heavy abstraction.
- Do not extract one-off markup solely to increase component count.

### 4.3 Requirement C — Service and state reuse

- Screens/components must not call `fetch` directly when an owning service exists.
- Shared transport behavior remains in `apiClient.js`.
- Domain validation/mapping stays in domain services or reusable pure helpers, not duplicated across screens.
- Authentication/session identity is read from centralized storage/context and never duplicated in route parameters/local keys.
- Abort, generation, and duplicate-action guards remain with the state owner that needs them.
- Do not merge distinct state machines merely because they use similar words such as loading/error/success.

### 4.4 Requirement D — Clean source code

- Remove imports/variables/functions/exports proven unused by static and framework-aware inspection.
- Remove unreachable branches and superseded compatibility code only after confirming no current caller/runtime needs them.
- Remove commented-out implementations, abandoned debug helpers, temporary logs, and stale TODO/FIXME/HACK notes.
- Keep intentional `__DEV__` warnings only when they diagnose a real invariant safely and are documented/concise.
- Never log tokens, credentials, passwords, private contact data, full responses, or stack traces to users.
- Preserve error handling, defensive validation, and recovery paths that look redundant but protect different failure states.
- Avoid cosmetic churn unrelated to a quality failure.

### 4.5 Requirement E — Meaningful comments and documentation

- Comments explain why, ownership, invariants, race protection, non-obvious data mapping, compatibility, and recovery.
- Comments do not narrate imports, obvious assignments, straightforward JSX, or every line.
- File purpose/contents headers remain accurate where established.
- JSDoc names, arguments, return shapes, errors, and callers match implementation.
- Remove stale implementation-plan language from completed source comments.
- Specifications distinguish current verified behavior from pending manual checks.
- README/API/Postman descriptions remain synchronized with current contracts.

### 4.6 Requirement F — Logical folder organization

- Expo routes/layouts remain in `client/app/` using framework naming.
- Reusable visual behavior remains in `client/components/`.
- Domain requests/normalization remain in `client/services/`.
- Authentication persistence/context remain in `client/storage/` and `client/contexts/`.
- Shared constants/assets/helpers remain in their established dedicated folders.
- Java controllers, DTOs, services, repositories, models, exceptions, security, and tests retain conventional package ownership.
- Canonical AI specs remain under `ai/` and `ai/features/`; do not recreate superseded module duplicates.
- Documentation/reference material remains in its current documented destination and is not imported as runtime code.
- A move/rename must update every import, route convention, documentation link, test, and Postman/reference location.

### 4.7 Requirement G — Dependency and configuration hygiene

- Map each direct client dependency to runtime/tooling/grading usage before proposing removal.
- Confirm `package-lock.json` matches `package.json` after any user-selected dependency change.
- Do not run a broad upgrade or change Expo/React Native versions in this feature.
- Do not add lint/format/test dependencies merely to perform the audit; present options first if tooling is genuinely necessary.
- Verify `.gitignore` covers secrets, `.env`, dependencies, Expo output, native prebuilds, Java target output, IDE/OS files, and private `.omi/` material.
- Confirm no ignored secret/generated file is staged or tracked unexpectedly.

### 4.8 Requirement H — Backend and test quality

- Audit only M14-touched backend areas plus any directly shared contract owner needed for regression evidence.
- Confirm account/notification/courier minimum changes stayed additive or deliberately compatible as documented.
- Confirm focused tests express current camelCase notification, Account POST, rating-preservation, and existing compatibility behavior.
- Do not clean unrelated legacy backoffice/backend code solely because a repository-wide search finds old style or diagnostics.
- If Claude believes a backend cleanup is necessary, present evidence/options and wait for user selection before editing.
- Distinguish infrastructure/database test failures from assertion failures and report exact counts honestly.

### 4.9 Requirement I — Safe deletion

Before deleting any tracked file, Claude must prove:

- It has no import/caller/framework/runtime/grading/documentation role.
- It is not required by Expo Router, Spring, Maven, npm, Postman, tests, submission, or a retained feature contract.
- No unrelated user work would be lost.
- The deletion is recoverable from Git and narrowly targeted.

When multiple reasonable choices exist—retain with documentation, refactor callers, deprecate, or delete—Claude presents options and waits for the user.

The inactive `ai/features/feature-name.feature.md` is a special explicit global-spec case: delete it only at the final successful completion of this last feature, then update `ai/ai-spec.md` so it no longer claims the file exists.

### 4.10 Requirement J — Minimum-change option gate

Claude must present options before any decision involving:

- Shared extraction versus justified duplication.
- File/folder move, rename, consolidation, or deletion not explicitly mandated.
- Dependency/tool addition, removal, or replacement.
- Public function/export/request/test contract changes.
- Backend cleanup or compatibility removal.
- Large comment/header rewrite or formatting sweep.
- Any cleanup whose regression surface is materially larger than its benefit.

For each option, state exact files/symbols, duplication/problem evidence, benefits, risks, compatibility/framework impact, diff size, and verification cost. Claude must stop and let the user choose; it must not choose independently.

### 4.11 Requirement K — Regression and final evidence

- Run focused checks for every changed owner.
- Run available client dependency/config/export checks.
- Run focused backend tests and full Maven tests when backend code changes and infrastructure permits.
- Parse/inspect Postman JSON and verify documentation links/paths.
- Re-run functional/native flows affected by any shared refactor.
- Inspect the complete final diff for accidental behavior, secrets, generated output, and unrelated churn.
- Append the implementation log with audit findings, options, user choices, changes, verification, and manual gaps.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## 5. Audit and cleanup flow

### 5.1 Establish the baseline

1. Confirm branch/status and preserve unrelated changes.
2. Inventory tracked/ignored files and current feature owners.
3. Run baseline static/build/test commands that do not mutate product behavior.
4. Record existing failures separately from new findings.

### 5.2 Build the findings register

For each potential issue record:

```text
ID | evidence | owner | callers | quality rule | risk | options needed | status
```

Classify as verified defect, justified design, ignored/generated artifact, manual uncertainty, or decision required.

### 5.3 Present decision options

1. Group related findings by smallest shared owner.
2. Present viable minimum-change options with exact tradeoffs.
3. Stop decision-dependent work.
4. Record the user's selection in this spec/private log before implementation.

### 5.4 Apply selected cleanup

1. Make the smallest coherent change for the selected option.
2. Update imports/callers/tests/docs in the same change.
3. Read the complete diff and confirm no behavioral drift.
4. Run focused verification before proceeding.

### 5.5 Finalize the last feature

1. Re-run the full quality audit and applicable regression checks.
2. Confirm all seven originally required M14 feature areas are represented in the canonical combined spec set.
3. Delete the inactive feature template only after the feature is genuinely complete.
4. Reconcile `ai/ai-spec.md` and any path/tree/documentation references.
5. Produce the final handoff without staging or committing.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## 6. Interfaces and ownership

### 6.1 Client architecture

| Location | Ownership |
| --- | --- |
| `client/app/` | Expo Router routes/layouts and screen-level orchestration |
| `client/components/` | Reusable native presentation and bounded UI behavior |
| `client/services/` | API paths, bodies, envelopes, normalization, domain request errors |
| `client/storage/` | Persisted authentication/session boundary |
| `client/contexts/` | Shared in-memory session transitions/actions |
| `client/constants/` | Theme, currency, assets, and stable labels/maps |
| `client/utils/` | Reusable pure helpers without service/UI ownership |

### 6.2 Backend architecture

| Location | Ownership |
| --- | --- |
| `controller/api/` | REST routing, request validation, response status/envelopes |
| `dtos/` | External request/response shapes |
| `service/` | Domain operations and DTO mapping |
| `repository/` | Persistence queries/mutations |
| `models/` | JPA entities and persistence constraints |
| `exception/` | Safe REST error mapping |
| `src/test/java/` | Focused contract/regression evidence |

### 6.3 Specifications and deliverables

- `ai/ai-spec.md` is the canonical global product contract.
- `ai/features/` contains canonical feature contracts; code quality becomes the final active feature.
- README documents setup, structure, API, decisions, and verification truth.
- `PostmanCollection.json` documents runnable nonsecret API requests.
- `.omi/m14/IMPLEMENTATION_LOG.md` remains private and ignored.
- `docVault/` and other documentation locations retain the organization established by the UI branch unless a user-selected option changes it.

### 6.4 Framework-owned usage

Claude must recognize non-import usage, including:

- Expo Router route/layout filenames.
- Spring annotations/component scanning/JPA repositories.
- Maven/Expo/npm configuration and lockfiles.
- Assets referenced through constants or application configuration.
- Postman variables and saved request examples.
- Grading-required files/screenshots/specifications.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## 7. Evidence, validation, and state

### 7.1 Finding evidence

A cleanup finding is actionable only when it includes:

- Exact file/symbol/location.
- Search/import/caller/framework evidence.
- Why current code violates a grading/global rule.
- Regression surface.
- Whether one safe solution exists or user options are required.

### 7.2 Decision states

- `candidate`: search result only; not actionable.
- `verified`: evidence proves a quality issue.
- `optionsPresented`: multiple viable changes documented.
- `userSelected`: exact choice recorded.
- `implemented`: smallest selected change complete.
- `verifiedAfterChange`: focused/regression evidence complete.
- `retainedJustification`: apparent duplication/diagnostic/file is intentional and documented.

Claude cannot advance from `optionsPresented` to `implemented` without the user's selection.

### 7.3 Reuse test

Extract shared code only when:

- At least two callers have substantially identical behavior/data/state contracts.
- The shared name and API are simpler than the duplication.
- Differences can be expressed without a sprawling flag/configuration object.
- Ownership and tests become clearer.
- Regression checks cover every caller.

Otherwise retain the duplication and record why it is meaningful.

### 7.4 Unused/dead-code test

Removal requires all applicable evidence:

- No static import/reference/caller.
- No framework naming/annotation/config/runtime discovery.
- No test, documentation, Postman, grading, asset, or compatibility role.
- No reflection/dynamic key/string lookup.
- Successful focused checks after removal.

### 7.5 Comment test

Keep a comment when deleting it would obscure a non-obvious reason or invariant. Rewrite/remove it when it is false, redundant with names, narrates syntax, references a completed temporary plan, or exposes internal/sensitive details.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## 8. Expected behavior

- Shared behavior has one clear owner without forcing unrelated features into one abstraction.
- Route wrappers remain thin and role-specific while shared Account behavior remains centralized.
- Screens orchestrate state and services own network contracts.
- No proven unused/dead/commented-out/debug code remains in the final tracked first-party scope.
- Meaningful diagnostics/comments remain concise, accurate, and safe.
- Folder/package organization matches framework/domain responsibility.
- Dependencies/configuration are justified and synchronized.
- Generated/local/private artifacts are ignored and unstaged.
- Functional behavior, API compatibility, UI, accessibility, persistence, and M13/M14 regressions remain unchanged.
- Claude presents genuine options and never chooses structural tradeoffs for the user.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## 9. Technical constraints

- Read `ai/ai-spec.md`, this complete feature spec, all owning feature specs, and current source/tests before edits.
- Use `rg`/`rg --files`, Git tracked/ignored views, package metadata, and framework-aware inspection.
- Do not rely on a missing import alone to delete route/annotated/configured files.
- Use existing tools; do not add lint/format/dependency-analysis packages without presenting options and receiving user selection.
- Avoid repository-wide automatic formatting.
- Preserve working tree/user changes and keep edits narrowly scoped.
- Use `apply_patch` for manual file edits and safe, non-destructive cleanup.
- No backend/API/schema behavior change is expected; any proposed exception requires user-selected options and updated governing documentation first.
- Do not stage, commit, merge, push, or modify external systems.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## 10. Acceptance criteria

### 10.1 Inventory and evidence

- [ ] Tracked first-party and ignored/generated/private scopes are distinguished.
- [ ] Every cleanup edit has exact owner/caller/framework evidence.
- [ ] Existing baseline failures are recorded separately from introduced regressions.
- [ ] No file is classified unused solely from a simple import search.

### 10.2 Reusability

- [ ] Shared header, Account, API client, session, result, theme, currency, validation, and icon behavior remain centralized.
- [ ] Screens/components contain no duplicated API request construction.
- [ ] Meaningful repeated logic/presentation is shared or has a recorded retained-duplication justification.
- [ ] Customer/Courier route separation is not mistaken for unnecessary duplication.
- [ ] New abstractions are smaller/clearer than the code they replace.

### 10.3 Cleanliness

- [ ] No proven unused import, variable, function, export, file, or unreachable branch remains.
- [ ] No commented-out implementation, temporary debug helper, stale TODO/FIXME/HACK, or accidental log remains.
- [ ] Retained development diagnostics are intentional, safe, and limited to development where appropriate.
- [ ] No sensitive value or raw private response is logged/exposed.
- [ ] No broad cosmetic churn obscures the functional history.

### 10.4 Comments and documentation

- [ ] Comments/JSDoc/file headers match current code and explain only useful non-obvious behavior.
- [ ] Stale plan language and misleading contract comments are removed/reconciled.
- [ ] Global/feature specs, README, and Postman match final code paths/contracts.
- [ ] Automated evidence and pending manual/native evidence remain clearly separated.

### 10.5 Folder and dependency organization

- [ ] Routes, components, services, storage/context, constants/utils, Java packages, tests, specs, and docs have clear ownership.
- [ ] No stale canonical-spec duplicate or broken path reference remains.
- [ ] Every direct dependency is used or has a documented grading/tooling/platform reason.
- [ ] Package manifest and lockfile agree.
- [ ] `.gitignore` covers secrets, builds, dependencies, caches, IDE/OS, Expo/native, and private material.

### 10.6 Options and user decisions

- [ ] Claude presents viable minimum-change options for every ambiguous structural/dependency/deletion/backend decision.
- [ ] Options include exact files, evidence, benefits, risks, compatibility, diff size, and verification cost.
- [ ] User selections are recorded before implementation.
- [ ] No unselected option is implemented.

### 10.7 Tests and regression

- [ ] Focused checks pass for every changed shared owner and caller.
- [ ] `git diff --check` passes.
- [ ] `npm ls --depth=0` reports no invalid dependency.
- [ ] `npx expo config --type public` succeeds without secrets.
- [ ] `npx expo export --platform android` succeeds and generated output is removed.
- [ ] Focused/full Maven tests run when applicable, with infrastructure versus assertion results reported accurately.
- [ ] Postman JSON parses and no secret/live value is committed.
- [ ] Affected Customer/Courier/M13/M14 manual regressions are recorded honestly.

### 10.8 Final repository state

- [ ] Complete diff contains only selected, evidence-backed quality changes.
- [ ] No tracked secret, local environment file, build output, cache, IDE/OS artifact, private log, or temporary evidence exists.
- [ ] No unrelated user work is modified or deleted.
- [ ] Inactive feature template is removed only after this final feature is genuinely complete, and the global spec is reconciled.
- [ ] Git status and final handoff identify every remaining manual/process gap.

Claude must leave criteria unchecked until current evidence supports them. Search results, compilation, or export alone do not prove runtime use, absence of reflection/framework discovery, or complete regression safety.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## 11. Feature Definition of Done

- [ ] Every graded Code Quality requirement has current evidence.
- [ ] Audit distinguishes verified defects, justified design, ignored artifacts, and pending decisions.
- [ ] Claude presented minimum-change options and implemented only user-selected choices.
- [ ] Reuse improves clarity without over-abstraction or role/feature coupling.
- [ ] No proven dead/unused/commented-out/debug code remains in agreed scope.
- [ ] Comments/documentation are accurate, meaningful, and synchronized.
- [ ] Folder/package/dependency organization is logical and framework-safe.
- [ ] All selected cleanup passes focused/static/build/test/regression checks available in the environment.
- [ ] No business/API/UI behavior drift, secret, generated artifact, private file, or unrelated change exists.
- [ ] Final canonical specs are complete and the inactive template is removed/reconciled only at true completion.
- [ ] Private implementation log records findings, options, user selections, changed files, verification, retained justifications, and manual gaps.
- [ ] Claude's handoff includes outcome, selected options, exact files, checks/results, manual gaps, scoped stage command, and copy-ready commit command.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## 12. Notes for AI tools

- Claude is the implementation and verification agent for this specification.
- Audit first; do not manufacture cleanup changes when current code already satisfies a criterion.
- Treat route/layout, Spring-annotated, config, lock, asset, test, Postman, and grading files as potentially runtime-used without imports.
- Present structural, dependency, deletion, or backend options and stop for the user's selection.
- Do not decide what to extract, move, remove, or retain when multiple reasonable minimum choices exist.
- Preserve intentional validation, race guards, role isolation, compatibility, and safe development diagnostics.
- Do not broaden the task into legacy backend/backoffice cleanup.
- Do not claim runtime/native/database/test success unless observed; report infrastructure blockers exactly.
- Delete the inactive template only after the final feature actually passes, then reconcile the global spec.
- Append the final dated handoff to `.omi/m14/IMPLEMENTATION_LOG.md`; never stage it.
- Do not stage, commit, merge, or push.
- Finish with outcome, user-selected options, exact files, checks/results, retained justifications, manual gaps, scoped `git add`, and a copy-ready Conventional Commit command.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## 13. Refactoring Implementation Record

This is the append-only completion record for work selected from `docVault/REFACTORING_AUDIT.md`. Add an entry only after the user-selected audit item is implemented and its available verification is complete. A proposal, user selection, partial edit, or unverified change is not completed work. Entries remain chronological; if completed work is revised or reverted, append a dated correction rather than rewriting history.

#### RF-19 — Remove stale `@JsonAlias` claims

- **Completed:** 2026-07-21 14:13 America/New_York
- **Priority:** P0
- **Reason and benefit:** Source/test comments claimed the backend accepted notification keys via `@JsonAlias`, but the DTO now uses canonical camelCase (`sendEmail` default-mapped, `sendSms` via `@JsonProperty("sendSMS")`). The stale claim contradicted the graded HTTP contract.
- **Files affected:** `client/services/orderService.js`, `server/src/test/java/com/rocketFoodDelivery/rocketFood/order/OrderApiControllerTest.java`
- **Change:** Rewrote both comments to describe the canonical camelCase mapping; no code/behavior change. Snake_case is intentionally not accepted (verified by the existing DTO deserialization test).
- **Verification:** `rg JsonAlias client server` → no matches; `mvnw test` for `OrderApiControllerTest,ApiCreateOrderDTODeserializationTest` (local MySQL) → 15 passed, 0 failures.

#### RF-03 — Reuse the shared email validator in Login

- **Completed:** 2026-07-21 14:13 America/New_York
- **Priority:** P1
- **Reason and benefit:** Login defined a local `EMAIL_PATTERN` duplicating the `isValidEmail` rule already owned by `utils/validation.js` (used by Account). Sharing it prevents Login and Account email validation from drifting.
- **Files affected:** `client/app/index.js`
- **Change:** Imported `isValidEmail`, replaced `EMAIL_PATTERN.test(email)` with `!isValidEmail(email)`, and deleted the local regex. Behavior identical (empty → required message first, non-empty invalid → shape message).
- **Verification:** `npx expo export --platform android` EXIT 0; `git diff --check` clean. Native email-field manual check pending.

#### RF-04 — Route guards consume the `ROLES` constants

- **Completed:** 2026-07-21 14:13 America/New_York
- **Priority:** P1
- **Reason and benefit:** Root and role tab guards repeated raw `'customer'`/`'courier'` string literals despite `authStorage.js` exporting the canonical `ROLES`. Using the constants removes typo-prone literals at the security-sensitive navigation boundary.
- **Files affected:** `client/app/_layout.js`, `client/app/customer/_layout.js`, `client/app/courier/_layout.js`
- **Change:** Imported `ROLES` and replaced the raw role literals in the active-role guards with `ROLES.customer` / `ROLES.courier`. No route/guard behavior change.
- **Verification:** `rg` confirms no raw role literals remain in guards; `npx expo export --platform android` EXIT 0. Native four-way navigation (logged-out, customer-only, courier-only, dual-pending) manual check pending.

#### RF-07 — Clear the confirmation modal's settled abort controller

- **Completed:** 2026-07-21 14:13 America/New_York
- **Priority:** P2
- **Reason and benefit:** `OrderConfirmationModal` stored the active `AbortController` but never cleared it in `finally`, so closing a settled modal aborted a stale controller — unlike the Login/Account request owners.
- **Files affected:** `client/components/OrderConfirmationModal.js`
- **Change:** In `finally`, clear `abortControllerRef.current` only when it still equals the local controller. Visible idle/processing/success/failure behavior unchanged.
- **Verification:** `npx expo export --platform android` EXIT 0. Native confirm/failure/close-during-processing/close-after-settle manual checks pending.

#### RF-08 — Emit the font-load warning from an effect

- **Completed:** 2026-07-21 14:13 America/New_York
- **Priority:** P2
- **Reason and benefit:** The dev-only font-failure warning ran during render, so unrelated re-renders could repeat it and logging became a render side effect.
- **Files affected:** `client/app/_layout.js`
- **Change:** Moved the `__DEV__` `console.warn` into a `useEffect` keyed by `fontError`. Font-fallback and loading behavior unchanged.
- **Verification:** `npx expo export --platform android` EXIT 0.

#### RF-20 — Correct obsolete role-scope comments

- **Completed:** 2026-07-21 14:13 America/New_York
- **Priority:** P1
- **Reason and benefit:** The mandatory `_layout.js` header described only login/customer routes and `AppHeader.js` comments said only Customer tabs install it and logout returns "the customer" to Login. The app now supports Customer and Courier.
- **Files affected:** `client/app/_layout.js`, `client/components/AppHeader.js`
- **Change:** Updated the file header and JSDoc to reference login/account-selection/role routes and the Customer *and* Courier layouts; logout "returns the user to Login." Comments only.
- **Verification:** Manual header review; `npx expo export --platform android` EXIT 0.

#### RF-22 — Aggregate the malformed-order development warning

- **Completed:** 2026-07-21 14:13 America/New_York
- **Priority:** P2
- **Reason and benefit:** `normalizeCustomerOrders` could emit one identical warning for every malformed/duplicate row on every refresh.
- **Files affected:** `client/services/orderService.js`
- **Change:** Count skipped rows and emit at most one `__DEV__` warning after normalization, containing only a count — never IDs, customer data, or tokens. Valid rows still render; malformed/duplicate rows still skipped.
- **Verification:** `npx expo export --platform android` EXIT 0. A mixed valid/invalid/duplicate response unit test remains a pending gap.

#### RF-36 — Tidy the order controller test

- **Completed:** 2026-07-21 14:13 America/New_York
- **Priority:** P1
- **Reason and benefit:** The test constructed two throwaway `ObjectMapper`s despite an injected one and duplicated the `createFreshOrder` fixture in the delete test.
- **Files affected:** `server/src/test/java/com/rocketFoodDelivery/rocketFood/order/OrderApiControllerTest.java`
- **Change:** Use the injected `objectMapper` in both create tests; reuse `createFreshOrder` in `testDeleteOrder_Success`. Assertions and endpoint coverage unchanged.
- **Verification:** `mvnw test` for `OrderApiControllerTest,ApiCreateOrderDTODeserializationTest` (local MySQL) → 15 passed, 0 failures.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

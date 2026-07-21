<a id="top"></a>

# AI Feature Specification — UI

> Defines the Module 14 visual-system and cross-platform usability audit: Arial/Oswald typography, Rocket Food palette, supplied wireframes, scrolling, safe areas, keyboard behavior, accessibility, and exact role tab labels. Use this document with `ai/ai-spec.md` and every completed feature specification.

> **Implementation owner:** Claude will run and implement this specification. Claude must audit the completed application before editing, preserve passing behavior, and present any minimum-change options to the user before choosing a font, asset, layout, navigation, dependency, or platform-compromise solution.

## Table of Contents

1. [Feature identity](#1-feature-identity)
2. [Feature goal](#2-feature-goal)
3. [Feature scope](#3-feature-scope)
4. [Requirements breakdown](#4-requirements-breakdown)
5. [User flow and visual audit logic](#5-user-flow-and-visual-audit-logic)
6. [Interfaces](#6-interfaces)
7. [Data, validation, and state](#7-data-validation-and-state)
8. [Expected behavior](#8-expected-behavior)
9. [Technical constraints](#9-technical-constraints)
10. [Acceptance criteria](#10-acceptance-criteria)
11. [Feature Definition of Done](#11-feature-definition-of-done)
12. [Notes for AI tools](#12-notes-for-ai-tools)

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## 1. Feature identity

- **Feature name:** Module 14 UI System and Cross-Platform Audit
- **Related area:** All mobile routes, shared components, theme, typography, modals, tabs, safe areas, scrolling, keyboard, and accessibility
- **Specification file:** `ai/features/ui.feature.md`
- **Implementation branch:** `feature/m14-ui`
- **Grading requirements:** Arial and Oswald fonts, scrolling for overflowing pages, exact Customer tabs, and exact Courier tabs
- **Visual references:** `client/docs/m14/Wireframe.pdf` plus retained M13 visual contracts
- **Dependencies:** Navigation, Role-Based Navigation, Courier Delivery, Account Details, and Order Confirmation must already be functionally implemented before final UI verification.
- **Claude deliverable:** A minimal evidence-driven visual/accessibility correction pass across the completed application, not a redesign.
- **Completion evidence:** Screen-by-screen audit matrix, wireframe comparison, representative iOS/Android checks, text/keyboard/overflow checks, exact tabs/fonts/palette evidence, and final diff.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## 2. Feature goal

Make the completed Customer and Courier application visually consistent, usable, accessible, and faithful to the supplied Module 14 wireframes without changing its business behavior.

Claude must first identify what already passes. It may correct demonstrated gaps only. When a requirement has multiple plausible minimum solutions—especially Android Arial availability, wireframe/checklist wording, asset choice, scrolling ownership, or layout behavior—Claude must present the options and tradeoffs, then wait for the user's choice.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## 3. Feature scope

### 3.1 In scope

- Audit every route and modal against the centralized Rocket Food palette and typography rules.
- Verify Oswald display typography loads through the installed font package.
- Verify general UI uses Arial where available and one documented platform-safe fallback where it is not.
- Resolve font-availability decisions only after the user selects from Claude's options.
- Compare every supplied M14 surface with `client/docs/m14/Wireframe.pdf`.
- Preserve checklist terminology where a wireframe label differs.
- Verify the authenticated logo/logout header across Customer and Courier destinations.
- Verify no role-app header/footer appears on Login or Account Selection.
- Verify exact Customer tabs: Restaurants, Order History, Account.
- Verify exact Courier tabs: Order Delivery, Account.
- Verify tab order, icons, active/inactive states, labels, touch targets, bottom safe area, and keyboard behavior.
- Make overflowing screens, lists, forms, summaries, and modals scrollable under realistic constraints.
- Verify the last control/row is not obscured by the footer, keyboard, safe area, or modal bounds.
- Verify small phones, representative large phones/tablets where available, portrait, landscape where supported, and increased text size.
- Audit touch targets, accessibility roles/labels/states, focus order, contrast, disabled/loading states, and error/success announcements.
- Reuse shared header, result states, Account form, delivery/order details, theme, icons, currency, validation, and service boundaries.
- Remove only visual inconsistencies directly tied to failed criteria; broad cleanup belongs to `code-quality.feature.md`.
- Preserve all completed behavior and route/data ownership.
- Update specifications and private implementation log only from verified final behavior.

Likely audited files include:

- `client/constants/theme.js`
- `client/app/_layout.js`
- `client/app/index.js`
- `client/app/selection.js`
- `client/app/customer/_layout.js`
- `client/app/courier/_layout.js`
- Customer Restaurant List/Menu, Order History, Account, and Courier Order Delivery routes
- `client/components/AppHeader.js`
- `client/components/AccountScreen.js`
- `client/components/OrderConfirmationModal.js`
- `client/components/OrderHistoryModal.js`
- `client/components/DeliveryDetailsModal.js`
- Existing rows/cards/filters/result states/icons used by those surfaces
- This feature spec and `ai/ai-spec.md` when verified reality changes

This list is an audit surface, not permission for a broad rewrite. Claude must map each edit to a failed acceptance criterion.

### 3.2 Out of scope

- New product features, routes, API calls, status logic, account logic, notification behavior, or storage behavior.
- Backend/controller/DTO/service/database changes; UI requirements should not require server work.
- Replacing the established Rocket Food brand, palette, logo, icons, or wireframe structure with a new design system.
- Adding animations, dark mode, maps, ratings, provider integrations, or extra-mile work.
- Rebuilding working navigation, forms, lists, modals, or services solely for stylistic preference.
- Hiding required text labels in favor of icon-only navigation.
- Using emoji as production icons.
- Loading supplied PDFs directly at runtime or modifying source support materials.
- Adding a font/UI/component dependency before presenting options and receiving user approval.
- Bundling an unlicensed Arial asset or claiming Android uses Arial when it uses a fallback.
- Choosing between conflicting authoritative/visual/platform requirements without the user's selection.
- General dead-code/folder/comment cleanup not required by a UI fix; see `code-quality.feature.md`.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## 4. Requirements breakdown

### 4.1 Requirement A — Centralized Rocket Food palette

- Use the exact shared values:
  - Orange Red `#DA583B`
  - Dark Charcoal `#222126`
  - Dark Red `#851919`
  - Muted Green `#609475`
  - Warm Yellow `#F0CB67`
  - White `#FFFFFF`
- Consume these through `client/constants/theme.js` rather than repeating literals.
- Keep semantic delivery colors centralized: pending red, in progress orange, delivered green.
- Use colors consistently for headers, primary actions, errors, success, active tabs, and status controls.
- Do not rely on color alone to communicate selection, status, loading, error, or disabled state.
- Any additional neutral/overlay color must have a demonstrated need and a centralized/documented owner when reused.

### 4.2 Requirement B — Arial and Oswald typography

- Use Oswald for wireframe display text such as titles, tab labels, and primary action labels where established.
- Use Arial/general body typography through the centralized `FONT_FAMILIES.body` token.
- Verify loaded Oswald weights exist and do not silently map to unsupported names.
- Verify the current iOS Arial setting renders as intended.
- Android does not guarantee Arial. Claude must investigate actual Expo/React Native support, present viable minimum-change options and tradeoffs, and wait for the user's selection before altering the fallback or adding an asset/dependency.
- Do not claim a fallback font is Arial.
- Ensure text remains readable under increased system font size and does not clip critical labels/actions.

### 4.3 Requirement C — Exact Customer tabs

- Customer footer contains exactly these visible tabs in this order:
  1. Restaurants
  2. Order History
  3. Account
- No internal layout or dynamic Restaurant route appears as a tab.
- Text labels remain visible and exact.
- Active state uses an accessible visual indicator and selected accessibility state.
- Header/footer remain mounted through Customer destinations and nested Restaurant navigation.
- Footer must not cover page content.

### 4.4 Requirement D — Exact Courier tabs

- Courier footer contains exactly these visible tabs in this order:
  1. Order Delivery
  2. Account
- Use checklist label `Order Delivery` even where the wireframe uses `Deliveries`.
- No Customer route or internal file appears as a Courier tab.
- Labels, icons, active state, accessibility, persistence, and safe-area rules match the Customer footer standard.
- Footer must not cover the last delivery row, Account control, or retry state.

### 4.5 Requirement E — Header and layout boundaries

- Customer and Courier protected destinations display the shared Rocket Food logo and Log Out header.
- Login and Account Selection display no role-specific authenticated header/footer.
- Header/logo/logout remain usable without overlap at narrow widths and large text sizes.
- Content is centered within a sensible maximum width on wide screens while using phone width efficiently.
- Root, tab, nested-stack, modal, and safe-area owners must not add duplicate padding/headers.
- Status bar appearance remains readable against the active background.

### 4.6 Requirement F — Scrollable overflow

- Every surface whose content can exceed available height uses an appropriate scroll/list owner.
- Data collections use `FlatList`/equivalent virtualization when already established.
- Forms and fixed-content pages use `ScrollView`/keyboard-aware layout where appropriate.
- Modals allow content scrolling while keeping Close and essential result/action controls reachable.
- Nested vertical scroll views must not create trapped or conflicting gestures.
- Empty/loading/error states remain centered/useful without preventing refresh/retry.
- Test short and long data, small viewport, large text, keyboard open, and landscape where supported.
- Do not add scrolling merely because a component exists; assign one clear owner per overflow region.

### 4.7 Requirement G — Keyboard and safe areas

- Account inputs remain visible while editing and Save stays reachable.
- Keyboard dismissal behavior is predictable and does not trigger accidental save/navigation.
- Bottom tab bar behavior matches the documented project decision when keyboard opens.
- Top/bottom safe areas protect header, tab bar, modal, close controls, and final content.
- iOS notches/home indicators and representative Android system bars must not obscure interactions.
- Avoid double safe-area padding from nested owners.

### 4.8 Requirement H — M14 wireframe surfaces

Claude must inspect the wireframe and compare at least:

- Account Selection.
- Order Confirmation with independent SMS/email choices.
- Courier Order Delivery list and status controls.
- Delivery Details modal.
- Customer Account Settings.
- Courier Account Settings.

For each surface, record structure, labels, hierarchy, spacing, colors, typography, controls, and scrolling differences. Functional/checklist requirements outrank purely visual wording. If two valid minimum approaches remain, present them and wait for the user's selection rather than choosing.

### 4.9 Requirement I — Retained M13 surfaces

- Login, Restaurant List, Restaurant Menu, Order History, Order Details, shared header/footer, and confirmation baseline retain their completed contracts.
- M14 styling may correct centralized inconsistencies but must not change their business behavior.
- Existing accepted images, logo, filters, product quantities, totals, currency, result copy, and order data remain accurate.
- Re-run retained visual/interaction smoke tests for any shared theme/component change.

### 4.10 Requirement J — Accessibility and interaction feedback

- Interactive controls have roles, useful labels, states, and minimum touch targets.
- Tabs expose selected state; checkboxes expose checked state; pending buttons expose disabled/busy state.
- Status controls include readable text, not color alone.
- Errors/successes are announced appropriately and remain visually readable.
- Disabled controls remain distinguishable without appearing active.
- Focus order and modal semantics are logical.
- Text/background combinations remain readable under representative display settings.
- Dynamic type must not hide logout, Close, Save, Confirm, View, status, or tab labels.

### 4.11 Requirement K — Minimum-change option gate

When Claude finds a UI gap with multiple plausible solutions, it must present the user with viable minimum-change options before editing that decision-dependent area.

For every option, state:

- Exact affected screens/components/theme/assets/dependencies.
- Visual and behavioral result.
- Benefits, risks, platform differences, accessibility impact, and regression surface.
- Wireframe/checklist alignment and verification burden.

Claude must stop after presenting options. The user chooses. No font asset, dependency, label compromise, navigation/layout restructuring, or conflicting-wireframe interpretation may be selected by Claude independently. Independent fixes with only one contract-preserving implementation may continue if they do not prejudice the pending choice.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## 5. User flow and visual audit logic

### 5.1 Audit before editing

1. Start from a clean status and inventory all route/shared UI owners.
2. Build a screen-state matrix covering roles, loading/data/empty/error, modals, keyboard, and text size.
3. Compare each M14 surface to the wireframe and global spec.
4. Mark each criterion pass, fail, or unverified with evidence.
5. Preserve passing code and group demonstrated gaps by smallest shared owner.

### 5.2 Resolve an ambiguous gap

1. Identify the exact conflicting source/platform behavior.
2. Gather current code and official platform evidence.
3. Present viable minimum-change options and tradeoffs.
4. Stop decision-dependent work.
5. After the user selects, record the decision in this spec before implementation.

### 5.3 Apply a shared correction

1. Change the smallest central owner that resolves all affected instances.
2. Avoid unrelated restyling.
3. Inspect the complete diff for behavior changes.
4. Re-run every screen/state consuming the shared owner.

### 5.4 Verify Customer UI

1. Login without authenticated chrome.
2. Customer tabs and header render exact destinations.
3. Restaurant list/menu, confirmation, history/details, and Account remain scrollable/reachable.
4. Logout removes authenticated chrome and back cannot restore it.

### 5.5 Verify Courier UI

1. Courier tabs and header render exact destinations.
2. Delivery list/status/details and Account remain scrollable/reachable.
3. Loading, empty, error, updating, partial-recovery, and delivered-lock states remain understandable.
4. Logout removes authenticated chrome and stale content.

### 5.6 Verify dual-role boundary

1. Account Selection renders without role-specific header/footer.
2. Customer choice exposes only Customer chrome/data.
3. Courier choice exposes only Courier chrome/data.
4. Restart/back behavior does not mix role layouts.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## 6. Interfaces

### 6.1 Theme and font boundary

- `client/constants/theme.js` owns palette, typography names/fallbacks, spacing, and shared layout/touch dimensions.
- `client/app/_layout.js` loads supported Oswald faces and owns startup font-loading behavior.
- Components consume theme tokens and do not load fonts independently.
- Any selected new font asset/dependency must have explicit user approval, licensing provenance, and setup documentation.

### 6.2 Navigation/layout boundary

- Root layout owns public/selection/role tree boundaries.
- Customer/Courier tab layouts own header/footer and exact tab registration.
- Restaurant nested stack owns Restaurant screens without duplicate chrome.
- Screens own only their content overflow.
- Modals own their overlay, modal semantics, internal overflow, and reachable Close/action areas.

### 6.3 Shared components

- `AppHeader` owns logo/logout presentation and pending/error feedback.
- `ResultState` owns reusable loading/empty/error presentation where appropriate.
- Shared Account screen owns both role forms.
- Delivery/order row and detail components own consistent table/detail presentation.
- `AppIcon` owns supported native icon mapping.
- Feature screens retain remote/business state; UI work must not move API logic into presentation components.

### 6.4 Backend/API

- No backend change is expected or authorized for this UI feature.
- UI verification may exercise existing APIs to populate states, but must not alter contracts.
- If Claude believes server work is necessary, it must present evidence and options to the user and stop; no server edit may occur without explicit selection and global minimum-change documentation.

### 6.5 Visual evidence

- Use the supplied wireframe as the M14 visual reference within checklist scope.
- Capture or record representative screen comparisons where the environment permits.
- Do not commit temporary screenshots unless they are an explicitly required deliverable.
- Record device/platform, viewport/orientation, text size, keyboard state, and data state for manual evidence.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## 7. Data, validation, and state

### 7.1 UI audit matrix

For each surface, track:

```text
surface | role | state | viewport | text size | keyboard | expected | observed | result
```

Required state coverage includes initial loading, data, empty, error/retry, mutation pending, success, modal open, and session expiry wherever applicable.

### 7.2 Theme invariants

- Shared colors come from centralized tokens.
- General text uses the selected documented body-font policy.
- Display text uses a loaded/safe Oswald token or documented fallback on load failure.
- Touch target minimum remains centralized.
- Status color and text always agree.

### 7.3 Layout invariants

- Exactly one vertical overflow owner handles each region.
- Header/footer do not obscure active content.
- Modal Close and critical actions remain reachable.
- Keyboard does not hide focused Account fields or Save.
- Large text does not remove required labels/actions.
- Role chrome appears only in its protected tree.

### 7.4 Interaction states

- Buttons distinguish idle, pressed, disabled, pending, success, and error where applicable.
- Checkboxes distinguish checked/unchecked/disabled visually and accessibly.
- Tabs distinguish selected/unselected visually and accessibly.
- Courier status distinguishes three stages and pending request wording.
- No stale response should repaint UI after logout/role change; functional feature specs remain authoritative.

### 7.5 Decision state

- `identified`: discrepancy recorded with evidence.
- `optionsPresented`: Claude has supplied viable minimum options/tradeoffs.
- `userSelected`: exact option recorded.
- `implemented`: selected option changed in smallest scope.
- `verified`: required platforms/states checked.

Claude may not move a decision-dependent discrepancy from `optionsPresented` to `implemented` without the user's selection.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## 8. Expected behavior

- Every screen uses the Rocket Food palette and documented Arial/Oswald policy consistently.
- Customer and Courier tabs have exact labels/order and remain accessible.
- Authenticated chrome appears only after a role application opens.
- Content remains reachable on small screens, large text, keyboard-open forms, long lists, and long modals.
- Supplied M14 surfaces match their wireframe structure without contradicting checklist/functionality.
- Shared components look consistent across roles/features.
- Loading, empty, error, pending, success, disabled, selected, and status states remain understandable.
- No business behavior, request contract, route guard, persistence rule, or M13 flow changes unintentionally.
- Claude never chooses among genuine minimum-change options on the user's behalf.
- Final wireframe reconciliation preserves business logic while aligning Account Selection role cards, Account hierarchy/copy, Courier Delivery table columns, Delivery Details title/field order, and notification-choice wording/grouping with the committed M14 wireframe.
- Android body typography uses the user-selected Arimo fallback while iOS/default uses Arial; Oswald remains the display family.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## 9. Technical constraints

- Claude must read the global spec, this full spec, all completed M14 specs, relevant M13 visual specs, any applicable committed repository instructions before edits.
- Consult exact Expo SDK 54/React Native/Expo Router accessibility, font, safe-area, list, modal, and keyboard documentation required by the active specification before code changes.
- Use installed React Native/Expo primitives and existing packages unless the user selects an option requiring otherwise.
- Preserve JavaScript, purpose headers, theme ownership, comments, and naming conventions.
- Make no backend change under the current UI scope; if Claude presents an exceptional server option and the user selects it, amend this spec and the global documentation before implementation.
- Do not use browser-only DOM/CSS/React Bootstrap components in native UI.
- Do not hard-code platform dimensions that fail representative device sizes.
- Do not disable text scaling globally to force a visual match.
- Do not use private `.omi/` files as runtime dependencies.
- Do not stage, commit, merge, push, or modify external systems without explicit authorization.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## 10. Acceptance criteria

### 10.1 Audit and decision gates

- [x] Every route/modal/state in scope appears in a completed audit matrix. (Code-level audit recorded in the implementation log; palette/fonts/tabs/chrome/DOM/emoji/text-scaling covered.)
- [x] Each edit maps to a demonstrated failed criterion. (Android typography and the later wireframe-structure corrections are recorded against Requirements B and H.)
- [x] Genuine minimum-change choices are presented with exact tradeoffs. (Three font options presented, plus an Option 2-vs-3 clarification.)
- [x] The user's selection is recorded before decision-dependent edits. (Option 3 — Arimo on Android only — recorded before editing.)
- [x] Passing business behavior is preserved; the implemented changes are typography and presentation-structure corrections using existing state, controls, routes, and request boundaries.

### 10.2 Palette and typography

- [x] Exact Rocket Food colors are centralized and consistently consumed. (`rg` for hex literals outside `theme.js` → none; all colors via `COLORS`/`DELIVERY_STATUS_COLORS`.)
- [x] Delivery status colors remain red/orange/green with text labels. (`DELIVERY_STATUS_COLORS` + `DeliveryRow`/modal render the status text, not color alone.)
- [x] Oswald required weights load and appear on intended display text. (`Oswald_400Regular`/`Oswald_600SemiBold` load in `_layout.js` and bundle in the export; display tokens reference them. On-device appearance native-pending.)
- [x] General text follows the user-selected documented Arial/platform-fallback policy. (Option 3: iOS/default `Arial`, Android `Arimo_400Regular` — bundled Arial-metric font.)
- [x] No screen falsely claims an unavailable fallback is Arial. (Android now renders Arimo, a real Arial-metric font, not a mislabeled system font; iOS uses genuine Arial.)
- [ ] Critical text remains readable/unclipped at increased text sizes. (**Native dynamic-type test pending**.)

### 10.3 Customer navigation UI

- [x] Customer tabs are exactly Restaurants, Order History, Account in that order. (`customer/_layout.js` declares exactly those three `Tabs.Screen`s.)
- [x] Labels/icons/selected states/touch targets are visible and accessible. (Exact `title`s, `tabBarAccessibilityLabel`s, active `warmYellow` indicator, and `LAYOUT.minimumTouchTarget`-sized items in code; on-device render native-pending.)
- [x] Shared logo/logout header and footer persist through Customer destinations. (`header: () => <AppHeader/>` on the Tabs navigator; nested Restaurant stack has `headerShown:false`.)
- [x] Nested Restaurant routes create no duplicate header/footer/tab. (Restaurant stack hides its own header; only `restaurant`/`order-history`/`account` are tabs.)
- [ ] Footer/header obscure no Customer content. (**Native layout verification pending**.)

### 10.4 Courier navigation UI

- [x] Courier tabs are exactly Order Delivery, Account in that order. (`courier/_layout.js` declares exactly `index` (Order Delivery) and `account`.)
- [x] Labels/icons/selected states/touch targets are visible and accessible. (Matches the Customer footer standard — same tab styles, a11y labels, indicator, touch targets; on-device render native-pending.)
- [x] Shared logo/logout header and footer persist through Courier destinations. (`header: () => <AppHeader/>` on the courier Tabs navigator.)
- [x] Customer/internal routes do not appear as Courier tabs. (Only `index` and `account` are declared under `courier/`.)
- [ ] Footer/header obscure no Courier content. (**Native layout verification pending**.)

### 10.5 Root and role boundary

- [x] Login shows no authenticated role header/footer. (`index.js`/`selection.js` are root Stack screens with `headerShown:false` and no `AppHeader`/tab bar.)
- [x] Account Selection shows no role-specific header/footer. (Same — `selection.js` renders only its own content.)
- [x] Customer and Courier chrome/data never mix. (Mutually exclusive root `Stack.Protected` guards + per-layout role redirects.)
- [ ] Logout/session expiry removes protected chrome and back cannot restore it. (Guards are code-correct; **native back test pending**.)
- [ ] Safe areas/status bar remain correct across root destinations. (`SafeAreaProvider` + per-screen safe areas in code; **native verification pending**.)

### 10.6 Wireframe surfaces

- [x] Account Selection implements the required Customer/Courier role-card structure and choices; native screenshot comparison remains pending.
- [x] Order Confirmation implements the supplied notification question and Email/Phone grouping while preserving summary, total, actions, and result states; native screenshot comparison remains pending.
- [x] Courier Order Delivery implements the Order ID/Address/Status/View table structure and semantic colors; native screenshot comparison remains pending.
- [ ] Delivery Details shows required fields with reachable Close and overflow. (Fields + scroll + Close in code; **native reachability pending**.)
- [x] Customer and Courier Account Settings share the reconciled hierarchy and copy through one `AccountScreen`; native screenshot comparison remains pending.
- [x] Checklist wording and tab labels remain authoritative, and the implemented wireframe reconciliation is documented.

### 10.7 Overflow, keyboard, and responsive layout

- [ ] Every overflowing page/list/form/modal scrolls through its final content. (`FlatList`/`ScrollView` owners in place per screen; **native scroll test pending**.)
- [ ] No nested-scroll trap or hidden final row/action remains. (**Native test pending**.)
- [ ] Account focused fields and Save remain keyboard-safe. (`KeyboardAvoidingView` + `ScrollView` in `AccountScreen`; **native keyboard test pending**.)
- [ ] Small phones and increased text retain required controls/labels. (**Native test pending**.)
- [ ] Representative landscape/wide layout remains usable where supported. (**Native test pending**.)
- [ ] iOS/Android safe areas protect header, footer, modal, and content. (Safe-area owners in code; **native test pending**.)

### 10.8 Accessibility and states

- [x] Interactive controls have correct role, label, state, focus order, and touch target. (Roles/labels/states and `minimumTouchTarget` sizes set in code across buttons, tabs, checkboxes, inputs; **on-device screen-reader/focus verification pending**.)
- [x] Tabs, checkboxes, statuses, disabled/loading controls, errors, and successes do not rely on color alone. (Tabs use an active indicator + selected a11y state; checkboxes show a check mark; status controls show text; disabled uses opacity + `disabled` state; errors/success use icons + text.)
- [x] Modal semantics and announcements are appropriate. (`accessibilityViewIsModal`, `accessibilityLiveRegion`, and `accessibilityRole="alert"` on result/error regions.)
- [ ] Contrast and readability are acceptable on representative platforms/settings. (**Native contrast check pending**.)
- [ ] Loading, empty, error, retry, pending, partial-recovery, success, and locked states are understandable. (All states implemented via `ResultState`/row states; **native readability pending**.)

### 10.9 Regression and repository verification

- [ ] Customer-only, courier-only, and both dual-role choices pass visually/functionally.
- [ ] Full M13 Customer journey and all completed M14 features pass regression checks.
- [x] `git diff --check` passes.
- [x] `npm ls --depth=0` reports no invalid dependency.
- [x] `npx expo config --type public` succeeds without secrets.
- [x] Android and iOS Expo exports succeed and generated output is removed.
- [ ] Representative iOS/Android manual checks are recorded honestly. (2026-07-21 partial evidence: Expo Go on an iPhone 17 Pro Max iOS Simulator, using the ngrok-backed API URL, opened successfully and completed login plus the initial authenticated app view. Full iOS journeys and Android remain pending.)
- [ ] Final diff contains no unselected dependency/asset, backend edit, secret/live URL, private log, generated output, or unrelated change.

Claude must leave criteria unchecked until current evidence supports them. Static inspection/export cannot prove visual fidelity, native scrolling, keyboard behavior, accessibility, or cross-platform font rendering.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## 11. Feature Definition of Done

- [ ] Every graded UI criterion has current evidence.
- [x] Claude audited before editing and changed only demonstrated typography and wireframe-structure gaps.
- [x] Claude presented genuine minimum-change options and implemented only the user-selected font and visual-correction decisions.
- [x] Palette, status colors, Arial/Arimo/Oswald policy, exact tabs, and role chrome are consistently implemented.
- [ ] All required M14 wireframe surfaces match without functional/checklist contradiction.
- [ ] Overflow, safe areas, keyboard, large text, touch targets, labels, states, and modals pass representative iOS/Android checks.
- [ ] Full Customer/Courier/navigation/feature regression checks pass.
- [ ] No unselected or undocumented backend work, dependency/font asset, or unrelated redesign exists.
- [ ] Global spec, this spec, relevant completed specs, and private implementation log match final verified behavior.
- [ ] Complete diff contains no dead visual workaround, stale style/comment, debug output, artifact, secret, or unrelated edit.
- [x] Claude's handoff includes outcome, selected options, changed files, screen/state evidence, checks/results, manual gaps, scoped stage command, and copy-ready commit command.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

## 12. Notes for AI tools

- Claude is the implementation and verification agent for this specification.
- Audit the finished app before editing; do not redesign passing surfaces.
- Inspect the supplied wireframe directly and preserve checklist/functionality priority.
- Build a concise screen/state audit matrix and tie every edit to a failed row.
- Investigate Android Arial availability and any other genuine discrepancy, present options, and stop for the user's choice.
- Do not select a font asset/fallback, dependency, label compromise, or layout/navigation restructuring independently.
- Prefer the smallest shared-owner correction after the user selects.
- Do not make backend or business-logic changes unless the user selects a documented option and the governing specs are amended first.
- Do not claim visual/native/platform/accessibility results unless observed.
- If device access is unavailable, complete static/export checks and name exact manual gaps.
- Append the final dated report to `.omi/m14/IMPLEMENTATION_LOG.md`; never stage it.
- Do not stage, commit, merge, or push.
- Finish with outcome, user-selected options, exact files, checks/results, manual gaps, scoped `git add`, and a copy-ready Conventional Commit command.

<p align="right"><a href="#top" aria-label="Return to top">↑</a></p>

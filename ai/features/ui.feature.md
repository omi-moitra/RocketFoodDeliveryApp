# AI Feature Specification — UI

> Current-state contract for the Module 14 visual system, typography, responsive layouts, authenticated chrome, scrolling, and accessibility.

## 1. Feature identity

- **Feature:** Module 14 UI System and Cross-Platform Audit
- **Area:** All mobile routes, shared components, tabs, modals, theme, fonts, safe areas
- **Visual reference:** `client/docs/m14/Wireframe.pdf` plus retained M13 contracts
- **Graded labels:** Customer—Restaurants, Order History, Account; Courier—Order Delivery, Account

## 2. Goal

Customer and Courier surfaces use one Rocket Food visual language without changing feature behavior. Required controls remain readable, reachable, scrollable, and accessible across supported iOS and Android layouts. Functional checklist wording takes precedence where a wireframe label differs.

## 3. Implemented visual system

### Palette

All reusable colors are centralized in `client/constants/theme.js`:

| Token | Value | Primary use |
| --- | --- | --- |
| Orange Red | `#DA583B` | Primary actions, In Progress |
| Dark Charcoal | `#222126` | Text and dark surfaces |
| Dark Red | `#851919` | Errors and Pending |
| Muted Green | `#609475` | Success and Delivered |
| Warm Yellow | `#F0CB67` | Active navigation emphasis |
| White | `#FFFFFF` | Backgrounds and inverse text |

Delivery states use both labels and semantic colors: Pending red, In Progress orange, Delivered green. Selection, error, success, loading, and disabled state never rely on color alone.

### Typography

- Display text uses bundled `Oswald_400Regular` or `Oswald_600SemiBold` tokens.
- General iOS/default text uses native `Arial`.
- Android uses bundled `Arimo_400Regular`, an Arial-metric-compatible typeface, because Android does not provide Arial.
- The root loads Arimo and both Oswald weights before exposing the route tree.
- A font-load error falls back safely rather than crashing the application.

### Shared dimensions

The theme centralizes the spacing scale, a 48-point minimum touch target, authenticated header dimensions, and active footer-indicator dimensions.

## 4. Navigation and chrome

### Public root surfaces

- Login has no authenticated header or footer.
- Account Selection has no role-specific header or footer.

### Customer

Customer tabs are exactly, in order:

1. Restaurants
2. Order History
3. Account

The shared logo/logout header persists across all three. Restaurant Menu remains inside the Restaurants tab and does not add a duplicate native header or footer.

### Courier

Courier tabs are exactly, in order:

1. Order Delivery
2. Account

`Order Delivery` is the canonical checklist label even though the wireframe may say Deliveries. The shared logo/logout header persists across both tabs.

Both tab layouts use visible labels, icons, selected accessibility state, a Warm Yellow active indicator, readable inactive state, minimum touch targets, safe-area-aware bottom space, and keyboard-hide behavior.

## 5. Surface contracts

The UI system covers:

- Login;
- Account Selection;
- Restaurant List and Menu;
- Order Confirmation;
- Order History and Order Details;
- Courier Order Delivery and Delivery Details;
- Customer and Courier Account Settings;
- shared loading, empty, error, retry, success, and unauthorized transitions.

The M14 surfaces retain their implemented functional hierarchy:

- Account Selection presents Customer and Courier choices.
- Order Confirmation presents products, independent SMS/email checkboxes, total, action, and result.
- Order Delivery presents status/action rows and View controls.
- Delivery Details presents the required delivery fields and line items.
- Both Account tabs use one shared form with role-specific labels.

## 6. Overflow, keyboard, and safe areas

- Data collections use established `FlatList` owners.
- Fixed/form content uses `ScrollView` where it can overflow.
- Account uses `KeyboardAvoidingView` plus a single vertical scroll owner.
- Modal bodies scroll while essential Close/result/action regions remain reachable according to each modal's layout.
- The root installs `SafeAreaProvider`; public screens and shared role layouts assign safe-area ownership without duplicating native headers.
- Tab content owns enough bottom space that the footer does not intentionally cover final rows or controls.
- Wide layouts constrain primary content to sensible maximum widths while retaining efficient phone width.

Native verification is still required for small screens, large text, keyboard-open layouts, landscape, system bars, and final-row reachability.

## 7. Accessibility and feedback

- Interactive controls expose roles, labels, disabled/busy/checked/selected states where applicable.
- Tabs retain visible text labels.
- Checkboxes display a check mark and expose checked state.
- Status controls display text as well as color.
- Result/error regions use alerts or live regions where appropriate.
- Modals identify themselves as modal accessibility regions.
- Required controls use at least the shared minimum touch target.
- Disabled and pending actions remain visibly distinct and cannot be activated.
- Raw errors, secrets, tokens, and internal identifiers are never announced or rendered.

## 8. Interfaces

| File | Responsibility |
| --- | --- |
| `client/constants/theme.js` | Palette, fonts, spacing, touch/header/footer dimensions |
| `client/app/_layout.js` | Font loading, root safe-area provider, neutral loading state |
| `client/app/customer/_layout.js` | Customer header/tab presentation |
| `client/app/courier/_layout.js` | Courier header/tab presentation |
| `client/components/AppHeader.js` | Logo, logout, pending/error feedback |
| `client/components/ResultState.js` | Shared loading/empty/error/retry presentation |
| `client/components/AccountScreen.js` | Shared form, keyboard, scrolling, field feedback |
| Order/delivery modal and row components | Feature-specific responsive and accessible presentation |

## 9. Design decision record

The audit found the palette, status colors, Oswald setup, exact tabs, role chrome, scroll owners, and accessibility semantics aligned with the implemented design. The first demonstrated platform gap was Android body typography.

Claude presented three font strategies and clarified the tradeoff between a generic platform fallback and an Arial-compatible bundled face. The user chose Arimo on Android only. Accordingly, `@expo-google-fonts/arimo` is installed, `Arimo_400Regular` loads at root, and `FONT_FAMILIES.body` resolves to Arimo on Android and native Arial on iOS/default.

A subsequent wireframe verification found presentation drift without business-logic defects. The user directed implementation of the visual corrections. Account Selection now uses Customer/Courier role cards, Account uses the supplied hierarchy and copy, Courier Delivery uses the Order ID/Address/Status/View table, Delivery Details uses the supplied title and field order, and notification choices use the supplied question and Email/Phone grouping. These changes reuse existing primitives, icons, state, and request boundaries.

## 10. Acceptance criteria

### Verified from code and automated checks

- [x] Exact Rocket Food colors and delivery-status mappings are centralized.
- [x] Reusable UI styles consume theme tokens; required static app-configuration colors remain in `app.json`.
- [x] Oswald weights are bundled and referenced through shared tokens.
- [x] Body typography uses the user-selected Arial/Arimo platform policy.
- [x] Customer and Courier tabs have exact labels/order, icons, active state, and shared header.
- [x] Login and Account Selection have no authenticated chrome.
- [x] Root/role guards prevent Customer and Courier chrome/data from mixing.
- [x] Scroll/list/keyboard owners exist for content that can overflow.
- [x] Interactive controls use explicit accessible semantics and non-color-only feedback.
- [x] The four-page M14 wireframe was reviewed and required surface structure was reconciled in code.
- [x] Account Selection, Account, Courier Delivery, Delivery Details, and notification-choice structure match the supplied hierarchy and labels.
- [x] `npm ls --depth=0`, public Expo config, Android/iOS Expo exports, and `git diff --check` pass; generated export output is removed.
- [x] No new UI dependency was added for the visual corrections; the existing selected Arimo dependency remains the only UI-audit dependency addition.

### Manual verification still required

- [ ] Confirm the reconciled surfaces through native screenshots against the supplied wireframe.
- [ ] Verify critical text at increased system font sizes.
- [ ] Verify header/footer and final content do not overlap on representative iOS/Android devices.
- [ ] Verify Account keyboard behavior, modal/list overflow, small phones, landscape, and wide layouts.
- [ ] Verify screen-reader focus/order, announcements, contrast, and native tab/checkbox semantics.
- [ ] Run Customer-only, Courier-only, both dual-role choices, logout/back, and full M13 regression journeys natively.

## 11. Verification boundary

Source audit and Expo export establish token use, component ownership, semantics present in code, dependency integrity, and bundle inclusion. They do not establish pixel-level wireframe fidelity, actual font rendering, safe-area/keyboard behavior, dynamic type, contrast, or native screen-reader behavior. Those remain unchecked until device testing is recorded.

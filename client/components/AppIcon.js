/**
 * File: AppIcon.js
 * Purpose: Renders every icon the app uses through the official FontAwesome SVG packages.
 * Contents:
 * 1. icon registry
 * 2. AppIcon component
 */

import {
  faBurger,
  faCar,
  faCaretDown,
  faCheck,
  faCircleCheck,
  faCircleXmark,
  faClockRotateLeft,
  faMagnifyingGlass,
  faMinus,
  faPlus,
  faTruck,
  faUser,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';

// ICONS_BY_NAME maps the FontAwesome names screens already use onto individually imported icon
// definitions, so the bundle carries only these icons and adding one means adding one entry here.
const ICONS_BY_NAME = Object.freeze({
  burger: faBurger,
  car: faCar,
  'caret-down': faCaretDown,
  check: faCheck,
  'circle-check': faCircleCheck,
  'circle-xmark': faCircleXmark,
  'clock-rotate-left': faClockRotateLeft,
  'magnifying-glass': faMagnifyingGlass,
  minus: faMinus,
  plus: faPlus,
  truck: faTruck,
  user: faUser,
  xmark: faXmark,
});

/**
 * Renders one registered FontAwesome icon as an SVG at the given color and size.
 * Screens use it instead of importing an icon library directly, so the icon backend
 * stays swappable in exactly one file.
 */
export default function AppIcon({ color, name, size }) {
  return <FontAwesomeIcon color={color} icon={ICONS_BY_NAME[name]} size={size} />;
}

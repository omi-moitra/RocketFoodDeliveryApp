/**
 * File: FilterSelect.js
 * Purpose: Provides one accessible wireframe-styled selector for restaurant filters.
 * Contents:
 * 1. Filter selector component
 * 2. Option modal
 * 3. Selector and modal styles
 */

import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import AppIcon from './AppIcon';
import { COLORS, FONT_FAMILIES, LAYOUT, SPACING } from '../constants/theme';

/**
 * Renders one controlled filter selector and its accessible option modal.
 * RestaurantListScreen reuses it for the Rating and Price filters.
 * Read aloud: “filter select.”
 */
export default function FilterSelect({ label, onChange, options, value }) {
  // isOpen owns only this selector's modal visibility; value remains controlled by its screen.
  const [isOpen, setIsOpen] = useState(false);
  // Each option keeps its visible label, spoken label, and primitive API value together so the
  // modal never sends decorative stars, dollar signs, or placeholder text back to screen state.
  const selectedOption = options.find((option) => option.value === value) ?? options[0];

  /**
   * Closes the modal before sending the chosen primitive value to the parent screen.
   * Each option button calls it with its API-ready value.
   * Read aloud: “handle option press.”
   */
  function handleOptionPress(nextValue) {
    setIsOpen(false);
    onChange(nextValue);
  }

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityHint={`Opens ${label.toLowerCase()} filter choices`}
        accessibilityLabel={`${label} filter, ${selectedOption.accessibilityLabel}`}
        accessibilityRole="button"
        onPress={() => setIsOpen(true)}
        style={({ pressed }) => [styles.selector, pressed && styles.selectorPressed]}
      >
        <Text numberOfLines={1} style={styles.selectorText}>
          {selectedOption.label}
        </Text>
        <AppIcon color={COLORS.white} name="caret-down" size={15} />
      </Pressable>

      <Modal
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
        transparent
        visible={isOpen}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            accessibilityLabel={`Close ${label.toLowerCase()} filter choices`}
            accessibilityRole="button"
            onPress={() => setIsOpen(false)}
            style={StyleSheet.absoluteFill}
          />
          <View accessibilityViewIsModal style={styles.optionPanel}>
            <Text style={styles.optionTitle}>Select {label}</Text>
            {options.map((option) => {
              const isSelected = option.value === value;

              return (
                <Pressable
                  accessibilityLabel={option.accessibilityLabel}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  key={option.key}
                  onPress={() => handleOptionPress(option.value)}
                  style={({ pressed }) => [
                    styles.optionButton,
                    isSelected && styles.optionButtonSelected,
                    pressed && styles.optionButtonPressed,
                  ]}
                >
                  <Text style={styles.optionText}>{option.label}</Text>
                  {isSelected ? (
                    <AppIcon color={COLORS.white} name="check" size={16} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    color: COLORS.charcoal,
    fontFamily: FONT_FAMILIES.oswaldSemiBold,
    fontSize: 20,
    marginBottom: SPACING.xs,
  },
  selector: {
    alignItems: 'center',
    backgroundColor: COLORS.orangeRed,
    borderRadius: 8,
    flexDirection: 'row',
    gap: SPACING.sm,
    justifyContent: 'center',
    minHeight: LAYOUT.minimumTouchTarget,
    paddingHorizontal: SPACING.sm,
  },
  selectorPressed: {
    backgroundColor: COLORS.darkRed,
  },
  selectorText: {
    color: COLORS.white,
    flexShrink: 1,
    fontFamily: FONT_FAMILIES.body,
    fontSize: 16,
  },
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: COLORS.charcoal,
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  optionPanel: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.charcoal,
    borderRadius: 10,
    borderWidth: 1,
    maxWidth: 420,
    padding: SPACING.md,
    width: '100%',
  },
  optionTitle: {
    color: COLORS.charcoal,
    fontFamily: FONT_FAMILIES.oswaldSemiBold,
    fontSize: 24,
    marginBottom: SPACING.sm,
  },
  optionButton: {
    alignItems: 'center',
    backgroundColor: COLORS.orangeRed,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    minHeight: LAYOUT.minimumTouchTarget,
    paddingHorizontal: SPACING.md,
  },
  optionButtonSelected: {
    backgroundColor: COLORS.darkRed,
  },
  optionButtonPressed: {
    opacity: 0.82,
  },
  optionText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILIES.body,
    fontSize: 17,
  },
});

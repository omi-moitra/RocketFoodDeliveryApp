# M14 Feature Specification Template — Inactive

This file is the retained generic feature-specification template. It is not an implemented Rocket Food feature, does not define application behavior, and is not part of Module 14 acceptance evidence.

The active Module 14 feature specifications are:

- `navigation-structure.feature.md` — original M13 feature updated for M14
- `role-based-navigation.feature.md`
- `courier-delivery.feature.md`
- `account-details.feature.md`
- `order-confirmation-modal.feature.md`
- `ui.feature.md`

Use one of those current-state specifications to understand project behavior. If another feature is introduced later, copy the structure below into a new descriptively named file and replace every prompt before treating it as an active contract.

## Feature identity

- **Feature:**
- **Area:**
- **Routes/components/endpoints:**

## Goal

Describe the user-visible outcome.

## Implemented scope

List behavior included in the implementation and explicitly identify adjacent exclusions.

## Functional contract

Describe requirements as current invariants rather than future implementation instructions.

## User flow

Describe the implemented start-to-finish interaction and failure/recovery paths.

## Interfaces

List the actual files, screens, services, storage boundaries, and API endpoints that own the behavior.

## Data and validation

Record normalized shapes, identity rules, request/response contracts, validation, and sensitive-data restrictions.

## Decision record

When a material choice was made, record the alternatives Claude presented, the user's selection, and the resulting implemented contract. Write the rest of the specification as though that selected design had been intended from the outset.

## Acceptance criteria

Separate implementation facts supported by current evidence from native/manual verification that remains outstanding. Do not use source inspection or export success as proof of platform interaction or visual fidelity.

## Verification boundary

State precisely what automated checks, source inspection, live API/database checks, and native device runs do or do not prove.

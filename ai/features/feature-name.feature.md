# 🤖 AI_FEATURE_<Feature-Name>

> 🚨 **Important: Delete all placeholder text marked with `>` (including this line) and replace it with your own project-specification content.**
>
> Add this file to the root directory of your project at **`/docs/ai/features/AI_FEATURE_<feature-Name>.md`**.
>
> This document describes **one feature of the project**.
>
> A feature can include **multiple small requirements** that work together.
>
> Examples:
>
> - A login feature may include:
>   - A frontend page
>   - A fetch request
>   - One or more backend endpoints
> - A users feature may include:
>   - Create user
>   - Read user(s)
>   - Update user
>   - Delete user
>  
> This document helps the AI understand **what belongs together** and how to implement it consistently.
>
> Read each section, then **remove the explanations** and replace them with your own content.

---

## Feature Identity

> Clearly name the feature.
>
> The name should describe a **functional unit**, not a technical task.

- **Feature Name:**
- **Related Area:**  
  > Example: Frontend, Backend, Fullstack, Mobile

---

## Feature Goal

> Explain **what this feature achieves** from a functional point of view.
>
> Focus on the outcome, not the technical implementation.

---

## Feature Scope

### In Scope (Included)

> List everything that is part of this feature.
>
> These are the **small requirements** that together form the feature.
>
> Examples:
>
> - UI page or screen
> - Form validation
> - Fetch request
> - API endpoints
> - Database interaction

### Out of Scope (Excluded)

> List what is **not part of this feature**, even if it sounds related.
>
> This prevents the AI from adding extra logic or sub-features.

---

## Sub-Requirements (Feature Breakdown)

> This is the **most important section** of this document.
>
> Break the feature into **small, clear requirements**.
> These are not separate features, but parts of the same one.
>
> Example format:
>
> - Requirement A — short description
> - Requirement B — short description
> - Requirement C — short description

---

## User Flow / Logic (High Level)

> Describe how the feature works **from start to finish**.
>
> This helps the AI connect frontend, backend, and data correctly.
>
> Example:
>
> 1. User opens the page
> 2. User enters data
> 3. Request is sent
> 4. Response is handled

---

## Interfaces (Pages, Endpoints, Screens)

> Describe **where this feature lives** in the project.
>
> This prevents the AI from inventing files or routes.

### Frontend

> Pages, components, or screens involved.

### Backend / API

> Endpoints related to this feature.
>
> No implementation details, only purpose.
>
> Example:
>
> - `POST /users` — create user
> - `GET /users` — list users

---

## Data Used or Modified

> Describe what data this feature uses, sends, or modifies.
>
> Keep it simple and readable.
>
> Example:
>
> - User object: name, email, password

---

## Tech Constraints (Feature-Level)

> Feature-specific technical rules.
>
> These override or complement the main AI spec if needed.
>
> Examples:
>
> - Use Fetch API only
> - No external UI library
> - Use existing database schema

---

## Acceptance Criteria

> Define **when this feature is considered complete**.
>
> This is a checklist for both:
>
> - The student
> - The AI
>
> Example:
>
> - [ ] All sub-requirements are implemented
> - [ ] Feature works without errors
> - [ ] UI behaves as expected
> - [ ] Endpoints return correct responses

---

## Notes for the AI

> Optional section to guide the AI’s behavior for this feature.
>
> Use this when:
>
> - The feature is tricky
> - The student wants extra explanation
> - Common mistakes should be avoided
>
> Example:
>
> - Explain logic step by step
> - Do not refactor unrelated code
> - Keep changes minimal

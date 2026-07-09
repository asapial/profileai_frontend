# Frontend Unit Testing Skills

## Purpose

Use this file as the frontend unit testing standard for the ProFile AI project.

Every frontend feature, component, hook, store, form, and interactive page section must be tested before the feature is considered complete.

The goal is to ensure that the UI behaves correctly, handles all important states, protects users from mistakes, and remains stable during future development.


---

## Recommended Frontend Testing Stack

Use the following tools:

```txt
Vitest
React Testing Library
@testing-library/user-event
@testing-library/jest-dom
MSW - Mock Service Worker
happy-dom or jsdom
```

Recommended use:

- Vitest: test runner
- React Testing Library: component behavior testing
- user-event: realistic user interactions
- jest-dom: better DOM assertions
- MSW: mock API requests
- jsdom/happy-dom: browser-like test environment

Do not call real backend APIs from frontend unit tests.


---

## Testing Philosophy

### Core Principles

Every test must be:

- Clear
- Deterministic
- Fast
- Isolated
- Easy to read
- Easy to debug
- Focused on behavior, not implementation details

Do not write tests only to increase coverage numbers.
Write tests that prove the feature works correctly and safely.

### Testing Priorities

Prioritize tests for:

1. Authentication and authorization
2. User-owned data protection
3. Admin-only actions
4. Resume creation and editing
5. AI request preparation and response handling
6. Payment and webhook logic
7. File upload validation
8. Form validation
9. Critical UI workflows
10. Security-sensitive actions

---

---

## Test Types

### 3.1 Unit Test

Tests one small unit in isolation.

Examples:

- Utility function
- Zod schema
- React component
- Custom hook
- Service method
- Access-control helper
- Data transformer
- AI prompt builder
- Resume scoring function

### 3.2 Component Test

Tests a frontend component as the user sees it.

Examples:

- LoginForm
- ResumeCard
- TemplateCard
- ATSScoreGauge
- ThemeToggle
- ConfirmDialog
- ResumeSectionEditor

### 3.3 Route/Controller Test

Tests backend API route behavior.

Examples:

- POST /auth/login
- GET /resumes
- PUT /resumes/:id
- POST /resumes/:id/export
- PATCH /admin/users/:id/status

### 3.4 Integration Test

Tests multiple units together.

Examples:

- Login API with database
- Resume creation with Prisma transaction
- Stripe webhook verification
- File upload validation
- Admin action with audit log

### 3.5 End-to-End Test

E2E testing is not the main focus of this file, but critical workflows should later be tested with Playwright.

Examples:

- Register -> Verify Email -> Login
- Create Resume -> Edit -> Export PDF
- Admin Login -> Ban User -> Audit Log

---

---

## Coverage Targets

Minimum required coverage:

```txt
Statements: 80%
Branches: 75%
Functions: 80%
Lines: 80%
```

High-risk modules must target 90%+ coverage:

- Authentication
- Authorization
- RBAC
- Object-level authorization
- Payment webhook handling
- AI usage limits
- File upload validation
- Admin audit logging
- Account deletion
- Password reset
- OTP verification

Coverage must not be achieved by testing implementation details only.
Behavior and security outcomes matter more than raw coverage.

---

---

## Frontend Unit Testing Rules

### 5.1 What Must Be Tested in Frontend

Test every reusable component, form, hook, and page-level interaction.

Required frontend units:

```txt
components/
hooks/
stores/
forms/
lib/client-utils/
page client components
```

Do not test purely static layout unless it contains logic or conditional rendering.

### 5.2 Component Test Requirements

Every interactive component must test:

- Correct rendering
- Required text or label exists
- User interaction works
- Loading state appears
- Empty state appears when applicable
- Error state appears when applicable
- Disabled state works
- Callback function is called correctly
- Accessibility labels exist
- Light and dark mode styling does not break basic rendering

Example test expectations:

```txt
Button:
- renders children
- supports disabled state
- calls onClick
- does not call onClick when disabled

Modal:
- opens correctly
- traps focus if implemented
- closes on cancel
- confirms action on confirm click

Form:
- validates required fields
- shows field error
- submits valid data
- disables submit while loading
```

---

---

## Frontend Form Testing Rules

All forms must be tested using React Testing Library and user-event.

Required form tests:

1. Empty submission shows validation errors
2. Invalid input shows field-level errors
3. Valid input calls submit handler
4. Submit button shows loading state
5. Submit button is disabled while submitting
6. API success shows success state or redirects
7. API failure shows readable error
8. Sensitive forms require confirmation where needed

Forms that must have strong tests:

- LoginForm
- RegisterForm
- VerifyEmailForm
- ForgotPasswordForm
- ResetPasswordForm
- ResumeWizard forms
- ResumeEditor section forms
- Profile forms
- Billing forms
- Admin user action forms
- Admin settings forms
- Admin template builder forms

---

---

## Frontend API Mocking Rules

Use MSW for frontend tests that depend on API responses.

Required:

- Mock success response
- Mock validation error
- Mock unauthorized response
- Mock forbidden response
- Mock server error
- Mock loading state where possible

Example API scenarios:

```txt
GET /resumes -> returns resume list
GET /resumes -> returns empty list
GET /resumes -> returns 401 unauthorized
GET /resumes -> returns 500 server error
```

Do not call real backend APIs in frontend unit tests.

---

---

## Frontend Page Testing Rules

Page-level tests should verify behavior, not visual pixels.

For each important page, test:

- Initial loading state
- Main page title
- Main CTA
- Empty state
- API error state
- Permission-based UI
- Correct navigation action
- Key user interaction

Required page tests:

```txt
/login
/register
/verify-email
/forgot-password
/reset-password
/dashboard
/profile
/templates
/resume/create
/resume/[id]/edit
/resumes
/cover-letters
/tools/jd-analyzer
/applications
/notifications
/billing
/admin
/admin/users
/admin/templates
/admin/settings
/admin/analytics
/admin/audit-log
/admin/security
```

---

---

## Frontend Store and Hook Testing

Test Zustand stores and custom hooks separately.

Required store tests:

- Initial state is correct
- State update works
- Reset action works
- Step navigation works
- Invalid state is rejected where applicable

Stores that must be tested:

```txt
useResumeWizardStore
useEditorLayoutStore
useModalStore
useThemeStore if custom
useAdminTableStore if custom
```

Required hook tests:

- useAutoSave
- useDebounce
- useCurrentUser
- useRequireAuth
- useResumePreview
- useUploadFile
- usePagination
- useFilters

For useAutoSave, test:

1. It does not save immediately before debounce time
2. It saves after debounce time
3. It does not save unchanged data
4. It handles API error
5. It cancels save on unmount if required

---

---

## Frontend Accessibility Tests

Every important UI component should have basic accessibility coverage.

Test:

- Inputs have labels
- Buttons have accessible names
- Icon-only buttons have aria-label
- Dialogs have title and description
- Error messages are readable
- Keyboard interaction works for dropdowns/modals where possible
- Focus-visible style is not removed

Use queries like:

```ts
screen.getByRole("button", { name: /generate/i })
screen.getByLabelText(/email/i)
screen.getByRole("dialog")
```

Avoid relying only on test IDs.

---

---

## Frontend Snapshot Testing Rule

Avoid large snapshot tests.

Allowed snapshot use:

- Small stable utility output
- Small generated class map
- Small static component only if necessary

Do not snapshot:

- Whole pages
- Large forms
- Dynamic dashboards
- Resume preview HTML
- Admin tables

Prefer explicit assertions.

---

---

## Frontend Test File Structure

Recommended frontend structure:

```txt
apps/web/
  components/
    resume/
      resume-card.tsx
      resume-card.test.tsx
  app/
    (auth)/
      login/
        login-form.tsx
        login-form.test.tsx
  hooks/
    use-auto-save.ts
    use-auto-save.test.ts
  stores/
    resume-wizard-store.ts
    resume-wizard-store.test.ts
  test/
    setup.ts
    server.ts
    handlers.ts
    factories.ts
```

---

---

## Frontend Feature Test Matrix

### Authentication Pages

#### Login Page

Test:

- Email and password fields render
- Invalid email shows error
- Empty password shows error
- Successful login redirects user
- 2FA required redirects to 2FA page
- Device limit error shows readable message
- Rate limit error shows readable message

#### Register Page

Test:

- Required fields validate
- Password strength appears
- Password mismatch shows error
- Duplicate email error appears
- Successful registration redirects to verify email

#### Verify Email Page

Test:

- OTP input accepts 6 digits
- Invalid OTP shows error
- Expired OTP shows resend option
- Successful verification redirects to login

### User Pages

#### Dashboard

Test:

- Summary cards render
- Empty resume state appears
- Usage warning appears at threshold
- Quick actions navigate correctly

#### Profile

Test:

- Tabs render
- Personal info saves
- Security form validates
- 2FA toggle opens setup flow
- Device revoke requires confirmation
- Delete account requires typed confirmation

#### Resume Wizard

Test:

- Steps render in correct order
- Cannot continue without required fields
- Generate button disabled when over limit
- AI loading states appear
- Successful generation routes to editor

#### Resume Editor

Test:

- Resume data loads
- Auto-save triggers after edit
- Section reorder works
- AI improve opens result preview
- Export button triggers export
- Public link toggle shows link
- Version restore requires confirmation

#### My Resumes

Test:

- List renders
- Empty state renders
- Search filters results
- Duplicate action works
- Delete requires confirmation
- Folder move works

### Admin Pages

#### Admin Dashboard

Test:

- Metrics render
- Error state renders
- Quick links work

#### User Directory

Test:

- Table renders
- Search works
- Ban requires confirmation
- Edit limits modal validates
- Normal user cannot access page

#### Template Management

Test:

- Template list renders
- Set default works
- Toggle active works
- Delete disabled when template is in use

#### Settings

Test:

- Current settings load
- Invalid numeric settings fail
- Maintenance mode requires confirmation
- Save success shows toast

#### Audit Log

Test:

- Logs render
- Filters work
- No edit/delete buttons exist

---

---

## Example Frontend Test Pattern

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LoginForm } from "./login-form";

describe("LoginForm", () => {
  it("should show validation errors when submitted empty", async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /login/i }));

    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });

  it("should call submit handler with valid data", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<LoginForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/email/i), "user@example.com");
    await user.type(screen.getByLabelText(/password/i), "StrongPass123!");
    await user.click(screen.getByRole("button", { name: /login/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "StrongPass123!"
    });
  });
});
```

---

---

## Naming Rules

Use clear test names.

Good:

```txt
should reject login when password is incorrect
should prevent user from reading another user's resume
should create audit log when admin bans user
should show validation error when email is invalid
```

Bad:

```txt
works
test login
renders
should be ok
```

Use this pattern:

```txt
describe("FeatureName", () => {
  it("should do expected behavior when condition is true", () => {})
})
```

---

---

## Test Data Rules

Use factories instead of repeated hardcoded objects.

Good:

```ts
const user = await createTestUser({ email: "user@example.com" });
const resume = await createTestResume({ userId: user.id });
```

Avoid:

- Repeating full objects in every test
- Depending on real user IDs
- Depending on current date without freezing time
- Using random data without controlling it

Use fixed dates when testing date logic.

---

---

## Mocking Rules

Mock only external boundaries.

Allowed mocks:

- OpenAI
- Stripe
- Email provider
- Storage provider
- PDF renderer
- Redis where appropriate
- Browser APIs in frontend tests
- Router navigation in frontend tests

Avoid mocking:

- The function being tested
- Business logic that should be verified
- Validation schemas
- Authorization checks

---

---

## CI Testing Rules

Every pull request must run:

```bash
npm run lint
npm run typecheck
npm run test
npm run test:coverage
```

Recommended scripts:

```json
{
  "scripts": {
    "test": "turbo run test",
    "test:web": "npm --workspace apps/web run test",
    "test:api": "npm --workspace apps/api run test",
    "test:coverage": "turbo run test:coverage",
    "typecheck": "turbo run typecheck",
    "lint": "turbo run lint"
  }
}
```

CI must fail if:

- Tests fail
- Type checking fails
- Linting fails
- Coverage drops below threshold
- Security-critical tests are skipped

---

---

## Frontend Definition of Done

A frontend feature is not complete until:

- Component tests are written
- Form validation tests are written where applicable
- Page-level behavior tests are written for important routes
- Loading state is tested
- Empty state is tested where applicable
- Error state is tested
- API responses are mocked with MSW
- Accessibility basics are tested
- Light and dark mode rendering is checked
- Critical user interactions are tested
- Tests pass locally
- Tests pass in CI
- Coverage threshold is maintained

Never ship a frontend feature that only works in the happy path.


---

## Final Frontend Instruction for AI Agent or Developer

When building a frontend feature:

1. Identify the user behavior the feature must support.
2. Write or update the validation schema if the UI accepts input.
3. Create component, form, hook, or page tests.
4. Mock API responses with MSW.
5. Test success, loading, empty, and error states.
6. Test important accessibility behavior.
7. Test sensitive confirmation flows.
8. Verify light and dark mode rendering.
9. Run the frontend test suite before marking the feature complete.

Frontend tests must protect the user experience, not just the code coverage number.

# Extension Plugin API Spec — Gap Review
**Reviewed against:** Bookit core v1.5.0  
**Review date:** April 2026  
**Reviewer:** PA chat  
**Status:** PENDING LIRON APPROVAL — do not update the spec until approved

---

## Summary

The `Extension_Plugin_API_Spec.md` was written in February 2026 against
core v1.0.0. Three categories of gaps exist against v1.5.0.

---

## Gap 1 — Missing hooks (added after spec was written)

Three action/filter hooks were added to core in Sprint 4F for the Bookit
Meetings extension. They are not documented in the current spec.

### `bookit_after_booking_confirmed` *(action)*

**Where to add:** Section 4 (Action hooks), after `bookit_after_customer_created`

**Proposed documentation:**

> Fires after the booking confirmation page has loaded, emails have been sent,
> and the booking session has been cleared. This is the correct hook for
> post-confirmation side effects that must not affect the booking creation flow.
>
> **Parameters:**
> - `$booking_id` *(int)* — The confirmed booking's ID.
> - `$booking` *(array)* — Full booking record at time of confirmation.
>
> **When it fires:** Public wizard only (confirmation page render). Does not
> fire for admin dashboard bookings.
>
> **Example:**
> ```php
> add_action( 'bookit_after_booking_confirmed', function( int $booking_id, array $booking ) {
>     // Generate and store a meeting link for this booking.
> }, 10, 2 );
> ```

---

### `bookit_confirmation_meeting_section` *(filter)*

**Where to add:** Section 5 (Filter hooks), after `bookit_dashboard_js_data`

**Proposed documentation:**

> Filters the HTML output block injected into the booking confirmation page.
> Return non-empty HTML to display a "Join Meeting" section beneath the
> booking summary. Default is an empty string (no output).
>
> **Value being filtered:** `$html` *(string)* — HTML to inject. Default: `''`.
>
> **Additional parameters:**
> - `$booking` *(array)* — Full booking record.
>
> **Expected return type:** `string` — Safe HTML. The template does not
> add any wrapper — your HTML is output directly.
>
> **Variable name in template:** `$bookit_meeting_section_html` (prefixed to
> avoid scope collision in the confirmation page template).
>
> **Example:**
> ```php
> add_filter( 'bookit_confirmation_meeting_section', function( string $html, array $booking ): string {
>     $link = my_get_meeting_link( $booking['id'] );
>     if ( ! $link ) { return $html; }
>     return '<div class="bookit-meeting-section"><a href="' . esc_url( $link ) . '">Join Meeting</a></div>';
> }, 10, 2 );
> ```

---

### `bookit_email_meeting_section` *(filter)*

**Where to add:** Section 5 (Filter hooks), after `bookit_confirmation_meeting_section`

**Proposed documentation:**

> Filters the HTML injected into the customer confirmation email, inside
> `generate_customer_email()`. Return non-empty HTML to add a meeting link
> row to the email. Default is an empty string (no output, no change to
> existing email).
>
> **Value being filtered:** `$html` *(string)* — HTML to inject. Default: `''`.
>
> **Additional parameters:**
> - `$booking` *(array)* — Full booking record.
>
> **Expected return type:** `string` — Email-safe HTML (inline styles
> recommended for email client compatibility).
>
> **Variable name in template:** `$bookit_email_meeting_html` (prefixed to
> avoid scope collision in the email template).
>
> **Example:**
> ```php
> add_filter( 'bookit_email_meeting_section', function( string $html, array $booking ): string {
>     $link = my_get_meeting_link( $booking['id'] );
>     if ( ! $link ) { return $html; }
>     return '<tr><td style="padding:8px 0;"><strong>Meeting link:</strong> <a href="' . esc_url( $link ) . '">' . esc_html( $link ) . '</a></td></tr>';
> }, 10, 2 );
> ```

---

## Gap 2 — Missing field on `bookit_register_extension()` (Phase 2)

The Phase 2 mobile app decision document specifies that `bookit_register_extension()`
needs a `mobile_features` field so the React Native app can detect which
extension screens to enable.

This field does not exist in core v1.5.0 and will be added when the JWT
auth layer (Sprint 7) is built. **Do not add it to the spec yet** — document
it here as a pending addition.

**Pending addition (Sprint 7):**

> **Optional arguments** table — add row:
>
> | Argument | Type | Description |
> |---|---|---|
> | `mobile_features` | `string[]` | Array of mobile screen identifiers this extension provides. Used by the React Native app to show/hide extension navigation items. Example: `['class_schedule', 'class_booking']` |
>
> Extensions that declare `mobile_features` will have those screens shown in
> the mobile app when the extension is active. Extensions without this field
> are treated as web-only.

**Action:** Add to spec when Sprint 7 (JWT auth layer) is planned.

---

## Gap 3 — Spec version and core version reference outdated

Current spec header:
```
Version: 1.0.0
Applies to core version: 1.0.0+
Last updated: February 2026
```

Should be updated to:
```
Version: 1.1.0
Applies to core version: 1.5.0+
Last updated: April 2026
```

The version bump from 1.0.0 to 1.1.0 is correct per the spec's own
versioning rules: new hooks added = minor bump, backwards compatible.

---

## No other gaps found

The rest of the spec is accurate against v1.5.0:

- Registration contract (`bookit_register_extension()`) — correct ✅
- All Sprint 4B action hooks — correct ✅
- All Sprint 4B filter hooks — correct ✅
- Migration framework contract — correct ✅
- Dashboard Vue mounting contract — correct ✅
- REST namespace convention — correct ✅
- Public API class list (`Bookit_Logger`, `Bookit_Auth`, etc.) — correct ✅
- Worked example (Hello World) — correct ✅
- Versioning and compatibility section — correct ✅

---

## Proposed changes to approve

| # | Change | Section | Status |
|---|--------|---------|--------|
| 1 | Add `bookit_after_booking_confirmed` action hook | §4 | Needs approval |
| 2 | Add `bookit_confirmation_meeting_section` filter hook | §5 | Needs approval |
| 3 | Add `bookit_email_meeting_section` filter hook | §5 | Needs approval |
| 4 | Update spec version to 1.1.0 | Header | Needs approval |
| 5 | Update `Applies to core version` to 1.5.0+ | Header | Needs approval |
| 6 | Add `mobile_features` field note as pending | §3 optional args | Defer to Sprint 7 |

Once Liron approves items 1–5, update `Extension_Plugin_API_Spec.md` in
project knowledge. Item 6 is deferred until Sprint 7.

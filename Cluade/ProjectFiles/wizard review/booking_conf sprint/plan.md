Sprint — Booking Confirmed Page Redesign
Plugin root: bookit-booking-system/
Branch: Phase1
Baseline test count: 791 tests, 0 failures
Reference files: design/booking-confirmed.html · design/booking-confirmed-design-decisions.md

Sprint overview
Redesign the existing booking-confirmed.php template and its stylesheet confirmation-page.css to match the agreed design decisions. This is a single-task sprint. The page is rebuilt in place — same shortcode, same PHP logic, new HTML structure and CSS. All existing business logic (booking retrieval, email sending audit, session clearing, hooks) is preserved. Only the presentation layer changes.

Task 1 of 1 — Booking Confirmed page redesign (~4h)
READ FIRST — DO NOT WRITE ANY CODE UNTIL YOU HAVE READ THESE FILES

public/templates/booking-confirmed.php — full existing template; all logic must be preserved
public/assets/css/confirmation-page.css — existing stylesheet to replace
public/assets/css/booking-wizard.css — source of all --bookit-* CSS custom properties to reuse
public/assets/css/booking-wizard-v2.css — source of --bookit-v2-waiver-* tokens used by the waiver block
design/booking-confirmed.html — the agreed HTML structure and visual design reference
design/booking-confirmed-design-decisions.md — all agreed decisions including conditional blocks and bug fixes
tests/unit/test-booking-shortcode.php — existing test patterns to follow

If any file does not exist, stop and report back before proceeding.
Context
The existing confirmation page has several issues: stale email-sending logic that may conflict with the Sprint 4H async queue, inaccurate copy, raw database ID shown as booking reference, a plain text checkmark, and a CSS layout that overflows on narrow mobile viewports. This task fixes all of these while rebuilding the page presentation to match the reference design. The PHP business logic — booking retrieval, session clearing, the bookit_after_booking_confirmed action, and the bookit_confirmation_meeting_section filter — must remain exactly as-is.
Implementation requirements
public/templates/booking-confirmed.php — MODIFY
Preserve without any change:

All booking retrieval logic (get_booking_by_id, get_booking_by_stripe_session)
Both error states (booking not found, no ID/session in URL)
Bookit_Session_Manager session clearing
do_action( 'bookit_after_booking_confirmed', ... )
apply_filters( 'bookit_confirmation_meeting_section', ... )
$date_formatted and $time_formatted calculations

Email sending block — audit and fix:

Read the existing if ( ! $emails_already_sent && ! $is_pay_on_arrival ) block carefully
Since Sprint 4H, send_customer_confirmation() and send_business_notification() both call bookit_enqueue_email() internally — they add to the Action Scheduler queue rather than sending directly
The Stripe webhook already calls these methods when the payment completes, so calling them again on the confirmation page risks double-queuing
Fix: Remove the direct email sending block from booking-confirmed.php entirely. The transient guard (bookit_email_sent_) and the email sending responsibility belong in the webhook handler, not the confirmation page. If this is already handled correctly upstream, confirm and remove the redundant block. If unsure, wrap it in a comment explaining the decision rather than silently deleting it — STOP and report back.

Booking reference — fix:

Replace $booking['id'] with $booking['booking_reference'] for the displayed reference
If $booking['booking_reference'] is empty or null, fall back to 'BK-' . str_pad( $booking['id'], 8, '0', STR_PAD_LEFT ) as a safe fallback

HTML structure — replace entirely:
Replace the existing HTML output with the structure from design/booking-confirmed.html. Apply these PHP-specific requirements:
Section 1 — Success header:

Success icon: <div class="bookit-confirmed-icon"> containing an inline SVG checkmark (stroke, not fill). Do not use the ✓ text character.
Heading: "Booking confirmed" (lowercase c, matches design)
Sub-copy: <?php printf( esc_html__( "We'll send a confirmation to %s shortly.", 'bookit-booking-system' ), '<strong>' . esc_html( $booking['customer_email'] ) . '</strong>' ); ?>

Section 2 — Booking detail card:

Six rows: Service / Duration / With / Date / Time / Booking ref
Duration: display from $booking['service_duration'] formatted as "X min"
Date: use $date_formatted (already calculated)
Time: use $time_formatted (already calculated)
Booking ref: use the fixed $booking_reference variable from above, rendered with class bookit-confirmed-ref
Staff name: $booking['staff_name']

Section 3 — Payment card (conditional):
php<?php if ( $has_deposit ) : ?>
  <!-- deposit rows: Today (deposit) / Remaining (on the day) / Total -->
  <!-- balance note: "Your remaining balance is payable on the day..." -->
<?php elseif ( 'pay_on_arrival' !== $booking['payment_method'] ) : ?>
  <!-- single row: Total paid today / £X -->
<?php else : ?>
  <!-- pay on arrival block: "No deposit was taken. Please bring £X..." -->
<?php endif; ?>
Use $deposit_due, $balance_due, $total_price already calculated in the existing template.
Section 4 — Cancellation note:

Static copy: "To cancel or reschedule, use the link in your confirmation email."
Conditional second line: if bookit_get_business_phone() (or equivalent settings read) returns a non-empty value, append "Or call us on [phone]." Read how the existing template accesses business settings — use the same pattern (direct $wpdb->get_var() against wp_bookings_settings, key business_phone).

Section 5 — Conditional blocks (in order):
Cooling-off waiver — shown when ! empty( $booking['cooling_off_waiver_given'] ):
html<div class="bookit-confirmed-waiver">
  ✓ You have waived your 14-day right to cancel for this booking
  (Consumer Contracts Regulations 2013).
</div>
This block uses fixed amber CSS values from --bookit-v2-waiver-* tokens — same treatment as wizard Step 4. Not overridable by theme.
Special requests — shown when ! empty( $booking['special_requests'] ):
html<div class="bookit-confirmed-special-requests">
  <p class="bookit-confirmed-sr-label">Your special requests</p>
  <p class="bookit-confirmed-sr-value"><?php echo esc_html( $booking['special_requests'] ); ?></p>
</div>
```

Meeting section — output the `$bookit_meeting_section_html` filter result as before.

**Section 6 — Actions:**
- Primary: "Add to calendar" — links to a `.ics` download URL. Use `home_url( '/book/ical?booking_id=' . $booking['id'] )` as a placeholder URL — the .ics endpoint is a Sprint 5 task. Note this in a PHP comment.
- Secondary: "Back to home" — `home_url( '/' )`
- Tertiary text link: "Book again" — `home_url( '/book' )`

#### `public/assets/css/confirmation-page.css` — MODIFY (replace stylesheet)

Replace entirely with styles matching `design/booking-confirmed.html`.

All selectors must be scoped inside `.bookit-confirmation-page` to match the existing wrapper class (do not change the wrapper class name — it may be referenced in theme stylesheets).

**Token usage:**
- Reuse existing `--bookit-*` tokens for all colours, radii, borders, and spacing
- For the waiver block, use the `--bookit-v2-waiver-*` tokens already defined in `booking-wizard-v2.css`. If those tokens are not available in this stylesheet's context, define the amber values as fixed CSS in a comment-marked block: `/* Waiver amber — fixed, legal signal, not theme-overridable */`

**Components to implement:**

1. `.bookit-confirmation-page` — max-width 680px, centred, flex column, gap 12px, padding 2rem 1rem 3rem, background `--bookit-bg-page`
2. `.bookit-confirmed-header` — white card, border, radius, centred content, flex column, align-items center
3. `.bookit-confirmed-icon` — 64px circle, `--bookit-primary` background, flex, centred. SVG inside: white stroke, 28px
4. `.bookit-confirmed-heading` — 24px, font-weight 700, letter-spacing -0.02em
5. `.bookit-confirmed-email` — 14px, `--bookit-text-secondary`
6. `.bookit-confirmed-card` — white, border `--bookit-border`, radius `--bookit-border-radius`
7. `.bookit-confirmed-card-inner` — padding 1.25rem 1.5rem
8. `.bookit-confirmed-row` — flex, justify-content space-between, align-items baseline, gap 12px, padding 10px 0, border-bottom 1px solid `--bookit-border`. First child: padding-top 0. Last child: border-bottom none, padding-bottom 0.
9. `.bookit-confirmed-label` — 13px, `--bookit-text-secondary`, flex-shrink 0, white-space nowrap
10. `.bookit-confirmed-value` — 13px, font-weight 600, `--bookit-text-primary`, text-align right, min-width 0, word-break break-word
11. `.bookit-confirmed-ref` — `--bookit-primary` colour, font-weight 500, font-size 12px, letter-spacing 0.02em
12. `.bookit-confirmed-payment-row` — flex, space-between, padding 8px 0. `+ .bookit-confirmed-payment-row`: border-top 1px solid `--bookit-border`
13. `.bookit-confirmed-payment-row.total` — `.key` and `.val` font-weight 700, `.val` font-size 15px
14. `.bookit-confirmed-balance-note` — background `--bookit-bg-page`, border-radius 8px, padding 10px 12px, font-size 12px, `--bookit-text-secondary`
15. `.bookit-confirmed-cancel-note` — white card, border, radius, padding 12px 1.5rem, font-size 13px, `--bookit-text-secondary`, text-align center
16. `.bookit-confirmed-waiver` — fixed amber values (see above), border-left 3.5px solid amber, border-radius `--bookit-border-radius`, padding 1rem, font-size 13px
17. `.bookit-confirmed-special-requests` — `--bookit-bg-page`, border-radius `--bookit-border-radius`, padding 1rem 1.25rem. `.bookit-confirmed-sr-label`: 11px, uppercase, letter-spacing 0.06em, `--bookit-text-muted`, margin-bottom 4px. `.bookit-confirmed-sr-value`: 13px, `--bookit-text-primary`
18. `.bookit-confirmed-actions` — flex column, gap 10px
19. `.bookit-confirmed-btn-primary` — full width, `--bookit-btn-primary-bg`, white text, `--bookit-btn-radius`, 15px padding, font-weight 600, flex row, centred, gap 8px. SVG: 16px, white stroke
20. `.bookit-confirmed-btn-secondary` — full width, ghost, `--bookit-primary` border 1.5px + text, `--bookit-btn-radius`, 14px padding, font-weight 600
21. `.bookit-confirmed-btn-text` — full width, no border/bg, `--bookit-text-muted`, 13px, text-align center
22. `@media (max-width: 380px)` — `.bookit-confirmed-row` flex-direction column, align-items flex-start, gap 2px; `.bookit-confirmed-value` text-align left
23. `@media (max-width: 500px)` — reduced body padding, reduced card-inner padding

### PHPUnit requirements

Baseline: 791 tests, 0 failures — must not regress.

Write tests in: `tests/unit/test-booking-confirmed.php`

Required test cases:
- `test_confirmation_page_renders_success_header`: output contains `.bookit-confirmed-header`
- `test_confirmation_page_renders_booking_reference`: output contains `BK-` prefix in booking ref element
- `test_confirmation_page_does_not_show_raw_id_as_reference`: output does not contain `<span` with raw integer ID as the displayed reference value
- `test_confirmation_page_email_copy_says_shortly`: output contains the word "shortly" and does not contain "has been sent"
- `test_confirmation_page_shows_deposit_rows_when_deposit_exists`: deposit scenario → output contains "Today (deposit)"
- `test_confirmation_page_shows_pay_on_arrival_block`: pay_on_arrival booking → output contains "No deposit was taken"
- `test_confirmation_page_hides_waiver_when_not_given`: `cooling_off_waiver_given = false` → `.bookit-confirmed-waiver` absent
- `test_confirmation_page_shows_waiver_when_given`: `cooling_off_waiver_given = true` → `.bookit-confirmed-waiver` present
- `test_confirmation_page_hides_special_requests_when_empty`: empty special requests → `.bookit-confirmed-special-requests` absent
- `test_confirmation_page_shows_special_requests_when_set`: non-empty special requests → `.bookit-confirmed-special-requests` present
- `test_existing_booking_confirmed_shortcode_still_works`: `[bookit_booking_confirmation]` shortcode still renders without error

Run after implementation:
```
cd bookit-booking-system && vendor/bin/phpunit
```
All tests must pass before marking task complete.

### Acceptance criteria

#### Functional
- [ ] Success icon renders as a CSS circle with inline SVG stroke checkmark — not a text character
- [ ] Heading reads "Booking confirmed" (not "Booking Confirmed!")
- [ ] Email copy reads "We'll send a confirmation to [email] shortly." — not "has been sent"
- [ ] Booking reference shows formatted ref (e.g. BK-20260415-0042), not a raw integer
- [ ] Detail card shows all six rows: Service / Duration / With / Date / Time / Booking ref
- [ ] Date displays in full UK format: "Wednesday, 15 April 2026"
- [ ] Deposit payment card shown correctly with balance note
- [ ] Pay on Arrival block shown instead of payment card for pay_on_arrival bookings
- [ ] Total-only card shown for full payment (no deposit) online bookings
- [ ] Cancellation note present on all states
- [ ] Cooling-off waiver block shown only when waiver was given
- [ ] Special requests block shown only when non-empty
- [ ] `bookit_confirmation_meeting_section` filter output still rendered
- [ ] `bookit_after_booking_confirmed` action still fires
- [ ] "Add to calendar", "Back to home", "Book again" all present in correct hierarchy
- [ ] Mobile layout at 375px: rows side-by-side, no overflow
- [ ] Very narrow layout at 360px: rows stack (label above value)

#### Technical
- [ ] No PHP warnings or notices
- [ ] No JavaScript console errors
- [ ] All selectors scoped inside `.bookit-confirmation-page`
- [ ] Waiver block uses fixed amber values, not `--bookit-primary`
- [ ] All `--bookit-*` tokens used correctly, no hardcoded colours except amber waiver values
- [ ] PHPUnit suite passes (802+ tests, 0 failures)

#### Must NOT break
- [ ] `[bookit_booking_confirmation]` and `[bookit_confirmation]` shortcodes still work
- [ ] `bookit_after_booking_confirmed` action fires with correct arguments
- [ ] `bookit_confirmation_meeting_section` filter output still rendered
- [ ] Existing confirmation page CSS class `.bookit-confirmation-page` preserved as wrapper

### Git commit message
```
Sprint Confirmed-V2, Task 1: Booking confirmed page redesign

- Rebuild booking-confirmed.php HTML: success icon (SVG), correct
  email async copy, human-readable booking ref, conditional payment
  blocks, waiver and special requests, updated CTA hierarchy
- Remove stale direct email-sending block (queue handles delivery)
- Replace confirmation-page.css with scoped --bookit-* token styles
- Waiver block amber values fixed (legal signal, not theme token)
- Mobile: side-by-side rows, stacked fallback at 380px breakpoint
- 11 PHPUnit tests in test-booking-confirmed.php

Tests: 802 passing, 0 failures
If you encounter an architecture decision not covered above, or a conflict with existing code that this prompt does not resolve, STOP and report back before writing any code.

Come back here when the task is done and I'll review the output, provide the manual test checklist, and we'll move into Sprint 5 planning.
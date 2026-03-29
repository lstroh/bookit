Fix prompt — Cancellation policy block, Step 5
Read these files before writing any code:

1. public/templates/booking-wizard-v2-step-5.php — find the
   bookit-v2-policy-disclosure <details> element in Zone A; this
   is the only section being changed
2. public/assets/css/booking-wizard-v2.css — find all rules
   prefixed .bookit-v2-wizard-container .bookit-v2-policy-* ;
   these are the only CSS rules being changed
3. includes/api/class-wizard-api.php or whichever file reads the
   cancellation_policy_text setting for step 5 — confirm how
   $cancellation_policy_text is fetched and made available to
   the template
4. tests/unit/test-booking-wizard-v2.php — existing test
   patterns to follow

If any file does not exist, stop and report back.

---

## Goal

Replace the existing plain <details> cancellation policy
disclosure in Zone A of booking-wizard-v2-step-5.php with a
more prominent tinted notice block that shows the first sentence
of the policy always-visible and hides the rest behind a "See
full policy" expand link.

This is a two-file change only:
- booking-wizard-v2-step-5.php (template change)
- booking-wizard-v2.css (CSS change)

Do not modify any other file.

---

## PHP change — booking-wizard-v2-step-5.php

Find the existing <details class="bookit-v2-policy-disclosure">
block in Zone A and replace it entirely with the following
structure.

### PHP logic to add before the HTML block

Extract the first sentence from $cancellation_policy_text by
splitting at the first full stop followed by a space or
end-of-string:
```php
$policy_first_sentence = '';
$policy_remainder      = '';

if ( ! empty( $cancellation_policy_text ) ) {
    $dot_pos = strpos( $cancellation_policy_text, '. ' );
    if ( false !== $dot_pos ) {
        $policy_first_sentence = substr(
            $cancellation_policy_text, 0, $dot_pos + 1
        );
        $policy_remainder = trim(
            substr( $cancellation_policy_text, $dot_pos + 2 )
        );
    } else {
        // Single sentence — show all, no expand link
        $policy_first_sentence = $cancellation_policy_text;
        $policy_remainder      = '';
    }
}
```

### HTML structure to replace the existing <details> block

Only render this block if $cancellation_policy_text is non-empty.
```html
<?php if ( ! empty( $cancellation_policy_text ) ) : ?>
<div class="bookit-v2-policy-notice">
    <p class="bookit-v2-policy-notice__summary">
        <?php echo esc_html( $policy_first_sentence ); ?>
        <?php if ( ! empty( $policy_remainder ) ) : ?>
            <button
                type="button"
                class="bookit-v2-policy-expand-btn"
                aria-expanded="false"
                aria-controls="bookit-v2-policy-full">
                <?php esc_html_e( 'See full policy',
                    'bookit-booking-system' ); ?>
            </button>
        <?php endif; ?>
    </p>
    <?php if ( ! empty( $policy_remainder ) ) : ?>
    <p class="bookit-v2-policy-notice__full"
       id="bookit-v2-policy-full"
       hidden>
        <?php echo esc_html( $policy_remainder ); ?>
    </p>
    <?php endif; ?>
</div>
<?php endif; ?>
```

The expand/collapse is handled by a small inline <script> block
immediately after the closing </div> — do not add it to
booking-wizard-v2.js (that file should not be modified):
```html
<script>
(function() {
    var btn = document.querySelector(
        '.bookit-v2-policy-expand-btn'
    );
    if ( ! btn ) return;
    btn.addEventListener( 'click', function() {
        var full = document.getElementById(
            'bookit-v2-policy-full'
        );
        var expanded = btn.getAttribute(
            'aria-expanded'
        ) === 'true';
        if ( expanded ) {
            full.hidden = true;
            btn.setAttribute( 'aria-expanded', 'false' );
            btn.textContent = <?php echo wp_json_encode(
                __( 'See full policy', 'bookit-booking-system' )
            ); ?>;
        } else {
            full.hidden = false;
            btn.setAttribute( 'aria-expanded', 'true' );
            btn.textContent = <?php echo wp_json_encode(
                __( 'Hide full policy', 'bookit-booking-system' )
            ); ?>;
        }
    } );
} )();
</script>
```

---

## CSS change — booking-wizard-v2.css

Find and DELETE all existing rules for:
- .bookit-v2-wizard-container .bookit-v2-policy-disclosure
- .bookit-v2-wizard-container .bookit-v2-policy-disclosure summary
- .bookit-v2-wizard-container
  .bookit-v2-policy-disclosure summary::-webkit-details-marker
- .bookit-v2-wizard-container .bookit-v2-policy-chevron
- .bookit-v2-wizard-container
  .bookit-v2-policy-disclosure[open] .bookit-v2-policy-chevron
- .bookit-v2-wizard-container .bookit-v2-policy-body

Replace with the following new rules, added in the same location
in the file (after the deposit rows block, before Zone B):
```css
/* Cancellation policy notice block */
/* Fixed blue-grey values — informational signal, not theme token */
.bookit-v2-wizard-container .bookit-v2-policy-notice {
    background: #f0f4f8;
    border-left: 3.5px solid #5b7fa6;
    border-radius: var(--bookit-border-radius);
    padding: 0.875rem 1rem;
    margin-top: 12px;
}

.bookit-v2-wizard-container .bookit-v2-policy-notice__summary {
    font-size: 13px;
    color: #3d5a73;
    line-height: 1.55;
    margin: 0;
}

.bookit-v2-wizard-container .bookit-v2-policy-expand-btn {
    background: none;
    border: none;
    font-family: inherit;
    font-size: 12px;
    color: #5b7fa6;
    cursor: pointer;
    padding: 0;
    margin-left: 4px;
    text-decoration: underline;
    text-underline-offset: 2px;
}

.bookit-v2-wizard-container .bookit-v2-policy-expand-btn:hover {
    color: #3d5a73;
}

.bookit-v2-wizard-container .bookit-v2-policy-notice__full {
    font-size: 13px;
    color: #3d5a73;
    line-height: 1.55;
    margin: 8px 0 0;
}
```

---

## PHPUnit requirements

Baseline: 791 tests, 0 failures — must not regress.

Add tests to tests/unit/test-booking-wizard-v2.php:

- test_v2_step5_policy_notice_renders_when_policy_set:
  when $cancellation_policy_text is non-empty, output contains
  bookit-v2-policy-notice
- test_v2_step5_policy_notice_hidden_when_policy_empty:
  when $cancellation_policy_text is empty, bookit-v2-policy-notice
  absent from output
- test_v2_step5_policy_first_sentence_always_visible:
  output contains bookit-v2-policy-notice__summary with the first
  sentence of the policy text
- test_v2_step5_policy_expand_btn_present_when_multiple_sentences:
  multi-sentence policy → bookit-v2-policy-expand-btn present
- test_v2_step5_policy_expand_btn_absent_when_single_sentence:
  single-sentence policy → bookit-v2-policy-expand-btn absent

Run after implementation:
cd bookit-booking-system && vendor/bin/phpunit
All tests must pass before marking complete.

---

## Acceptance criteria

### Functional
- [ ] Policy notice block renders below the deposit/total rows
- [ ] First sentence of policy always visible without any tap
- [ ] "See full policy" button present when policy has 2+ sentences
- [ ] Tapping "See full policy" reveals remaining sentences
- [ ] Button label changes to "Hide full policy" when expanded
- [ ] No expand button when policy is a single sentence
- [ ] Block not rendered when cancellation_policy_text is empty

### Visual
- [ ] Block has light blue-grey background (#f0f4f8)
- [ ] Left border 3.5px solid muted blue (#5b7fa6)
- [ ] Border-radius matches --bookit-border-radius
- [ ] Text colour #3d5a73 (not --bookit-text-secondary)
- [ ] Visually distinct from but consistent with the amber
  waiver block in Step 4 — same structural pattern,
  different colour

### Technical
- [ ] No PHP warnings or notices
- [ ] No JavaScript console errors
- [ ] Old .bookit-v2-policy-disclosure CSS rules removed
- [ ] New CSS values are fixed (not --bookit-* tokens) —
  policy notice is an informational signal not a brand element
- [ ] booking-wizard-v2.js not modified
- [ ] PHPUnit suite passes (796+ tests, 0 failures)

### Must NOT break
- [ ] Zone A deposit rows unchanged
- [ ] Zone B and Zone C unchanged
- [ ] All existing Step 5 PHPUnit tests still pass
- [ ] Existing wizard v1 step 5 (booking-step-5-payment.php)
  unchanged

## Git commit message

Fix: Step 5 cancellation policy — prominent notice block

- Replace plain <details> disclosure with tinted notice block
- First sentence always visible; remainder behind expand link
- Blue-grey fixed colours (#f0f4f8 bg, #5b7fa6 border) —
  informational signal, not theme token
- Sentence splitting on first '. ' with single-sentence fallback
- Inline JS for expand/collapse with aria-expanded support
- 5 new PHPUnit tests in test-booking-wizard-v2.php

Tests: 796 passing, 0 failures

If you encounter an architecture decision not covered above,
or a conflict with existing code that this prompt does not
resolve, STOP and report back before writing any code.
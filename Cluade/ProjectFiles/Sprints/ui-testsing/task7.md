Two files need changing. Read both before touching either.
File 1: bookit-booking-system/includes/booking/class-booking-retriever.php
In get_booking_by_id(), the SELECT query is missing b.booking_reference. Add it to the SELECT list:
sqlb.booking_reference,
Place it after b.id in the column list. Same fix applies to get_booking_by_stripe_session() — add b.booking_reference to that SELECT list too.
File 2: bookit-booking-system/includes/email/class-email-sender.php
Confirm the booking reference detail row added in the previous task is still present in generate_customer_email(). If it was lost, re-add it after the Staff row:
php<?php if ( ! empty( $booking['booking_reference'] ) ) : ?>
<div class="detail-row">
    <span class="label"><?php esc_html_e( 'Booking ref:', 'booking-system' ); ?></span>
    <span class="value"><?php echo esc_html( $booking['booking_reference'] ); ?></span>
</div>
<?php endif; ?>
After both changes, run PHPUnit:
bashcd bookit-booking-system && vendor/bin/phpunit
Expected: 978 tests (or current baseline +2), 0 failures. Report the exact count.
Do not run the Playwright test — report back with the PHPUnit result.
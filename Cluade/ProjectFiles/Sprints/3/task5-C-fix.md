# Fix: Price Display NaN & Double Dashboard in URL

Two issues to fix in BookingModal.vue:

## Issue 1: Service prices show "NaN"

### Add formatPrice helper method

In the `<script setup>` section, add this method after the other methods (around line 540):
```javascript
const formatPrice = (price) => {
  const num = parseFloat(price)
  return isNaN(num) ? '0.00' : num.toFixed(2)
}
```

### Update Step 2 template (Service Selection)

Find this section (around line 70):

**Change this:**
```vue
<div class="font-semibold text-gray-900">
  £{{ parseFloat(service.price).toFixed(2) }}
</div>
```

**To this:**
```vue
<div class="font-semibold text-gray-900">
  £{{ formatPrice(service.price) }}
</div>
```

### Update Step 5 template (Payment Summary)

Find this section (around line 350):

**Change this:**
```vue
<span class="text-lg font-semibold text-gray-900">£{{ parseFloat(bookingData.service?.price || 0).toFixed(2) }}</span>
```

**To this:**
```vue
<span class="text-lg font-semibold text-gray-900">£{{ formatPrice(bookingData.service?.price) }}</span>
```

Also find (around line 380):

**Change this:**
```vue
<p class="text-xs text-gray-500 mt-1">
  Full amount: £{{ parseFloat(bookingData.service?.price || 0).toFixed(2) }}
</p>
```

**To this:**
```vue
<p class="text-xs text-gray-500 mt-1">
  Full amount: £{{ formatPrice(bookingData.service?.price) }}
</p>
```

## Issue 2: Timeslots API URL has double "dashboard"

The error shows URL: `/dashboard/dashboard/timeslots` which should be `/dashboard/timeslots`

### Fix loadTimeslots method

Find the `loadTimeslots` method (around line 510):

**Change this line:**
```javascript
const response = await api.get(`/timeslots?${params.toString()}`)
```

**To this:**
```javascript
const response = await api.get(`timeslots?${params.toString()}`)
```

Remove the leading `/` because the apiBase already includes `/dashboard`.

## Testing

After applying both fixes:

**Test Issue 1 (Price):**
1. Open modal
2. Go to Step 2 (Services)
3. Should see prices like "£45.00" not "NaN"

**Test Issue 2 (Timeslots):**
1. Complete Steps 1-3
2. Go to Step 4
3. Select a date
4. Should load timeslots without 404 error
5. Check Network tab - URL should be:
   `http://plugin-test-1.local/wp-json/bookit/v1/dashboard/timeslots?date=...`
   (Single "dashboard", not double)
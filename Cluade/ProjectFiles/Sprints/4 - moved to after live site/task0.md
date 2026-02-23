Got what I need. Let me kick this off properly.

---

```
Sprint 4 Progress: 0/8 tasks complete

⏭️ Task 0: ngrok Setup (1h) — NEXT
□  Task 1: Google Cloud Setup (1h)
□  Task 2: Database Migration + Config Class (3h)
□  Task 3: Google OAuth Flow — Backend (6h)
□  Task 4: Google OAuth Flow — Frontend (4h)
□  Task 5: Calendar API Service Class (5h)
□  Task 6: Booking Integration (4h)
□  Task 7: PHPUnit Tests (6h)
□  Task 8: Manual Testing & Polish (3h)

Hours Completed: 0 / 33
```

---

## Sprint 4 Overview

Here's what this sprint will deliver by the end:

**Staff connect their Google account** from the dashboard (Settings page for admin role, MyProfile for staff role). Once connected, every booking automatically creates a Google Calendar event for the assigned staff member — complete with customer name, phone, email, service, and a 15-minute popup reminder. When a booking is cancelled or rescheduled from the dashboard, the event is updated or deleted accordingly.

The critical constraint throughout: **calendar sync never blocks bookings**. If Google's API is down, the booking still succeeds — the sync just gets logged as failed.

One important thing to tackle first: since you're developing locally with Local by Flywheel, Google OAuth can't redirect back to `localhost`. You'll use **ngrok** to create a temporary public tunnel so the OAuth flow actually works during development.

---

## Task 0: ngrok Setup

This is all manual — no Cursor code generation needed.

**What you're doing:** Creating a public HTTPS URL that tunnels to your local WordPress site, so Google can redirect back to it during OAuth.

**Step 1 — Install ngrok**

Go to [ngrok.com](https://ngrok.com) and create a free account, then download and install ngrok. On Mac:

```bash
brew install ngrok/ngrok/ngrok
```

Or download the binary directly from their site.

**Step 2 — Authenticate ngrok**

After signing up, get your auth token from the ngrok dashboard and run:

```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

**Step 3 — Find your Local by Flywheel port**

Open Local by Flywheel, select your Bookit site, and check what port it's running on. It's usually `80` but sometimes `10003` or similar. You can also find it in the site's SSL settings — if SSL is on, note the HTTPS port.

**Step 4 — Start the tunnel**
http://plugin-test-1.local/
```bash
ngrok http 80
```

(Replace `80` with your actual port if different.)

ngrok will display something like:

```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:80
```

**Step 5 — Note your ngrok URL**

Copy the `https://...ngrok-free.app` URL. This will be your redirect URI for Google OAuth. It looks like:

```
https://abc123.ngrok-free.app/wp-json/bookit/v1/google/callback
```

**Important caveat:** Free ngrok URLs change every time you restart ngrok. When that happens, you'll need to update the redirect URI in Google Cloud Console (Task 1) and in your `wp-config.php`. Paid ngrok gives you a stable URL — worth considering if you find the rotating URLs annoying.

**Step 6 — Test the tunnel**

Open your ngrok URL in a browser. You should see your WordPress site load (possibly with an ngrok interstitial warning page on first load — just click through). If you see your site, the tunnel is working.

---

**Testing Checklist for Task 0:**

- [ ] ngrok installed and authenticated
- [ ] Tunnel running (`ngrok http [port]`)
- [ ] WordPress site loads at the ngrok HTTPS URL
- [ ] Noted the full ngrok URL (you'll need it for Task 1)

---

Once that's working, report back with "Task 0 complete ✅" and your ngrok URL format, and I'll walk you through Task 1 (Google Cloud Console setup — also manual, no Cursor needed).
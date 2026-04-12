# Bookit — Google Calendar Setup Guide
**Version:** 1.2
**Scope:** One-time setup per client installation
**Audience:** Developer (Liron) performing onboarding for each new Bookit client

---

## PURPOSE

This document is the authoritative step-by-step guide for setting up Google Calendar
integration for a new Bookit client. Follow it exactly for every new client installation.

**Key principle:** Only the developer follows this guide. Staff members never touch
Google Cloud Console. Once the developer completes this setup and enters the credentials
into plugin Settings, each staff member simply clicks "Connect Google Calendar" in
their own profile page.

---

## WHO DOES WHAT

| Action | Who | How Often |
|---|---|---|
| This entire guide (Google Cloud Console) | Developer | Once per client |
| Add each staff member as a Test User (Step 3b) | Developer | Once per staff member |
| Enter Client ID + Secret in plugin Settings | Developer | Once per client |
| Connect their own Google account | Each staff member | Once per staff member |
| Reconnect if token is revoked | Each staff member | Only if needed |

---

## BEFORE YOU START — INFORMATION TO COLLECT

Have the following ready before opening Google Cloud Console:

- **Client root domain** — e.g. `clientdomain.co.uk` (root only, no subdomain)
- **Client WordPress URL** — e.g. `https://test.clientdomain.co.uk` (full URL including subdomain if applicable)
- Your email address (used for support and developer contact fields)

---

## STEP 1 — Create a Google Cloud Project

1. Go to [https://console.cloud.google.com](https://console.cloud.google.com)
2. Click the project dropdown at the top → **New Project**
3. **Project name:** `Bookit Calendar — [Client Name]`
4. Click **Create** and wait for it to finish
5. Confirm the new project is selected in the dropdown before continuing

---

## STEP 2 — Enable Google Calendar API

1. In the left menu go to **APIs & Services → Library**
2. Search for `Google Calendar API`
3. Click the result → click **Enable**
4. Wait for the confirmation page before continuing

---

## STEP 3 — Configure the OAuth Consent Screen

1. Go to **APIs & Services → OAuth consent screen**
2. Select **External** → click **Create**
3. Fill in the App Information form:

| Field | Value |
|---|---|
| App name | `Bookit Booking System` |
| User support email | Your email address |
| Developer contact email | Your email address |

4. Scroll down to the **App domain** section (optional fields for home page, privacy
   policy, terms of service). You do not need to fill these in, but the
   **Authorised domains** field appears directly below this section.

> **Finding Authorised domains:** It is located below the App domain block on the
> same page. If it is not visible, enter any URL in the Application home page field
> first — this causes the Authorised domains field to appear. The field is optional;
> if you cannot locate it, skip it and continue — the OAuth flow will still work.

5. If the Authorised domains field is visible, click **+ Add domain** and enter the
   client's root domain only — e.g. `clientdomain.co.uk`

> **Root domain only:** Enter the root domain without subdomain. Google automatically
> covers all subdomains. Example: enter `clientdomain.co.uk` — this covers
> `test.clientdomain.co.uk`, `www.clientdomain.co.uk`, etc.

6. Click **Save and Continue**
7. On the **Scopes** step, click **Add or Remove Scopes**
8. Search for and add: `https://www.googleapis.com/auth/calendar.events`
9. Click **Update** → **Save and Continue**
10. On the **Test users** step — do NOT skip this. See Step 3b below.
11. Click **Save and Continue** → **Back to Dashboard**

> **Testing mode warning:** The app will be in Testing mode. Staff members will see
> a "Google hasn't verified this app" warning screen. They must click
> **Advanced → Continue** to proceed. This is normal and expected. Do not be
> alarmed by this. The app can be submitted for Google verification later if needed.

---

## STEP 3b — Add Test Users

This is a required step. Google blocks any user from connecting their Google account
unless they are explicitly added to the Test Users list. This applies even to you
as the developer.

**When to add users:**
- During initial setup: add yourself and any staff members you know upfront
- When a new staff member joins: return to this step and add their Gmail address

**How to add test users:**

1. Go to **APIs & Services → OAuth consent screen**
2. Click **Edit App**
3. Click through to the **Test users** step (third step in the wizard), or scroll
   down to the Test users section if it is visible on the summary page
4. Click **+ Add users**
5. Enter the Gmail address of the staff member who will connect their Google Calendar
6. Click **Add** → **Save**

> **Important:** The email entered here must be the Gmail address the staff member
> will use when they click "Connect Google Calendar". If they connect with a different
> Google account, they will see the "Access blocked" error.

> **Limit:** Up to 100 test users are allowed in Testing mode. This is sufficient
> for all Bookit client installations. If a client has more than 100 staff members,
> contact Google to publish the app.

> **"Access blocked: has not completed the Google verification process" error:**
> This means the staff member's Gmail address is not on the Test Users list.
> Add their email following the steps above and ask them to try again.

---

## STEP 4 — Create the OAuth 2.0 Client ID

1. Go to **APIs & Services → Credentials**
2. Click **+ Create Credentials → OAuth client ID**
3. **Application type:** `Web application`
4. **Name:** `Bookit Web Client`
5. Under **Authorised redirect URIs**, click **+ Add URI** and enter:

```
https://[client-wordpress-url]/wp-json/bookit/v1/google-calendar/callback
```

Replace `[client-wordpress-url]` with the client's actual WordPress URL including
subdomain if applicable. Example:

```
https://test.clientdomain.co.uk/wp-json/bookit/v1/google-calendar/callback
```

> **Redirect URI vs Authorised domain:** The redirect URI uses the full URL including
> subdomain. This is different from the Authorised domain in Step 3 which uses the
> root domain only. Both are correct.

> **Exact match required:** The redirect URI must match character-for-character what
> the plugin sends to Google. Check for: trailing slashes, http vs https, www vs
> non-www. Any mismatch causes a `redirect_uri_mismatch` error.

6. Click **Create**

---

## STEP 5 — Save the Credentials

A dialog appears with the Client ID and Client Secret. Copy both immediately.

| Credential | Sensitivity | Where it goes |
|---|---|---|
| Client ID | Not sensitive — can be stored in notes | Plugin → Settings → Google Client ID |
| Client Secret | **Sensitive — store in password manager only** | Plugin → Settings → Google Client Secret |

Click **OK**. You can retrieve these again later from **APIs & Services → Credentials**
if needed.

---

## STEP 6 — Enter Credentials in Plugin Settings

1. Log into the client's WordPress dashboard
2. Go to **Bookit → Settings → Integrations → Google Calendar**
3. Paste the **Client ID** into the Google Client ID field
4. Paste the **Client Secret** into the Google Client Secret field
5. Click **Save Settings**

After this step, staff members can connect their own Google accounts via
**My Profile → Google Calendar → Connect Google Calendar**. No further setup is
needed from the developer.

---

## COMPLETION CHECKLIST

Run through this checklist before closing out the client onboarding.

- [ ] Google Cloud project created — name includes client identifier
- [ ] Google Calendar API enabled — status shows Enabled in API Library
- [ ] OAuth consent screen configured — scope `calendar.events` added
- [ ] Authorised domain added (or confirmed not required) — root domain only
- [ ] All known staff Gmail addresses added as Test Users (Step 3b)
- [ ] OAuth Client ID created — type: Web application
- [ ] Redirect URI added — full URL including subdomain, exact match to plugin
- [ ] Client ID saved securely
- [ ] Client Secret saved in password manager
- [ ] Both credentials entered in plugin Settings (Bookit → Settings)
- [ ] Test: one staff member connected their Google account successfully
- [ ] Test: a test booking created and event appeared in connected Google Calendar

---

## TROUBLESHOOTING

### `Access blocked: has not completed the Google verification process`
The staff member's Gmail address is not on the Test Users list. Go to
**APIs & Services → OAuth consent screen → Edit App → Test users** and add
their Gmail address. Ask them to try connecting again after being added.

### Staff see "Google hasn't verified this app"
Expected behaviour in Testing mode. Staff must click **Advanced → Continue**.
This is safe. Submit the app for Google verification later if the client requests it.

### `redirect_uri_mismatch` error
The redirect URI in Google Cloud Console does not exactly match what the plugin
is sending. Check for:
- Trailing slash differences
- `http` vs `https`
- `www` vs non-www
- Subdomain included in redirect URI but not matching the WordPress URL

Fix: Go to **APIs & Services → Credentials → Edit** the OAuth client, and correct
the redirect URI to match exactly.

### `invalid_client` error when staff try to connect
The Client ID or Client Secret in plugin Settings is incorrect. Re-copy both values
from **APIs & Services → Credentials** in Google Cloud Console and re-save in
plugin Settings.

### Events not appearing in Google Calendar after booking
Check in order:
1. Staff member's profile shows **Connected** status in My Profile → Google Calendar
2. Booking status is **Confirmed** or **Pending Payment** (not Cancelled or Draft)
3. Check Bookit audit log for `google_calendar.sync_failed` entries
4. Verify the `google_calendar_event_id` column is populated on the booking record

### Staff cannot find the "Connect Google Calendar" button
The Google Calendar section appears in **My Profile** only after the developer has
completed Step 6 (credentials entered in plugin Settings). If credentials are missing,
the section does not render.

---

## NOTES FOR FUTURE CLIENTS

- Each client needs their own Google Cloud project (different redirect URIs per domain)
- The Google Cloud project name should always include the client name for easy identification
- Store each client's credentials in a dedicated entry in the password manager
- The OAuth app stays in Testing mode indefinitely for small installations — this is fine
- When a new staff member joins the client, remember to add their Gmail to the Test Users list (Step 3b)
- Keep a record of which Gmail addresses have been added as Test Users for each client
- If a client moves to a new domain, a new redirect URI must be added in Google Cloud
  Console (old URI can remain — multiple URIs are allowed)

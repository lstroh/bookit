Task 1 is a manual setup step in Google Cloud Console — no code involved. Here are the step-by-step instructions:

---

# TASK 1 OF 8: Google Cloud Console Setup
**Sprint: 6B-1 | Manual steps only — no code**

---

## STEP 1 — Create a new Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click the project dropdown at the top → **New Project**
3. Name it: `Bookit Calendar`
4. Click **Create** and wait for it to initialise
5. Make sure the new project is selected in the dropdown before continuing

---

## STEP 2 — Enable the Google Calendar API

1. In the left menu go to **APIs & Services → Library**
2. Search for `Google Calendar API`
3. Click it → click **Enable**

---

## STEP 3 — Configure the OAuth Consent Screen

1. Go to **APIs & Services → OAuth consent screen**
2. Select **External** → click **Create**
3. Fill in the form:
   - **App name:** `Bookit Booking System`
   - **User support email:** your email address
   - **Authorised domains:** `wimbledonsmart.co.uk`
   - **Developer contact email:** your email address
4. Click **Save and Continue**
5. On the **Scopes** step, click **Add or Remove Scopes**
6. Search for and add: `https://www.googleapis.com/auth/calendar.events`
7. Click **Update** → **Save and Continue**
8. On the **Test users** step — skip for now (you can add yourself later)
9. Click **Save and Continue** → **Back to Dashboard**

> ⚠️ Your app will be in **Testing** mode. This is fine for the live test site. Users (staff members) will see a "Google hasn't verified this app" warning screen — they must click **Advanced → Continue** to proceed. You can publish the app later if needed.

---

## STEP 4 — Create the OAuth 2.0 Client ID

1. Go to **APIs & Services → Credentials**
2. Click **+ Create Credentials → OAuth client ID**
3. **Application type:** `Web application`
4. **Name:** `Bookit Web Client`
5. Under **Authorised redirect URIs**, click **+ Add URI** and enter:
   ```
   https://test.wimbledonsmart.co.uk/wp-json/bookit/v1/google-calendar/callback
   ```
6. Click **Create**

---

## STEP 5 — Copy Your Credentials

A dialog will appear showing your credentials. **Copy and save both:**

| Field | Where to save it |
|---|---|
| **Client ID** | Notepad / password manager — goes into plugin Settings later |
| **Client Secret** | Password manager — treat as sensitive, goes into plugin Settings later |

Click **OK** to close the dialog. You can always retrieve them again from **APIs & Services → Credentials**.

---

## VERIFICATION CHECKLIST

Before reporting back and starting Task 2:

- [ ] Project `Bookit Calendar` created and selected
- [ ] Google Calendar API enabled
- [ ] OAuth consent screen configured with scope `calendar.events`
- [ ] Authorised domain `wimbledonsmart.co.uk` added
- [ ] OAuth 2.0 Client ID created (Web application type)
- [ ] Redirect URI `https://test.wimbledonsmart.co.uk/wp-json/bookit/v1/google-calendar/callback` added
- [ ] Client ID and Client Secret copied and stored safely

---

Once all boxes are checked, report back and I'll provide the **Task 2 Cursor prompt** for DB migrations and Composer setup.
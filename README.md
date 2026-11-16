# Ekey Realty — Invoice & Expense Tracker

A single-file tracker (`index.html`) with a live dashboard, automations, pop-up notifications, a built-in calendar and a monthly profit report. It doesn't need a build step or a server.

---

## 1. Put it on GitHub Pages (about 3 minutes)

1. On github.com, click **New repository**, name it e.g. `invoice-tracker`, set it to **Private** or **Public**, and create it.
2. Click **Add file → Upload files**, drag in `index.html` (and this README), then **Commit**.
3. Go to **Settings → Pages**, set Source to **Deploy from a branch**, set Branch to **main / (root)**, then **Save**.
4. After about a minute, your link appears: `https://<your-username>.github.io/invoice-tracker/`
5. Send that link to your coworker. Pin it as a browser tab.

> Private repos need a paid GitHub plan for Pages. If yours is free, make the repo public. The data is never stored in the repo, only in each browser (or in your Google Drive if you set up step 2).

### Updating the tracker later
Open the repo → click `index.html` → pencil icon (or **Add file → Upload files** and drop in the new `index.html`) → **Commit changes**. The site refreshes within a minute or two. Your data is **not** affected, because it lives in the browser and Google Drive, not in the file.

## 2. Share one live tracker between both of you (recommended)

Without this, each browser keeps its **own** copy of the data. To share one set of data:

1. Create a Google Sheet, e.g. "Invoice Tracker — live".
2. Go to **Extensions → Apps Script** and paste in all of `apps-script.gs`. Change `SECRET` to a long phrase.
3. Click the **gear icon (Project Settings)** and set your time zone.
4. Go to **Deploy → New deployment → Web app**. Set Execute as **Me** and Who has access **Anyone**. Click Deploy and authorize.
5. Copy the URL that ends in `/exec`.
6. In the tracker, go to **Settings → Team sync**, paste the URL and the same SECRET, then click **Sync now**. Your coworker does the same on her computer.

> **Changed the script later?** In Apps Script: **Deploy → Manage deployments → pencil → Version: New version → Deploy**. The URL stays the same.

Once it's set up:

- Changes sync automatically within a couple of seconds, plus every 90 seconds.
- The Google Sheet gets **Invoices**, **Expenses** and **Monthly** tabs that update by themselves, so Eric can open the Sheet any time.
- A **"Ekey Realty reminders"** Google Calendar is created. Every open reminder goes on it with a 15-minute pop-up, and it's removed when marked done. In Google Calendar, share that calendar with your coworker once.

## 3. Calendar reminders: options

| Option | Best for |
|---|---|
| **Team sync (above)** | Fully automatic. Reminders show up in Google Calendar on both phones. |
| **G / O buttons** next to every reminder | Sending one important date to Google Calendar or Outlook |
| **Calendar → Export .ics** | Bulk import into Google, Outlook or Apple Calendar. Import into a separate "Invoices" calendar. |
| **Settings → Desktop notifications** | Pop-ups on the computer while the tab is open |
| **Calendar → Suggested rhythms** | Monday approval sweep, Friday payment chase, month-end close. These repeat by themselves. |

## What runs automatically

- **Net profit** for each job, for each month and for the year (amount invoiced − vendor cost − any expenses linked to that job).
- **New bill**: a seller-approval check reminder is created (default: 5 days).
- **Seller approved**: an expected-payment date and reminder are set (default: 14 days).
- **Rejected**: a resubmit reminder is set for 2 days later.
- **Payment received**: all of that bill's reminders close, it's stamped PAID and its profit is locked in.
- **Partial payment**: the bill shows "Partially paid". The balance keeps being chased with its own reminder.
- **Short-pay** (servicer pays less than billed): profit drops by the shortfall. The bill stays flagged until you **Accept short-pay** or log a dispute.
- **Client paid but vendor not paid yet**: a pay-vendor reminder is created and an alert stays up until **Vendor paid** is on.
- **Heads-up alerts**: approval pending too long, payment overdue, no contact in X days, invoice copy missing, losing or thin-margin jobs.
- **Live pop-ups**: when a new alert appears or a reminder comes due. Each has one-click actions.
- **Recurring reminders**: marking one done schedules the next one.

You can change all the thresholds in **Settings → Automations**.

## Aging & vendors

- **Aging** page: every unpaid balance in 0–30 / 31–60 / 61–90 / 91–120 / 120+ day buckets, by client. Click a client to see their bills with **Chase** and **Payment** buttons. Switch to **Owed to vendors** for the same view of contractor payouts.
- **Expenses** page: what's owed to each vendor, with a one-click **Mark paid** for all of a vendor's jobs that month.
- **Invoice PDFs**: once Team sync is connected, drop the PDF on the invoice form (or use **Upload invoice PDF** in the side panel). It's saved to a "Ekey Realty — invoice copies" Drive folder, one sub-folder per month, and the link fills in by itself. Share that folder with your coworker once.

## Daily use

- **Yvonne** logs each bill: client, input date, type of service, the invoicing system it was billed in, amount invoiced, vendor cost and the Google Drive link to the invoice copy.
- **Eric** flips **Payment received** once the money is actually in the bank. If it's short or partial, he uses **Record a payment** instead.
- Whoever pays the contractor flips **Vendor paid**.
- Anyone can log a contact with the speech-bubble button on any row. That updates **Last contact**.
- **Monthly report** shows each job's profit and the month's net. You can print it to PDF or export it as CSV.

Keyboard shortcuts: `N` new invoice · `E` expense · `R` reminder · `Ctrl K` search · `Esc` close

## Your data

- Back up with **Settings → Export**, which saves a JSON file. **Import** merges a backup back in.
- **Start fresh** removes the sample data. Your settings and colours stay.

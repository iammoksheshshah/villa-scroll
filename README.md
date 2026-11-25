This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Contact form (EmailJS + Google Sheet)

The contact form validates on the client, includes a math captcha and a honeypot, and sends
enquiries to `mintushah94@gmail.com` through [EmailJS](https://www.emailjs.com).

1. Create a free EmailJS account and connect the Gmail address as a service (note the **Service ID**).
2. Create an email template with:
   - **To email:** `{{to_email}}`
   - **Reply to:** `{{reply_to}}`
   - **Subject:** e.g. `New enquiry — {{project_type}}`
   - **Body:** include `{{user_name}}`, `{{user_email}}`, `{{phone}}`, `{{project_type}}`, `{{message}}`, `{{time}}`
3. Fill in `NEXT_PUBLIC_EMAILJS_SERVICE_ID`, `NEXT_PUBLIC_EMAILJS_TEMPLATE_ID` and
   `NEXT_PUBLIC_EMAILJS_PUBLIC_KEY` in `.env.local`, then restart the dev server.

Until those values are set, submitting the form opens the visitor's mail app with the
enquiry pre-filled instead of failing silently.

### Logging enquiries to Google Sheets

Every successful submission is also appended to a Google Sheet through
`app/api/enquiry`. The route forwards the enquiry to a Google Apps Script web app, so no
OAuth client or service account is needed.

1. Create a Google Sheet and note the tab name (the script below uses `Enquiries`, and
   creates it if missing).
2. In the sheet, open **Extensions → Apps Script** and paste:

   ```js
   const SHEET_NAME = 'Enquiries';

   function doPost(e) {
     const data = JSON.parse(e.postData.contents);
     const book = SpreadsheetApp.getActiveSpreadsheet();
     const sheet = book.getSheetByName(SHEET_NAME) || book.insertSheet(SHEET_NAME);

     if (sheet.getLastRow() === 0) {
       sheet.appendRow(['Received', 'Name', 'Email', 'Phone', 'Project', 'Message']);
     }

     sheet.appendRow([
       new Date(data.submittedAt || Date.now()),
       data.name,
       data.email,
       data.phone,
       data.project,
       data.message,
     ]);

     return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(
       ContentService.MimeType.JSON
     );
   }
   ```

3. **Deploy → New deployment → Web app**, set *Execute as* to **Me**, *Who has access* to
   **Anyone**, then deploy and copy the web app URL.
4. Add it to `.env.local` (server-side, no `NEXT_PUBLIC_` prefix):

   ```bash
   GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/…/exec
   ```

   Optionally set `GOOGLE_SHEETS_SECRET` and check `data.secret` in the script. Restart the
   dev server after changing env values. Without the URL the form still sends email; the
   sheet write is skipped.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

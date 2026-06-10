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

## Research Data Sharing

The self-assessment can send a JSON file with the participant's answers, scores,
priorities, consent, and contextual questions to a research mailbox. The server
temporarily stages each JSON file in private Vercel Blob storage, sends it as an
email attachment, and deletes the temporary blob immediately after successful
email delivery.

Configure these environment variables in Vercel:

```bash
BLOB_READ_WRITE_TOKEN="..."
RESEND_API_KEY="..."
RESEARCH_EMAIL_FROM="AI Readiness <submissions@your-verified-domain.example>"
RESEARCH_EMAIL_TO="thomas.hillman@ait.gu.se"
RESEARCH_EMAIL_SUBJECT="AI Readiness research data submission"
```

`RESEARCH_EMAIL_TO` defaults to `thomas.hillman@ait.gu.se` if it is not set.

Recommended production setup:

1. Create/connect a private Vercel Blob store for the project.
2. Add Resend to the project and verify the sending domain.
3. Send submissions to a dedicated research mailbox.
4. In Power Automate, create a non-premium Outlook flow:
   - Trigger: when a new email arrives in the research mailbox.
   - Filter: subject equals the configured research submission subject.
   - For each attachment: create the file in the approved SharePoint/OneDrive
     research folder.
   - Optionally move the email to a processed folder or delete it after saving.

The user experience stays one-step: after consent and context questions, the user
clicks "Send research data." The JSON file should only remain in Vercel Blob for
the duration of the server request. If email delivery or blob cleanup fails, the
user sees an error instead of a success message.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# Research data: storage and export

## How it works

When a participant consents and submits on the results page, the app POSTs the
submission to `/api/share-results`, which stores it as a single immutable JSON
object in **Vercel Blob** under the `research-submissions/` prefix. No email,
no third-party storage.

Each record includes a `flat` block — a fixed set of keys (metadata, context,
per-orientation scores, per-question responses) that map directly to CSV
columns.

The data is anonymous: no name, email, or organisation identifier is collected,
and consent is required (enforced server-side) before anything is stored.

## Downloading the dataset

There is an **Export** button in the top navigation bar (download icon, next to
the language toggle). Clicking it prompts for a password and, on success,
downloads the full dataset as a CSV (`ai-readiness-data-<date>.csv`).

- One row per submission, sorted by submission time.
- Columns grouped: metadata → orientation scores → question responses.
- UTF-8 with a BOM, so Excel renders Swedish characters correctly.

The export endpoint is `POST /api/export`; it returns `401` unless the request
body contains the correct `password`.

## Configuration (Vercel project env)

| Variable | Purpose |
| --- | --- |
| `BLOB_READ_WRITE_TOKEN` | Read/write access to the Blob store. Auto-added when a Blob store is connected to the project. |
| `RESEARCH_EXPORT_PASSWORD` | Password required to download the CSV. Change it anytime in Project → Settings → Environment Variables (redeploy to apply). |

## Notes on storage privacy

The Blob store is configured with **private** access: submissions are written
with `put(..., { access: "private" })` and can only be read back with the Blob
token, which only the server holds (the export endpoint uses `get()` to read
them). The objects are not accessible via public URL. Combined with the fact
that no identifying data is collected, this keeps the dataset both anonymous
and access-controlled.

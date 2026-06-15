# Assembling submissions into a SharePoint dataset (no manual steps)

Each completed research submission is emailed to the configured research
mailbox as a JSON attachment (via Resend). This guide turns those emails into a
single **SharePoint List** — a browsable, Excel-exportable table — fully
automatically with Power Automate. Everything stays inside GU's Microsoft 365
tenant; no third-party storage and no Azure app registration are required.

The app includes a `flat` object in every submission (a fixed set of 45 keys),
so the Power Automate step is a direct key-to-column mapping with no array
iteration.

## What you get

One row per submission, with columns for:

- **Metadata:** `submittedAt`, `sessionId`, `locale`
- **Context:** `schoolOrg`, `schoolOrgOther`, `role`, `principal`,
  `municipalitySize`, `privateSchoolSize`
- **Scores per orientation** (ANA, EFF, KNO, SUP, TEC):
  `score_<ORI>` (0–100 %), `avg_<ORI>` (mean Likert), `priority_<ORI>`
- **Each question response:** `q_ana_1` … `q_tec_4` (20 columns)

## Step 1 — Create the SharePoint List

Fastest path (creates all 45 columns at once):

1. Open the SharePoint site → **New → List → From Excel**.
2. Upload `docs/sharepoint-list-template.xlsx` (in this repo).
3. Confirm the column types when prompted (set the `score_*`, `avg_*`,
   `priority_*`, and `q_*` columns to **Number**; leave the rest as
   **Single line of text**).
4. Name the list e.g. **AI Readiness Submissions** and create it.
5. Delete the single blank starter row.

(Alternatively, create an empty list and add the columns by hand using
`docs/sharepoint-columns.csv` as the column list.)

## Step 2 — Create the Power Automate flow

1. Go to https://make.powerautomate.com → **Create → Automated cloud flow**.
2. Trigger: **When a new email arrives (V3)** (Office 365 Outlook).
   - **Folder:** Inbox (or wherever the submissions land)
   - **Subject Filter:** `AI Readiness research data submission`
   - **Include Attachments:** Yes
   - **Only with Attachments:** Yes
3. Add **Apply to each** → output selected: **Attachments**.
4. Inside the loop, add **Compose** (Data Operation). In the input box use
   *Expression*:
   `base64ToString(items('Apply_to_each')?['contentBytes'])`
5. Add **Parse JSON** (Data Operation).
   - **Content:** the `Outputs` of the Compose step above
   - **Schema:** paste the contents of `docs/power-automate-schema.json`
6. Add **Create item** (SharePoint).
   - **Site Address / List Name:** the list from Step 1
   - For each column, map the matching value from Parse JSON, e.g.
     `body('Parse_JSON')?['flat']?['submittedAt']`,
     `body('Parse_JSON')?['flat']?['score_ANA']`,
     `body('Parse_JSON')?['flat']?['q_ana_1']`, …
7. **Save**, then submit a test response from the app to confirm a row appears.

All connectors used (Outlook V3 trigger, Data Operations, SharePoint Create
item) are standard — no premium Power Automate licence needed.

## Step 3 — Use the dataset

- Browse/filter rows directly in the SharePoint List.
- **Export to Excel** (or **CSV**) from the list command bar anytime.
- For repeatable analysis, connect from Excel via **Data → Get Data → From
  SharePoint Online List** and **Refresh** on demand.

## Notes

- The JSON attachment still contains the full nested `results` and `answers`
  arrays (with question text and labels) if you ever need richer detail than
  the flat columns provide.
- There is no `consentGiven` column: data is only ever collected when consent
  is given (enforced server-side), so the value would be constant. Consent is
  still recorded under `context.consentGiven` in the JSON attachment for the
  audit trail.
- Schema version of the payload is `1.1.0` (the version that added `flat`).

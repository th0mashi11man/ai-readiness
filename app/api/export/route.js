import { list, get, del } from "@vercel/blob";
import { timingSafeEqual } from "crypto";

export const runtime = "nodejs";

const SUBMISSIONS_PREFIX = "research-submissions/";

const META_ORDER = [
    "submittedAt",
    "sessionId",
    "locale",
    "schoolOrg",
    "schoolOrgOther",
    "role",
    "principal",
    "municipalitySize",
    "privateSchoolSize",
];

function passwordOk(provided) {
    const expected = process.env.RESEARCH_EXPORT_PASSWORD;
    if (!expected || typeof provided !== "string") {
        return false;
    }
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    if (a.length !== b.length) {
        return false;
    }
    return timingSafeEqual(a, b);
}

// Group columns: metadata (fixed order) → scores → question responses → other.
function columnRank(key) {
    const metaIndex = META_ORDER.indexOf(key);
    if (metaIndex !== -1) return [0, metaIndex];
    if (/^(score|avg|priority)_/.test(key)) return [1, 0];
    if (/^q_/.test(key)) return [2, 0];
    return [3, 0];
}

function compareColumns(a, b) {
    const ra = columnRank(a);
    const rb = columnRank(b);
    return ra[0] - rb[0] || ra[1] - rb[1] || a.localeCompare(b);
}

function csvEscape(value) {
    if (value === null || value === undefined) return "";
    const s = String(value);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function buildCsv(records) {
    if (records.length === 0) {
        return "No submissions yet";
    }

    const keys = new Set();
    records.forEach((record) => Object.keys(record).forEach((key) => keys.add(key)));
    const columns = Array.from(keys).sort(compareColumns);

    const lines = [columns.map(csvEscape).join(",")];
    records.forEach((record) => {
        lines.push(columns.map((column) => csvEscape(record[column])).join(","));
    });

    // Prepend a UTF-8 BOM so Excel renders Swedish characters correctly.
    return "﻿" + lines.join("\r\n");
}

export async function POST(request) {
    let body = {};
    try {
        body = await request.json();
    } catch {
        body = {};
    }

    if (!passwordOk(body?.password)) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return Response.json({ error: "Storage not configured" }, { status: 500 });
    }

    // TEMP: one-off purge of diagnostic test rows by pathname substring.
    if (typeof body?.purge === "string" && body.purge) {
        const deleted = [];
        let cursor;
        do {
            const result = await list({ prefix: SUBMISSIONS_PREFIX, cursor, limit: 1000 });
            for (const blob of result.blobs) {
                if (blob.pathname.includes(body.purge)) {
                    await del(blob.url);
                    deleted.push(blob.pathname);
                }
            }
            cursor = result.cursor;
        } while (cursor);
        return Response.json({ deleted });
    }

    try {
        // List every stored submission (paginated).
        const blobs = [];
        let cursor;
        do {
            const result = await list({ prefix: SUBMISSIONS_PREFIX, cursor, limit: 1000 });
            blobs.push(...result.blobs);
            cursor = result.cursor;
        } while (cursor);

        // Read and flatten each submission. The store is private, so blobs must
        // be read with an authenticated get() rather than a plain URL fetch.
        const records = [];
        for (const blob of blobs) {
            try {
                const result = await get(blob.pathname, { access: "private", useCache: false });
                if (!result || !result.stream) continue;
                const text = await new Response(result.stream).text();
                const data = JSON.parse(text);
                if (data && data.flat && typeof data.flat === "object") {
                    records.push(data.flat);
                }
            } catch {
                // Skip an unreadable or malformed blob rather than failing the whole export.
            }
        }

        records.sort((a, b) =>
            String(a.submittedAt || "").localeCompare(String(b.submittedAt || ""))
        );

        const csv = buildCsv(records);
        const date = new Date().toISOString().slice(0, 10);

        return new Response(csv, {
            status: 200,
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="ai-readiness-data-${date}.csv"`,
                "Cache-Control": "no-store",
            },
        });
    } catch (error) {
        console.error("Failed to export research data", error);
        return Response.json({ error: "Export failed" }, { status: 500 });
    }
}

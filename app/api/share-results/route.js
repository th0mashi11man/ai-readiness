import { put } from "@vercel/blob";

export const runtime = "nodejs";

const MAX_PAYLOAD_BYTES = 250_000;
const SUBMISSIONS_PREFIX = "research-submissions/";

function safeFilename(value) {
    const fallback = `ai-readiness-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    const filename = String(value || fallback)
        .replace(/[/\\?%*:|"<>]/g, "-")
        .replace(/\s+/g, "-")
        .slice(0, 120);

    return filename.endsWith(".json") ? filename : `${filename}.json`;
}

function validatePayload(payload) {
    if (!payload || typeof payload !== "object") {
        return "Missing research data.";
    }

    if (payload.context?.consentGiven !== true) {
        return "Consent is required.";
    }

    if (!Array.isArray(payload.answers) || !Array.isArray(payload.results)) {
        return "Research data is incomplete.";
    }

    return null;
}

export async function POST(request) {
    try {
        const payload = await request.json();
        const validationError = validatePayload(payload);

        if (validationError) {
            return Response.json({ error: validationError }, { status: 400 });
        }

        const filename = safeFilename(payload.filename);
        const json = JSON.stringify({ ...payload, filename }, null, 2);
        const byteLength = Buffer.byteLength(json, "utf8");

        if (byteLength > MAX_PAYLOAD_BYTES) {
            return Response.json({ error: "Research data file is too large." }, { status: 413 });
        }

        if (!process.env.BLOB_READ_WRITE_TOKEN) {
            return Response.json(
                {
                    error: "Forskningslagringen saknar serverkonfiguration i Vercel. Kontrollera Vercel Blob-konfigurationen.",
                    code: "missing_configuration",
                },
                { status: 500 }
            );
        }

        // Store one immutable JSON object per submission. A random suffix keeps
        // the public URL unguessable; aggregation/export requires the Blob token.
        await put(`${SUBMISSIONS_PREFIX}${filename}`, json, {
            access: "public",
            addRandomSuffix: true,
            contentType: "application/json",
        });

        return Response.json({ ok: true });
    } catch (error) {
        console.error("Failed to store research submission", error);
        return Response.json(
            {
                error: "Det gick inte att spara forskningsdata just nu.",
                debug: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        );
    }
}

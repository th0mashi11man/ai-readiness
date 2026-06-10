import { del, put } from "@vercel/blob";

export const runtime = "nodejs";

const MAX_PAYLOAD_BYTES = 250_000;
const DEFAULT_RESEARCH_EMAIL_TO = "thomas.hillman@ait.gu.se";

function getRequiredEnv(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing ${name}`);
    }
    return value;
}

function safeFilename(value) {
    const fallback = `ai-readiness-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    const filename = String(value || fallback)
        .replace(/[/\\?%*:|"<>]/g, "-")
        .replace(/\s+/g, "-")
        .slice(0, 120);

    return filename.endsWith(".json") ? filename : `${filename}.json`;
}

function parseRecipients(value) {
    return value
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean);
}

function validatePayload(payload) {
    if (!payload || typeof payload !== "object") {
        return "Missing research data.";
    }

    if (!payload.context?.consentGiven) {
        return "Consent is required.";
    }

    if (!Array.isArray(payload.answers) || !Array.isArray(payload.results)) {
        return "Research data is incomplete.";
    }

    return null;
}

async function sendEmail({ apiKey, from, to, replyTo, subject, filename, json, payload }) {
    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            from,
            to,
            ...(replyTo ? { reply_to: replyTo } : {}),
            subject,
            text: [
                "A new AI Readiness self-assessment research data submission is attached.",
                "",
                `File: ${filename}`,
                `Submitted at: ${payload.submittedAt || "unknown"}`,
                `Session: ${payload.session?.sessionId || "unknown"}`,
                "",
                "The temporary Vercel Blob copy is deleted immediately after this email is sent.",
            ].join("\n"),
            attachments: [
                {
                    filename,
                    content: Buffer.from(json, "utf8").toString("base64"),
                },
            ],
        }),
    });

    if (!response.ok) {
        const details = await response.json().catch(() => null);
        throw new Error(details?.message || details?.error || "Email delivery failed.");
    }
}

export async function POST(request) {
    let blobUrl = null;

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

        const resendApiKey = getRequiredEnv("RESEND_API_KEY");
        const to = parseRecipients(process.env.RESEARCH_EMAIL_TO || DEFAULT_RESEARCH_EMAIL_TO);
        const from = getRequiredEnv("RESEARCH_EMAIL_FROM");
        const subject = process.env.RESEARCH_EMAIL_SUBJECT || "AI Readiness research data submission";
        const replyTo = process.env.RESEARCH_EMAIL_REPLY_TO;

        if (to.length === 0) {
            throw new Error("Missing RESEARCH_EMAIL_TO");
        }

        const blob = await put(`research-submissions/${filename}`, json, {
            access: "private",
            addRandomSuffix: false,
            contentType: "application/json",
        });
        blobUrl = blob.url;

        await sendEmail({
            apiKey: resendApiKey,
            from,
            to,
            replyTo,
            subject,
            filename,
            json,
            payload,
        });

        await del(blobUrl);
        blobUrl = null;

        return Response.json({ ok: true, filename });
    } catch (error) {
        console.error("Failed to send shared research data", error);

        if (blobUrl) {
            try {
                await del(blobUrl);
            } catch (cleanupError) {
                console.error("Failed to delete temporary research data blob", cleanupError);
                return Response.json(
                    { error: "Submission failed and temporary cleanup failed. Please contact the site owner." },
                    { status: 500 }
                );
            }
        }

        const isConfigError = error instanceof Error && error.message.startsWith("Missing ");
        return Response.json(
            { error: isConfigError ? "Research data email delivery is not configured." : "Could not send research data." },
            { status: 500 }
        );
    }
}

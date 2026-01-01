import { Resend } from "resend";

export async function sendEmail({
	to,
	subject,
	html,
	text,
}: {
	to: string;
	subject: string;
	html?: string;
	text?: string;
}) {
	const apiKey = process.env.RESEND_API_KEY;
	if (!apiKey) {
		return;
	}

	const resend = new Resend(apiKey);

	await resend.emails.send({
		from: process.env.RESEND_FROM_EMAIL || "notification@quadassuretech.com",
		to,
		subject,
		...(html ? { html } : { text: text || "" }),
	});
}

// Emails sent when someone signs up: a welcome email to them, and a "new signup" alert to the team.
//
// The endpoint that calls this is public (the browser fires it right after signUp, before the user
// has a session), so it must not trust the request. Instead of emailing whatever address it is
// given, it looks the address up in Supabase Auth and only acts for an account that:
//   - exists and was created in the last 30 minutes (re-signing-up an old account does nothing), and
//   - has not been welcomed yet (each account triggers the emails exactly once).
import { createClient } from '@supabase/supabase-js';
import { sendBrandedMail, mailerConfigured } from './mailer.js';
import { welcomeEmail, signupAlertEmail } from './emailTemplates.js';
const FRESH_WINDOW_MS = 30 * 60 * 1000;
const PAGE_SIZE = 200;
const MAX_PAGES = 5;
/** The account for `email`, but only if it is brand new and has not been welcomed yet. */
export function pickFreshSignup(users, email, now = Date.now()) {
    const target = email.trim().toLowerCase();
    const user = users.find(u => u.email?.toLowerCase() === target);
    if (!user)
        return null;
    if (now - new Date(user.created_at).getTime() > FRESH_WINDOW_MS)
        return null;
    if (user.user_metadata?.welcome_sent)
        return null;
    return user;
}
export async function sendSignupEmails(email) {
    if (!mailerConfigured()) {
        console.warn('Signup emails skipped: GMAIL_USER / GMAIL_APP_PASSWORD not configured');
        return { sent: false };
    }
    const url = process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
        console.warn('Signup emails skipped: SUPABASE_SERVICE_ROLE_KEY not configured');
        return { sent: false };
    }
    const db = createClient(url, key, { auth: { persistSession: false } });
    let user = null;
    let totalUsers;
    for (let page = 1; page <= MAX_PAGES && !user; page++) {
        const { data, error } = await db.auth.admin.listUsers({ page, perPage: PAGE_SIZE });
        if (error)
            throw error;
        const total = data.total;
        if (typeof total === 'number')
            totalUsers = total;
        const target = email.trim().toLowerCase();
        const users = data.users;
        const match = users.find(u => u.email?.toLowerCase() === target);
        if (match)
            user = pickFreshSignup([match], email);
        if (match || users.length < PAGE_SIZE)
            break;
    }
    if (!user)
        return { sent: false };
    const meta = (user.user_metadata ?? {});
    const name = meta.name ?? '';
    const jobTitle = meta.job_title ?? '';
    // Both emails go out at the same time: each opens its own Gmail connection (~3 s each), and
    // doing them one after the other came close to the serverless time limit.
    const owner = process.env.GMAIL_USER;
    const [welcome, alert] = await Promise.allSettled([
        sendBrandedMail(email, welcomeEmail({ firstName: name.split(' ')[0] || 'there' })),
        owner
            ? sendBrandedMail(owner, signupAlertEmail({ name, email, jobTitle, createdAt: new Date(user.created_at), totalUsers }))
            : Promise.resolve(false),
    ]);
    // The alert is best-effort: it must never break signup.
    if (alert.status === 'rejected')
        console.error('Signup alert failed:', alert.reason);
    if (welcome.status === 'rejected')
        throw welcome.reason;
    // Mark as welcomed so repeated requests for this account do nothing.
    const { error: markError } = await db.auth.admin.updateUserById(user.id, { user_metadata: { ...user.user_metadata, welcome_sent: true } });
    if (markError)
        console.error('Could not mark welcome_sent:', markError.message);
    return { sent: true };
}

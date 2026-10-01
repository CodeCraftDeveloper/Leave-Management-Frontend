// The lone overall super admin. Every other `head` is scoped to the
// department(s) they are mapped to, so super-admin-only controls (department
// management and weekly digest controls are gated on this.
//
// Prefers the server-provided `isSuperAdmin` flag, falling back to the reserved
// email so a stale cached user object (pre-flag) still resolves correctly.
export const SUPERADMIN_EMAILS = ['charan.f.sde@gmail.com', 'rajan.kumar@premindustries.in'];
export const SUPERADMIN_EMAIL = SUPERADMIN_EMAILS[0];

export const isSuperAdmin = (user) =>
  Boolean(user?.isSuperAdmin) || [user?.email, user?.notificationEmail].some((email) =>
    SUPERADMIN_EMAILS.includes(String(email || '').toLowerCase())
  );

// The primary overall head (HEAD001 / charan.f.sde@gmail.com). Distinct from the
// broader super-admin set above. Mirrors `isPrimaryHeadEmail` in server/seed.js.
// Hidden from management lists so the account is not presented as a departmental
// reviewer — it still exists, logs in, and approves globally.
export const isPrimarySuperAdmin = (person) =>
  [person?.email, person?.notificationEmail].some((email) =>
    String(email || '').trim().toLowerCase() === SUPERADMIN_EMAIL
  );

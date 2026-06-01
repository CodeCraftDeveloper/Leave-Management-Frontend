// The lone overall super admin. Every other `head` is scoped to the
// department(s) they are mapped to, so super-admin-only controls (department
// management and weekly digest controls are gated on this.
//
// Prefers the server-provided `isSuperAdmin` flag, falling back to the reserved
// email so a stale cached user object (pre-flag) still resolves correctly.
export const SUPERADMIN_EMAILS = ['charan.f.sde@gmail.com', 'rajan.kumar@premindustries.in'];
export const SUPERADMIN_EMAIL = SUPERADMIN_EMAILS[0];

export const isSuperAdmin = (user) =>
  Boolean(user?.isSuperAdmin) || SUPERADMIN_EMAILS.includes(String(user?.email || '').toLowerCase());

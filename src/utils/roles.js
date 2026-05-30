// The lone overall super admin. Every other `head` is scoped to the
// department(s) they are mapped to, so super-admin-only controls (department
// management, weekly digest, dept_head role assignment) are gated on this.
//
// Prefers the server-provided `isSuperAdmin` flag, falling back to the reserved
// email so a stale cached user object (pre-flag) still resolves correctly.
export const SUPERADMIN_EMAIL = 'charan.f.sde@gmail.com';

export const isSuperAdmin = (user) =>
  Boolean(user?.isSuperAdmin) || String(user?.email || '').toLowerCase() === SUPERADMIN_EMAIL;

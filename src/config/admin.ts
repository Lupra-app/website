// Emails allowed to access /admin. Google login is open to anyone,
// but this list gates panel access — essential security boundary.
export const ADMIN_ALLOWLIST = new Set([
  "zamtos79@gmail.com", // Add more emails as needed
]);

export function isAdminAllowed(email: string | null | undefined): boolean {
  return email ? ADMIN_ALLOWLIST.has(email) : false;
}

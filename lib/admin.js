// Server-only: read from env so the admin identity never ships to the client.
const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.trim().toLowerCase();

/**
 * Checks if a Clerk user is the designated admin.
 * Evaluates both client user object and server user object formats.
 */
export const isAdminUser = (user) => {
  if (!user || !ADMIN_EMAIL) return false;

  // Clerk client user (useUser): the primary address is always verified
  if (user.primaryEmailAddress?.emailAddress?.toLowerCase() === ADMIN_EMAIL) {
    return true;
  }

  // Clerk server user (currentUser): only a VERIFIED address may grant admin, otherwise anyone
  // could attach the admin's email to their own account without owning it.
  if (Array.isArray(user.emailAddresses)) {
    return user.emailAddresses.some(
      (e) =>
        e?.verification?.status === "verified" &&
        e.emailAddress?.toLowerCase() === ADMIN_EMAIL,
    );
  }

  return false;
};

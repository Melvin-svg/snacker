// Server-only: read from env so the admin identity never ships to the client.
const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.trim().toLowerCase();

/**
 * Checks if a Clerk user is the designated admin.
 * Evaluates both client user object and server user object formats.
 */
export const isAdminUser = (user) => {
  if (!user || !ADMIN_EMAIL) return false;

  // Clerk client user (useUser)
  if (user.primaryEmailAddress?.emailAddress?.toLowerCase() === ADMIN_EMAIL) {
    return true;
  }

  // Clerk server user (currentUser) or list of email addresses
  if (Array.isArray(user.emailAddresses)) {
    return user.emailAddresses.some(
      (e) => (e.emailAddress || e)?.toLowerCase() === ADMIN_EMAIL
    );
  }

  return false;
};

import {
  clerkMiddleware,
  createRouteMatcher,
} from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/",
  "/cart(.*)",
  "/orders(.*)",
]);

// Node-style .env loaders do not exist in the Edge runtime and can crash the
// middleware bundle (node:fs is unavailable). Next.js already loads
// .env/.env.local into process.env for middleware, so no dotenv is needed.
const authorizedParties = process.env.DOMAIN_URL
  ? [process.env.DOMAIN_URL]
  : [];
// An [undefined] entry silently disables authorized-party validation, so only
// pass the option when the domain is actually configured. Never enable Clerk's
// debug logging in production - it dumps sensitive request/token data.
const options = {
  ...(process.env.NODE_ENV !== "production" && { debug: true }),
  ...(authorizedParties.length > 0 && { authorizedParties }),
};

export default clerkMiddleware((auth, req) => {
  // @clerk/nextjs v5: auth is a function. (auth.protect() only exists in v6+.)
  if (isProtectedRoute(req)) {
    auth().protect();
  }
}, options);

export const config = {
  matcher: [
    "/((?!.*\\..*|_next).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};

import {
  clerkMiddleware,
  createRouteMatcher,
} from "@clerk/nextjs/server";
import dotenv from "dotenv";
dotenv.config();

const isProtectedRoute = createRouteMatcher([
  "/",
  "/cart(.*)",
  "/orders(.*)",
]);

export default clerkMiddleware(
  async (auth, req) => {
    if (isProtectedRoute(req)) {
      await auth.protect();
    }
  },
  {
    debug: true,
    authorizedParties: [
      process.env.DOMAIN_URL,
    ],
  }
);

export const config = {
  matcher: [
    "/((?!.*\\..*|_next).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};
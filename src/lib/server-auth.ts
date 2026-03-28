import { auth, currentUser } from "@clerk/nextjs/server";

export const clerkEnabled = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);

export async function getOperatorIdentity() {
  if (!clerkEnabled) {
    return {
      actorId: "demo-operator",
      actorName: "Demo Operator",
      isAuthenticated: false,
    };
  }

  const authState = await auth();

  if (!authState.userId) {
    return {
      actorId: "anonymous",
      actorName: "Anonymous",
      isAuthenticated: false,
    };
  }

  const user = await currentUser();

  return {
    actorId: authState.userId,
    actorName:
      user?.fullName ||
      user?.primaryEmailAddress?.emailAddress ||
      "Authenticated Operator",
    isAuthenticated: true,
  };
}

export async function requireOperator() {
  return getOperatorIdentity();
}

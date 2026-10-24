import { auth } from "@/lib/auth";
import { isDemoEmail } from "@/lib/demo/constants";

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

/** Thrown when the shared demo account tries something that is locked in the demo. */
export class DemoLockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DemoLockedError";
  }
}

/** Server-side helper for Route Handlers: resolves the signed-in user or throws. */
export async function requireUser(): Promise<{ id: string; isDemo: boolean }> {
  const session = await auth();
  if (!session?.user?.id) throw new UnauthorizedError();
  return { id: session.user.id, isDemo: isDemoEmail(session.user.email) };
}

/** Server-side helper for Route Handlers: resolves the signed-in user id or throws. */
export async function requireUserId(): Promise<string> {
  return (await requireUser()).id;
}

/** Like `requireUserId`, but refuses the demo account. `action` reads as "Deleting documents". */
export async function requireNonDemoUserId(action: string): Promise<string> {
  const user = await requireUser();
  if (user.isDemo) {
    throw new DemoLockedError(
      `${action} is disabled in the demo. Sign up free to try it with your own workspace.`,
    );
  }
  return user.id;
}

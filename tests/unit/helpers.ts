import { vi } from "vitest";

/** Route handler context for dynamic `[id]` segments. */
export function idContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

/** Shared state the module mocks below read; tests mutate it per case. */
export const guard = { signedIn: true, member: true, userId: "user-1" };

export class UnauthorizedError extends Error {}
export class ForbiddenError extends Error {}
export class DemoLockedError extends Error {}

export const sessionMock = {
  UnauthorizedError,
  DemoLockedError,
  requireUserId: vi.fn(async () => {
    if (!guard.signedIn) throw new UnauthorizedError("Unauthorized");
    return guard.userId;
  }),
};

export const workspaceMock = {
  ForbiddenError,
  requireWorkspaceMember: vi.fn(async () => {
    if (!guard.member) throw new ForbiddenError("You do not have access to this workspace.");
    return "MEMBER" as const;
  }),
};

export const prismaClientMock = {
  Prisma: { PrismaClientKnownRequestError: class extends Error {} },
};

export function resetGuard() {
  guard.signedIn = true;
  guard.member = true;
  guard.userId = "user-1";
}

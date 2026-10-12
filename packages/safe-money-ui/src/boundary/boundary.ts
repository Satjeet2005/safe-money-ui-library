import type { ZodTypeAny, z } from 'zod';

export type BoundaryIssue = Readonly<{ path: string; message: string }>;

export class BoundaryError extends Error {
  constructor(
    readonly label: string,
    readonly issues: ReadonlyArray<BoundaryIssue>,
  ) {
    super(`${label}: ${issues.length} issue(s)`);
    this.name = 'BoundaryError';
  }
}

export type BoundaryResult<T> =
  Readonly<{ ok: true; value: T }> | Readonly<{ ok: false; error: BoundaryError }>;

/**
 * Validates untrusted external data against a Zod schema.
 * @example parseBoundary('User payload', schema, data)
 */
export function parseBoundary<S extends ZodTypeAny>(
  label: string,
  schema: S,
  raw: unknown,
): BoundaryResult<z.infer<S>> {
  const result = schema.safeParse(raw);
  if (result.success) {
    return { ok: true, value: result.data };
  }

  const issues: BoundaryIssue[] = result.error.issues.slice(0, 10).map((issue) => ({
    path: issue.path.length === 0 ? '$' : issue.path.join('.'),
    message: issue.message,
  }));

  return { ok: false, error: new BoundaryError(label, issues) };
}

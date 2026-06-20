import type { UseQueryResult } from "@tanstack/react-query";
import type { LaeUser } from "@/lib/contracts/services/reader";

/** True while the first on-chain registration read has not completed (React Query v5 safe). */
export function isCheckingRegistration(
  query: Pick<
    UseQueryResult<LaeUser, Error>,
    "isPending" | "isError" | "data"
  >
): boolean {
  return query.isPending && !query.isError;
}

/** True when registration read failed — do not treat as unregistered. */
export function registrationReadFailed(
  query: Pick<UseQueryResult<LaeUser, Error>, "isError" | "data">
): boolean {
  return query.isError && query.data === undefined;
}

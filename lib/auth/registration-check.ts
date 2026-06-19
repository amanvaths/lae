import type { UseQueryResult } from "@tanstack/react-query";
import type { SensoUser } from "@/lib/contracts/services/reader";

/** True while the first on-chain registration read has not completed (React Query v5 safe). */
export function isCheckingRegistration(
  query: Pick<
    UseQueryResult<SensoUser, Error>,
    "isPending" | "isError" | "data"
  >
): boolean {
  return query.isPending && !query.isError;
}

/** True when registration read failed — do not treat as unregistered. */
export function registrationReadFailed(
  query: Pick<UseQueryResult<SensoUser, Error>, "isError" | "data">
): boolean {
  return query.isError && query.data === undefined;
}

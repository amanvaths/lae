import { config } from "./index.js";
import { CHAIN, CONTRACTS } from "./chains.js";

export { CHAIN, CONTRACTS };

/** @deprecated use CHAIN + CONTRACTS — kept for legacy imports */
export const legacyConfig = config;

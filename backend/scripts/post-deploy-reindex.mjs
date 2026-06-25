/**
 * Wipe matrix indexer tables and replay from LAE_MATRIX_DEPLOY_BLOCK.
 * Used after deploying a new LAEClubMatrix contract to production.
 */
import { resetIndexedMatrixData } from "../dist/modules/blockchain/reset-indexed-data.js";
import {
  getMatrixDeployBlock,
  replayFromBlock,
} from "../dist/modules/blockchain/sync-engine.js";

const deleted = await resetIndexedMatrixData();
console.log("[reindex] wiped:", deleted);

const from = getMatrixDeployBlock();
console.log("[reindex] replay from block", from.toString());
const users = await replayFromBlock(from);
console.log("[reindex] indexed users:", users);

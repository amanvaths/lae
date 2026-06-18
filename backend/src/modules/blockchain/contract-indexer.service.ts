import { ethers } from "ethers";
import { prisma } from "../../lib/prisma.js";
import { SENSO_CONTRACT_EVENTS } from "./contract-events.js";

export interface ChainEventRecord {
  txHash: string;
  blockNumber: number;
  logIndex: number;
  eventName: string;
  args: Record<string, unknown>;
  walletAddress?: string;
}

/**
 * Persist raw on-chain event. Contract owns all business logic — backend indexes only.
 */
export async function saveChainEvent(record: ChainEventRecord): Promise<void> {
  await prisma.chainEvent.upsert({
    where: {
      txHash_logIndex: { txHash: record.txHash, logIndex: record.logIndex },
    },
    create: {
      txHash: record.txHash,
      logIndex: record.logIndex,
      blockNumber: BigInt(record.blockNumber),
      eventName: record.eventName,
      walletAddress: record.walletAddress?.toLowerCase(),
      payload: record.args as object,
    },
    update: {},
  });
}

export function startContractEventIndexer(
  contractAddress: string,
  provider: ethers.Provider
): void {
  if (!contractAddress || contractAddress === "0x0000000000000000000000000000000000000000") {
    console.warn("[chain-indexer] Disabled — no contract address");
    return;
  }

  const iface = new ethers.Interface(SENSO_CONTRACT_EVENTS);
  const contract = new ethers.Contract(contractAddress, iface, provider);

  for (const fragment of SENSO_CONTRACT_EVENTS) {
    const eventName = fragment.split("(")[0];

    contract.on(eventName, async (...args: unknown[]) => {
      const event = args[args.length - 1] as ethers.EventLog;
      try {
        const walletAddress =
          typeof args[0] === "string" && (args[0] as string).startsWith("0x")
            ? (args[0] as string)
            : undefined;

        await saveChainEvent({
          txHash: event.transactionHash,
          blockNumber: event.blockNumber,
          logIndex: event.index,
          eventName,
          walletAddress,
          args: {
            raw: args.slice(0, -1).map((v) => (typeof v === "bigint" ? v.toString() : v)),
          },
        });
      } catch (err) {
        console.error(`[chain-indexer] ${eventName} error:`, err);
      }
    });
  }

  console.log(`[chain-indexer] Listening on ${contractAddress} (${SENSO_CONTRACT_EVENTS.length} events)`);
}

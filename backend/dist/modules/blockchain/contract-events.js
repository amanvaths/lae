/**
 * SensoLimitless contract event names — backend indexer subscribes to all of these.
 * After Remix deploy, set SENSO_CONTRACT_ADDRESS in backend .env
 */
export const SENSO_CONTRACT_EVENTS = [
    "UserRegistered(address,address,uint256)",
    "ClubPurchased(address,uint8,uint256,uint256,bool)",
    "PilotPurchased(address,uint8,uint256,uint256,bool)",
    "ClubPlacement(address,uint256,uint8,address,uint8)",
    "PilotPlacement(address,uint256,uint8,address,uint8)",
    "ClubCycleCompleted(uint256,address,uint8,uint256,uint256)",
    "PilotCycleCompleted(uint256,address,uint8,uint256)",
    "ClubRebirthCreated(uint256,address,uint8,uint256)",
    "PilotRebirthCreated(uint256,address,uint8,uint256)",
    "IncomePaid(address,address,uint8,uint8,uint8,uint256)",
    "Withdraw(address,uint256,bytes32)",
];
//# sourceMappingURL=contract-events.js.map
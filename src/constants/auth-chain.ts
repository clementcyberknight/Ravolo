/**
 * Wallet family sent to the backend for challenge + verify.
 * - solana: Ed25519, signature base58, wallet = base58 pubkey
 * - eip155: EIP-191 personal_sign, signature 0x hex, wallet = checksummed address; chainId disambiguates the network (e.g. Monad mainnet)
 */
export type WalletFamily = "solana" | "eip155";

/** Monad mainnet — align with backend `chainId` for verify. */
export const MONAD_MAINNET_CHAIN_ID = 143 as const;

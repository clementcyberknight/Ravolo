import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";

export async function signAuthChallenge(
  keypair: Ed25519Keypair,
  message: string,
): Promise<{ wallet: string; signature: string }> {
  const bytes = new TextEncoder().encode(message);
  const { signature } = await keypair.signPersonalMessage(bytes);

  return {
    wallet: keypair.toSuiAddress(),
    signature,
  };
}

export function createSuiKeypair(): Ed25519Keypair {
  return Ed25519Keypair.generate();
}

export function keypairFromStoredSecret(
  secretKey: string,
): Ed25519Keypair | null {
  try {
    return Ed25519Keypair.fromSecretKey(secretKey);
  } catch {
    return null;
  }
}

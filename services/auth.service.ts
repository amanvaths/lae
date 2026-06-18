import { fetchNonce, loginWithSignature, registerWithSignature } from "@/lib/api/auth";
import { setTokens, ApiError } from "@/lib/api-client";

export function buildSignInMessage(walletAddress: string, nonce: string): string {
  return [
    "Sign in to LAE",
    `Wallet: ${walletAddress.toLowerCase()}`,
    `Nonce: ${nonce}`,
    `Issued: ${new Date().toISOString()}`,
  ].join("\n");
}

export async function signInWithWallet(
  walletAddress: string,
  signMessageAsync: (args: { message: string }) => Promise<string>,
  referralCode?: string
) {
  const { nonce } = await fetchNonce(walletAddress);
  const message = buildSignInMessage(walletAddress, nonce);
  const signature = await signMessageAsync({ message });

  try {
    const result = await loginWithSignature({ walletAddress, signature, nonce });
    setTokens(result.accessToken, result.refreshToken);
    return result;
  } catch (err: unknown) {
    if (err instanceof ApiError && err.status === 404 && referralCode) {
      const result = await registerWithSignature({
        walletAddress,
        referralCode,
        signature,
        nonce,
      });
      setTokens(result.accessToken, result.refreshToken);
      return result;
    }
    throw err;
  }
}

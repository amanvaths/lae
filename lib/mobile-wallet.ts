/** Mobile browser + in-app wallet helpers for connect flows. */

export function isMobileUserAgent(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

export function isInWalletBrowser(): boolean {
  if (typeof window === "undefined") return false;
  const eth = (window as Window & { ethereum?: unknown }).ethereum;
  return !!eth;
}

export function currentDappUrl(): string {
  if (typeof window === "undefined") return "https://laeclub.org/login/";
  return window.location.href;
}

/** Opens laeclub.org inside MetaMask's in-app browser (works from Chrome/Safari). */
export function metamaskDappUrl(url = currentDappUrl()): string {
  const hostPath = url.replace(/^https?:\/\//, "");
  return `https://metamask.app.link/dapp/${hostPath}`;
}

/** Opens the current page inside Trust Wallet's in-app browser. */
export function trustWalletDappUrl(url = currentDappUrl()): string {
  return `https://link.trustwallet.com/open_url?coin_id=20000714&url=${encodeURIComponent(url)}`;
}

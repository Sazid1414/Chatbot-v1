export function isAuthDisabled(): boolean {
  return process.env.NEXT_PUBLIC_AUTH_DISABLED === "true";
}

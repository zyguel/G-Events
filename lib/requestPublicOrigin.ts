/**
 * Origin the browser used (scheme + host), for redirects after OAuth / forms.
 * Behind ngrok, Cloudflare Tunnel, or Vercel, `request.url` is often still
 * localhost while `X-Forwarded-*` has the public host.
 */
export function getRequestPublicOrigin(request: Request): string {
  const url = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (!forwardedHost) {
    return url.origin;
  }

  const host = forwardedHost.split(",")[0].trim();
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const proto =
    forwardedProto?.split(",")[0].trim() ||
    (url.protocol === "https:" ? "https" : "http");

  return `${proto}://${host}`;
}

/**
 * Links through the online-event create flow.
 *
 * The Google authorization `code` is only present when the organiser has just
 * come back from Google's consent screen; an already-connected organiser walks
 * this flow without one. Interpolating it directly produced `?code=undefined`
 * — the literal word — which the API then tried to redeem as a real code.
 *
 * Built with URLSearchParams so an absent code is simply OMITTED, which is what
 * "there is no code" is supposed to look like in a URL.
 */
export function meetFlowUrl(
  path: string,
  params: { code?: string; provider?: string },
): string {
  const query = new URLSearchParams();
  if (params.code) query.set("code", params.code);
  if (params.provider) query.set("provider", params.provider);
  const suffix = query.toString();
  return suffix ? `${path}?${suffix}` : path;
}

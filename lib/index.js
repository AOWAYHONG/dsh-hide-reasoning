/**
 * @dsh-external/dsh-hide-reasoning — client-only profile bundle.
 *
 * Server half is a no-op; the browser half (lib/client.js) injects a style
 * rule that hides the assistant reasoning (思考) disclosure rows.
 * @module @dsh-external/dsh-hide-reasoning
 */

export const name = '@dsh-external/dsh-hide-reasoning';
export const inject = [];

/** Plugin entry: nothing to mount server-side. */
export async function apply(_ctx, _config = {}) {
  // Client-only plugin — see lib/client.js.
}

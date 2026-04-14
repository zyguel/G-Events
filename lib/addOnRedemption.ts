/**
 * AddOnRedemption rows: "Claimed" in Manage Orders if any row is redeemed/claimed.
 * Supports common column names (your schema may use one of these).
 */
export function addOnRedemptionRowIsClaimed(row: Record<string, unknown>): boolean {
  if (row.is_claimed === true) return true;
  if (row.is_redeemed === true) return true;
  if (row.redeemed === true) return true;
  const redeemedAt = row.redeemed_at;
  if (redeemedAt != null && redeemedAt !== "") return true;
  const claimedAt = row.claimed_at;
  if (claimedAt != null && claimedAt !== "") return true;
  return false;
}

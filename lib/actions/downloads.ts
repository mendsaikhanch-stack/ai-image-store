"use server";

import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { t } from "@/lib/i18n";

export type DownloadActionState = {
  error?: string;
  url?: string;
};

// Token TTL is intentionally short — the client triggers navigation
// within seconds. Expired tokens are rejected by the download route.
const TOKEN_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Called from /account/downloads. Creates a DownloadToken scoped to
// a specific Download entitlement and returns a URL for the client
// to navigate to. The entitlement must belong to the current user,
// must not be exhausted, and the owning order must be PAID.
export async function createDownloadTokenAction(
  _prev: DownloadActionState,
  formData: FormData,
): Promise<DownloadActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: t.downloads.errorNotSignedIn };

  const downloadId = String(formData.get("downloadId") ?? "");
  if (!downloadId) return { error: t.downloads.errorNotFound };

  const download = await prisma.download.findUnique({
    where: { id: downloadId },
    include: { order: { select: { status: true, userId: true } } },
  });
  if (!download) return { error: t.downloads.errorNotFound };
  if (download.userId !== user.id) return { error: t.downloads.errorNotOwner };
  if (download.order.status !== "PAID")
    return { error: t.downloads.errorOrderNotPaid };
  if (download.usedCount >= download.maxCount)
    return { error: t.downloads.errorLimitReached };

  const token = nanoid(40);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);
  await prisma.downloadToken.create({
    data: { downloadId: download.id, token, expiresAt },
  });

  return { url: `/api/downloads/${token}` };
}

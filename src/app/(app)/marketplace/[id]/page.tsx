import { redirect } from "next/navigation";

/**
 * Product detail UI now lives on marketplace listing cards (expandable description, etc.).
 * Old /marketplace/[id] links redirect to the main browse view.
 */
export default async function MarketplaceProductLegacyRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/marketplace?product=${encodeURIComponent(id)}`);
}

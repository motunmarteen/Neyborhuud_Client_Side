import MarketplaceLegacyRedirectClient from './PageClient';
import { capStaticParams } from '@/lib/staticExportParams';

export const dynamicParams = true;
export function generateStaticParams() {
  return capStaticParams('id');
}

/**
 * Product detail UI now lives on marketplace listing cards.
 * Old /marketplace/[id] links redirect to the main browse view.
 */
export default function MarketplaceProductLegacyRedirectPage() {
  return <MarketplaceLegacyRedirectClient />;
}

import MessagesConversationRedirectClient from './PageClient';
import { capStaticParams } from '@/lib/staticExportParams';

export const dynamicParams = true;
export function generateStaticParams() {
  return capStaticParams('conversationId');
}

/** /messages/:conversationId -> /chat/:conversationId */
export default function MessagesConversationRedirect() {
  return <MessagesConversationRedirectClient />;
}

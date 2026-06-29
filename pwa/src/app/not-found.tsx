import type { Metadata } from 'next';
import { NotFoundPage } from '@/components/errors/NotFoundPage';

export const metadata: Metadata = {
    title: 'Page Not Found',
    description: 'The page you were looking for does not exist.',
};

export default function NotFound() {
    return <NotFoundPage />;
}

import { LandingPage } from '@/components/landing/LandingPage';

export default function Page() {
    return (
        <>
            {/* Hint browser to fetch poster + video early (landing only). */}
            <link rel="preload" href="/video/landing-poster.jpg" as="image" />
            <link
                rel="preload"
                href="/video/background-video.mp4"
                as="fetch"
                type="video/mp4"
                crossOrigin="anonymous"
            />
            <LandingPage />
        </>
    );
}

/**
 * Sidebar Navigation Component - X.com Style
 * Desktop sidebar with collapsible functionality
 * Mobile slide-out drawer with overlay
 */

'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { GlobalSearch } from '@/components/GlobalSearch';

interface SidebarProps {
    onCreatePost?: () => void;
    isMobileOpen?: boolean;
    onMobileClose?: () => void;
}

export function Sidebar({ onCreatePost, isMobileOpen = false, onMobileClose }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);

    // Load collapsed state from localStorage
    useEffect(() => {
        setIsMounted(true);
        const saved = localStorage.getItem('sidebar_collapsed');
        if (saved) {
            setIsCollapsed(saved === 'true');
        }
        // eslint-disable-next-line react-hooks/set-state-in-effect
    }, []);

    // Prevent body scroll when mobile drawer is open
    useEffect(() => {
        if (isMobileOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isMobileOpen]);

    // Close user menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (showUserMenu && !target.closest('.user-menu-container')) {
                setShowUserMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showUserMenu]);

    // Save collapsed state to localStorage
    const toggleCollapsed = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem('sidebar_collapsed', String(newState));
    };

    const handleLogout = async () => {
        try {
            setShowUserMenu(false);
            // Try to logout from backend, but don't block if it fails
            try {
                await logout();
            } catch (error) {
                console.warn('Backend logout failed, but clearing local session:', error);
                // Clear local session even if backend fails
                localStorage.removeItem('neyborhuud_token');
                localStorage.removeItem('neyborhuud_user');
            }
            // Always redirect to login
            router.push('/login');
        } catch (error) {
            console.error('Logout failed:', error);
            // Fallback: clear everything and redirect anyway
            localStorage.removeItem('neyborhuud_token');
            localStorage.removeItem('neyborhuud_user');
            router.push('/login');
        }
    };

    const navItems = [
        { icon: 'bi-house-fill', iconOutline: 'bi-house', label: 'Home', href: '/feed', active: pathname === '/feed' },
        { icon: 'bi-chat-dots-fill', iconOutline: 'bi-chat-dots', label: 'Gossip', href: '/gossip', active: pathname === '/gossip' },
        { icon: 'bi-search', iconOutline: 'bi-search', label: 'Explore', href: '/feed?search=1', active: false },
        { icon: 'bi-bell-fill', iconOutline: 'bi-bell', label: 'Notifications', href: '/feed', active: false },
        { icon: 'bi-envelope-fill', iconOutline: 'bi-envelope', label: 'Messages', href: '/feed', active: false },
        { icon: 'bi-person-fill', iconOutline: 'bi-person', label: 'Profile', href: user ? `/profile/${user.username}` : '/settings', active: pathname?.startsWith('/profile') || pathname === '/settings' },
    ];

    const handleNavClick = () => {
        // Close mobile drawer when navigating
        if (isMobileOpen && onMobileClose) {
            onMobileClose();
        }
    };

    if (!isMounted) return null;

    const userDisplayName = user ? (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName || user.username) : 'User';
    const userHandle = user ? `@${user.username}` : '@username';
    const userInitial = userDisplayName[0]?.toUpperCase() || 'U';

    const UserMenu = () => (
        <div className="absolute bottom-full mb-2 left-0 w-full min-w-[260px] bg-white dark:bg-gray-950 rounded-2xl shadow-[0_0_15px_rgba(0,0,0,0.1)] dark:shadow-[0_0_15px_rgba(255,255,255,0.1)] border border-gray-100 dark:border-gray-800 p-2 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-3 border-b border-gray-100 dark:border-gray-800">
                <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{userDisplayName}</p>
                <p className="text-xs text-gray-500 truncate">{userHandle}</p>
            </div>

            <Link
                href={user ? `/profile/${user.username}` : '/settings'}
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-3 w-full p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-700 dark:text-gray-200"
            >
                <i className="bi bi-person text-xl" />
                <span className="font-medium">View Profile</span>
            </Link>

            <Link
                href="/settings"
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-3 w-full p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-700 dark:text-gray-200"
            >
                <i className="bi bi-gear text-xl" />
                <span className="font-medium">Settings</span>
            </Link>

            <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-red-500"
            >
                <i className="bi bi-box-arrow-right text-xl" />
                <span className="font-medium">Log out {userHandle}</span>
            </button>
        </div>
    );

    // Mobile Drawer
    const mobileDrawer = (
        <>
            {/* Overlay */}
            <div
                className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 ${isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={onMobileClose}
            />

            {/* Drawer */}
            <aside
                className={`fixed top-0 left-0 h-full w-[280px] bg-white dark:bg-gray-950 z-50 lg:hidden transform transition-transform duration-300 ease-out shadow-2xl ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="flex flex-col h-full px-4 py-4">
                    {/* Header with close button */}
                    <div className="flex items-center justify-between mb-6">
                        <Link href="/feed" className="flex items-center gap-3" onClick={handleNavClick}>
                            <img src="/icon.png" alt="NeyborHuud" className="w-10 h-10 rounded-xl" />
                            <span className="font-bold text-xl text-gray-900 dark:text-white">NeyborHuud</span>
                        </Link>
                        <button
                            onClick={onMobileClose}
                            className="w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors"
                        >
                            <i className="bi bi-x-lg text-xl" />
                        </button>
                    </div>

                    {/* Search Bar - Mobile */}
                    <div className="mb-4">
                        <GlobalSearch />
                    </div>

                    {/* Navigation Items */}
                    <nav className="flex-1 space-y-1">
                        {navItems.map((item) => (
                            <Link
                                key={item.label}
                                href={item.href}
                                onClick={handleNavClick}
                                className={`flex items-center gap-4 px-4 py-3.5 rounded-xl text-lg transition-all ${item.active
                                    ? 'font-bold bg-gray-100 dark:bg-gray-800'
                                    : 'font-normal hover:bg-gray-100 dark:hover:bg-gray-800'
                                    }`}
                            >
                                <i className={`bi ${item.active ? item.icon : item.iconOutline} text-2xl`} />
                                <span>{item.label}</span>
                            </Link>
                        ))}

                        {/* Post Button */}
                        <button
                            onClick={() => {
                                onCreatePost?.();
                                onMobileClose?.();
                            }}
                            className="w-full mt-6 bg-primary hover:bg-primary/90 text-white font-bold text-lg rounded-full py-3.5 transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
                        >
                            Create Post
                        </button>
                    </nav>

                    {/* User Profile Section */}
                    <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-800 relative user-menu-container">
                        {showUserMenu && <UserMenu />}
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="flex items-center gap-3 p-3 w-full rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                        >
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-brand-blue flex items-center justify-center text-white font-bold text-lg flex-shrink-0 overflow-hidden">
                                {user?.avatarUrl ? (
                                    <img src={user.avatarUrl} alt={userDisplayName} className="w-full h-full object-cover" />
                                ) : (
                                    userInitial
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-base truncate text-gray-900 dark:text-gray-100">{userDisplayName}</p>
                                <p className="text-sm text-gray-500 truncate">{userHandle}</p>
                            </div>
                            <i className="bi bi-three-dots text-gray-400" />
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );

    // Desktop Sidebar
    const desktopSidebar = (
        <aside
            className={`hidden lg:flex lg:flex-col lg:fixed lg:h-screen lg:left-0 lg:top-0 lg:px-4 lg:py-2 transition-all duration-300 ${isCollapsed ? 'lg:w-[88px]' : 'lg:w-[275px]'
                }`}
        >
            {/* Logo & Toggle */}
            <div className="flex items-center justify-between h-14 px-3 mb-1">
                <Link href="/feed" className="w-12 h-12 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <img src="/icon.png" alt="NeyborHuud" className="w-8 h-8 rounded-lg" />
                </Link>
                {!isCollapsed && (
                    <button
                        onClick={toggleCollapsed}
                        className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors"
                        title="Collapse sidebar"
                    >
                        <i className="bi bi-chevron-left text-lg" />
                    </button>
                )}
                {isCollapsed && (
                    <button
                        onClick={toggleCollapsed}
                        className="absolute top-4 left-[72px] w-6 h-6 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors shadow-md"
                        title="Expand sidebar"
                    >
                        <i className="bi bi-chevron-right text-sm" />
                    </button>
                )}
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 space-y-1">
                {navItems.map((item) => (
                    <Link
                        key={item.label}
                        href={item.href}
                        className={`flex items-center gap-4 px-4 py-3 rounded-full text-xl transition-colors ${item.active
                            ? 'font-bold'
                            : 'font-normal hover:bg-gray-100 dark:hover:bg-gray-800'
                            } ${isCollapsed ? 'justify-center' : ''}`}
                        title={isCollapsed ? item.label : undefined}
                    >
                        <i className={`bi ${item.active ? item.icon : item.iconOutline} text-2xl`} />
                        {!isCollapsed && <span>{item.label}</span>}
                    </Link>
                ))}

                {/* Post Button */}
                <button
                    onClick={onCreatePost}
                    className={`w-full mt-4 bg-primary hover:bg-primary/90 text-white font-bold text-lg rounded-full py-3 transition-colors shadow-lg hover:shadow-xl ${isCollapsed ? 'px-0' : 'px-6'
                        }`}
                    title={isCollapsed ? 'Post' : undefined}
                >
                    {isCollapsed ? <i className="bi bi-plus-lg text-xl" /> : 'Post'}
                </button>
            </nav>

            {/* User Profile Section */}
            <div className="mt-auto mb-4 relative user-menu-container">
                {showUserMenu && !isCollapsed && <UserMenu />}
                <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className={`flex items-center gap-3 p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors w-full ${isCollapsed ? 'justify-center' : ''
                        }`}
                    title={isCollapsed ? 'Profile' : undefined}
                >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-brand-blue flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden">
                        {user?.avatarUrl ? (
                            <img src={user.avatarUrl} alt={userDisplayName} className="w-full h-full object-cover" />
                        ) : (
                            userInitial
                        )}
                    </div>
                    {!isCollapsed && (
                        <>
                            <div className="flex-1 min-w-0 text-left">
                                <p className="font-bold text-sm truncate text-gray-900 dark:text-gray-100">{userDisplayName}</p>
                                <p className="text-xs text-gray-500 truncate">{userHandle}</p>
                            </div>
                            <i className="bi bi-three-dots text-lg" />
                        </>
                    )}
                </button>
            </div>
        </aside>
    );

    return (
        <>
            {mobileDrawer}
            {desktopSidebar}
        </>
    );
}


import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import App from './App';
// We will lazy load pages later, for now import App as the Layout/Main
// Actually, App.tsx is currently the "Page" + "Layout". 
// We need to refactor App.tsx to be the Layout, and move content to pages.

// For this step, we just define the router structure.
// We will need a MainLayout that wraps the outlet.

import { MainLayout } from '@/layouts/MainLayout';

// Lazy Load Pages for Performance
const StreamPage = React.lazy(() => import('@/pages/Stream').then(module => ({ default: module.StreamPage })));
const BroadcastPage = React.lazy(() => import('@/pages/Broadcast').then(module => ({ default: module.BroadcastPage })));
const CollectionPage = React.lazy(() => import('@/pages/Collection').then(module => ({ default: module.CollectionPage })));
const ExplorePage = React.lazy(() => import('@/pages/Explore').then(module => ({ default: module.ExplorePage })));
const GuidePage = React.lazy(() => import('@/pages/Guide').then(module => ({ default: module.GuidePage })));

const LoadingFallback = () => (
    <div className="flex items-center justify-center h-full w-full bg-space-black">
        <div className="w-8 h-8 rounded-full border-2 border-accent-cyan border-t-transparent animate-spin" />
    </div>
);

export const router = createBrowserRouter([
    {
        path: '/',
        element: <MainLayout />,
        children: [
            {
                index: true,
                element: <React.Suspense fallback={<LoadingFallback />}><StreamPage /></React.Suspense>,
            },
            {
                path: 'explore',
                element: <React.Suspense fallback={<LoadingFallback />}><ExplorePage /></React.Suspense>,
            },
            {
                path: 'broadcast',
                element: <React.Suspense fallback={<LoadingFallback />}><BroadcastPage /></React.Suspense>,
            },
            {
                path: 'collection',
                element: <React.Suspense fallback={<LoadingFallback />}><CollectionPage /></React.Suspense>,
            },
            {
                path: 'guide',
                element: <React.Suspense fallback={<LoadingFallback />}><GuidePage /></React.Suspense>,
            },
            {
                path: 'settings', // Added missing route
                element: <React.Suspense fallback={<LoadingFallback />}>
                    {/* Inline lazy for settings if not exported yet, but assuming it follows pattern */}
                    {React.createElement(React.lazy(() => import('@/pages/Settings').then(m => ({ default: m.SettingsPage }))))}
                </React.Suspense>
            }
        ]
    }
]);

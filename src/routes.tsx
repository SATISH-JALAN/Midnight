import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import App from './App';
// We will lazy load pages later, for now import App as the Layout/Main
// Actually, App.tsx is currently the "Page" + "Layout". 
// We need to refactor App.tsx to be the Layout, and move content to pages.

// For this step, we just define the router structure.
// We will need a MainLayout that wraps the outlet.

import { MainLayout } from '@/layouts/MainLayout';
import { StreamPage } from '@/pages/Stream';
import { BroadcastPage } from '@/pages/Broadcast';
import { CollectionPage } from '@/pages/Collection';

// Since pages don't exist yet, we can't fully wire them. 
// But per task list, we are creating routes.tsx.
// I will create simple placeholders or generic components for now if files don't exist.
// Or better: I should create the Layout and Pages in the next step (Refactor App.tsx).

// Let's define the intended structure.

export const router = createBrowserRouter([
    {
        path: '/',
        element: <MainLayout />,
        children: [
            {
                index: true,
                element: <StreamPage />, // This will eventually replace the "Live" view of App.tsx
            },
            {
                path: 'broadcast',
                element: <BroadcastPage />,
            },
            {
                path: 'collection',
                element: <CollectionPage />,
            }
        ]
    }
]);

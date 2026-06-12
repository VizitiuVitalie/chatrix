import { createBrowserRouter, Navigate } from 'react-router-dom';

import { LoginPage } from '@/modules/auth/pages/login.page';
import { RegisterPage } from '@/modules/auth/pages/register.page';
import { ChatsLayout } from '@/modules/chats/layouts/chats-layout';
import { ChatConversationPage } from '@/modules/chats/pages/chat-conversation.page';
import { ChatEmptyPage } from '@/modules/chats/pages/chat-empty.page';
import { ProfilePage } from '@/modules/profile/pages/profile.page';
import { SettingsPage } from '@/modules/settings/pages/settings.page';
import { ProtectedRoute } from '@/shared/guards/protected-route';
import { PublicRoute } from '@/shared/guards/public-route';
import { AuthLayout } from '@/shared/layouts/auth-layout';
import { MainLayout } from '@/shared/layouts/main-layout';

export const router = createBrowserRouter([
  {
    element: (
      <PublicRoute>
        <AuthLayout />
      </PublicRoute>
    ),
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },
  {
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '/chats',
        element: <ChatsLayout />,
        children: [
          { index: true, element: <ChatEmptyPage /> },
          { path: ':id', element: <ChatConversationPage /> },
        ],
      },
      { path: '/profile', element: <ProfilePage /> },
      { path: '/settings', element: <SettingsPage /> },
      { path: '/', element: <Navigate to="/chats" replace /> },
    ],
  },
  { path: '*', element: <Navigate to="/chats" replace /> },
]);

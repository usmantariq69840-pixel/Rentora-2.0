import { Outlet } from 'react-router-dom';
import { AiProvider } from '../lib/AiContext';
import { AuthProvider } from '../lib/AuthContext';
import { NotificationsProvider } from '../lib/NotificationsContext';
import { SavedProvider } from '../lib/SavedContext';

/** App-wide state that needs the router (sign-in prompt, saved items, notifications). */
export default function AppProviders() {
  return (
    <AuthProvider>
      <SavedProvider>
        <NotificationsProvider>
          <AiProvider>
            <Outlet />
          </AiProvider>
        </NotificationsProvider>
      </SavedProvider>
    </AuthProvider>
  );
}

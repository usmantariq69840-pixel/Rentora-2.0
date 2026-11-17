import { createBrowserRouter } from 'react-router-dom';
import RequireAuth from '../components/auth/RequireAuth';
import Layout from '../components/layout/Layout';
import Browse from '../pages/Browse';
import BookingDetail from '../pages/BookingDetail';
import Bookings from '../pages/Bookings';
import CategoryPage from '../pages/CategoryPage';
import Admin from '../pages/Admin';
import AiFinder from '../pages/AiFinder';
import Dashboard from '../pages/Dashboard';
import DemoInfo from '../pages/DemoInfo';
import Home from '../pages/Home';
import ItemDetail from '../pages/ItemDetail';
import ListingWizard from '../pages/ListingWizard';
import NotFound from '../pages/NotFound';
import Profile from '../pages/Profile';
import Saved from '../pages/Saved';
import AiSettings from '../pages/settings/AiSettings';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import AppProviders from './AppProviders';

/**
 * Every route in the plan. Pages that need an account are wrapped in <RequireAuth>; the API checks the session too.
 */
export const router = createBrowserRouter([
  {
    element: <AppProviders />,
    children: [
      {
        element: <Layout />,
        children: [
          { index: true, element: <Home /> },
          { path: 'browse', element: <Browse /> },
          { path: 'category/:slug', element: <CategoryPage /> },
          { path: 'items/:id', element: <ItemDetail /> },
          { path: 'login', element: <Login /> },
          { path: 'register', element: <Register /> },
          { path: 'saved', element: <RequireAuth><Saved /></RequireAuth> },
          { path: 'profile', element: <RequireAuth><Profile /></RequireAuth> },
          { path: 'bookings', element: <RequireAuth><Bookings /></RequireAuth> },
          { path: 'bookings/:id', element: <RequireAuth><BookingDetail /></RequireAuth> },
          { path: 'dashboard', element: <RequireAuth><Dashboard /></RequireAuth> },
          { path: 'list-item', element: <RequireAuth><ListingWizard /></RequireAuth> },
          { path: 'items/:id/edit', element: <RequireAuth><ListingWizard /></RequireAuth> },
          { path: 'ai-finder', element: <AiFinder /> },
          { path: 'settings/ai', element: <RequireAuth role="admin"><AiSettings /></RequireAuth> },
          { path: 'admin', element: <RequireAuth role="admin"><Admin /></RequireAuth> },
          { path: 'demo-info', element: <DemoInfo /> },
          { path: '*', element: <NotFound /> },
        ],
      },
    ],
  },
]);

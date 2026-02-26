// routes/index.js
import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import Home from '../pages/Home';
import GalleryView from '../pages/GalleryView';
import RoomDetails from '../pages/RoomDetails';
import Activities from '../pages/Activities';
import Reservation from '../pages/admin/Reservation';
import ProtectedRoute from '../components/ProtectedRoute';
import Rooms from '../pages/admin/Rooms';
import PictureManagement from '../pages/admin/PictureManagement';

import AdminDashboard from '../pages/admin/AdminDashboard';

const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/gallery', element: <GalleryView /> },
  { path: '/room/:id', element: <RoomDetails /> },
  { path: '/activities', element: <Activities /> },
  {
    path: '/admin/picturemanagement',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <PictureManagement />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/reservation',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <Reservation />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/rooms',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <Rooms />
      </ProtectedRoute>
    ),
  },
  {
  path: '/admin',
  element: (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminDashboard />
    </ProtectedRoute>
  ),
}
]);

export default router;

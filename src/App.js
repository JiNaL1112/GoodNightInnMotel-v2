import React ,{useContext}  from 'react';
// components
import Header from './components/Header';
import Footer from './components/Footer';

//pages
import Home from './pages/Home';
import RoomDetails from './pages/RoomDetails';
import AdminDashboard from './pages/AdminDashboard';
import GalleryView from './pages/GalleryView';
import Reservation from './pages/admin/Reservation'

import { AuthContext } from './context/AuthContext';

import router from './routes'; // defined separately


// react router

import {createBrowserRouter , RouterProvider} from 'react-router-dom' ;



const App = () => {
  
  return <div>
    <Header  />
    <RouterProvider router={router} />
    <Footer />
  </div>;
};

export default App;

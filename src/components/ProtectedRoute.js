// components/ProtectedRoute.js
import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
//loader
import { SpinnerDotted} from 'spinners-react';

const ProtectedRoute = ({ allowedRoles, children }) => {
  const { user, role, loading } = useContext(AuthContext);

  if (loading) return <div className='h-screen fixed bottom-0 top-0 bg-black/90 w-full z-50 flex justify-center items-center'>
           <SpinnerDotted color='white'/>
        </div>;
  
  if (!user || !allowedRoles.includes(role)) return <Navigate to="/" />;

  return children;
};

export default ProtectedRoute;

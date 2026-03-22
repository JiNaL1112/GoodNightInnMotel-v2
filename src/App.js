import Header from './components/Header';
import Footer from './components/Footer';
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

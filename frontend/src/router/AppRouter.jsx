import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminRoutes from './AdminRoutes';
import AddDish from '../pages/admin/AddDish.jsx';
import EditDish from '../pages/admin/EditDish.jsx'
import KDS from '../pages/admin/KDS.jsx';
import ARViewer from '../pages/customer/ARviewer.jsx';
import Login from '../pages/admin/Login.jsx';
import Dashboard from '../pages/admin/Dashboard.jsx';
import Menu from '../pages/customer/Menu.jsx';
import DishDetails from '../pages/customer/DishDetails.jsx';
import TrackOrder from '../pages/customer/TrackOrder.jsx';
import OrderCart from '../pages/customer/OrderCart.jsx';

const AppRouter = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Menu />} />
                <Route path="/dish/:id" element={<DishDetails />} />
                <Route path="/login" element={<Login />} />
                <Route path="/admin/dashboard" element={<AdminRoutes> <Dashboard /> </AdminRoutes>} />
                <Route path="/admin/add-dish" element={<AdminRoutes> <AddDish /> </AdminRoutes>} />
                <Route path="/admin/edit-dish/:id" element={<AdminRoutes> <EditDish /> </AdminRoutes>} />
                <Route path="/ar/:id" element={<ARViewer />} />
                <Route path="/track-order" element={<TrackOrder />} />
                <Route path="/cart" element={<OrderCart />} />
                <Route path="/kds" element={<KDS />} />
            </Routes>
        </BrowserRouter>
    )
}

export default AppRouter;
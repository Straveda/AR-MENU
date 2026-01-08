import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider from '../context/AuthProvider';
import TenantProvider from '../context/TenantProvider';
import SocketProvider from '../context/SocketProvider';
import { OrderProvider } from '../context/OrderContext';
import ErrorBoundary from '../components/common/ErrorBoundary';
import RoleGuard from './RoleGuard';

import Login from '../pages/admin/Login.jsx';
import AnalyticsDashboard from '../pages/admin/AnalyticsDashboard.jsx';
import MenuManagement from '../pages/admin/MenuManagement.jsx';
import AddDish from '../pages/admin/AddDish.jsx';
import EditDish from '../pages/admin/EditDish.jsx';
import StaffManagement from '../pages/admin/StaffManagement.jsx';
import Inventory from '../pages/admin/Inventory.jsx';
import KDS from '../pages/admin/KDS.jsx';
import ComingSoon from '../pages/staff/ComingSoon.jsx';

import Menu from '../pages/customer/Menu.jsx';
import DishDetails from '../pages/customer/DishDetails.jsx';
import ARViewer from '../pages/customer/ARviewer.jsx';
import TrackOrderV2 from '../pages/customer/TrackOrder.jsx';
import OrderCart from '../pages/customer/OrderCart.jsx';

import PlatformLayout from '../pages/platform/PlatformLayout.jsx';
import PlatformDashboard from '../pages/platform/PlatformDashboard.jsx';
import RestaurantsManagement from '../pages/platform/RestaurantsManagement.jsx';
import UsersManagement from '../pages/platform/UsersManagement.jsx';
import SubscriptionsManagement from '../pages/platform/SubscriptionsManagement.jsx';
import PlansManagement from '../pages/platform/PlansManagement.jsx';
import LandingPage from '../pages/LandingPage.jsx';

import AdminLayout from '../components/layout/AdminLayout.jsx';
import ExpensesPage from '../pages/admin/ExpensesPage.jsx';

const AppRouter = () => {
    return (
        <BrowserRouter>
            <AuthProvider>
                <TenantProvider>
                    <SocketProvider>
                        <OrderProvider>
                            <ErrorBoundary>
                                <Routes>
                                    {}
                                    <Route path="/login" element={<Login />} />

                                    {}
                                    <Route element={<RoleGuard allowedRoles={['SUPER_ADMIN']} />}>
                                        <Route element={<PlatformLayout />}>
                                            <Route path="/platform" element={<Navigate to="/platform/dashboard" replace />} />
                                            <Route path="/platform/dashboard" element={<PlatformDashboard />} />
                                            <Route path="/platform/restaurants" element={<RestaurantsManagement />} />
                                            <Route path="/platform/users" element={<UsersManagement />} />
                                            <Route path="/platform/subscriptions" element={<SubscriptionsManagement />} />
                                            <Route path="/platform/plans" element={<PlansManagement />} />
                                        </Route>
                                    </Route>

                                    {}
                                    <Route element={<RoleGuard allowedRoles={['RESTAURANT_ADMIN']} />}>
                                        <Route element={<AdminLayout />}>
                                            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                                            <Route path="/admin/dashboard" element={<AnalyticsDashboard />} />
                                            <Route path="/admin/menu" element={<MenuManagement />} />

                                            <Route path="/admin/add-dish" element={<AddDish />} />
                                            <Route path="/admin/edit-dish/:id" element={<EditDish />} />
                                            <Route path="/admin/staff" element={<StaffManagement />} />
                                            <Route path="/admin/inventory" element={<Inventory />} />
                                            <Route path="/admin/expenses" element={<ExpensesPage />} />
                                        </Route>
                                    </Route>

                                    {}
                                    <Route element={<RoleGuard allowedRoles={['KDS', 'RESTAURANT_ADMIN']} />}>
                                        <Route path="/staff/kds" element={<KDS />} />
                                        <Route path="/staff/coming-soon" element={<ComingSoon />} />
                                        {}
                                        <Route path="/kds" element={<Navigate to="/staff/kds" replace />} />
                                    </Route>

                                    {}
                                    {}
                                    <Route path="/r/:slug" element={<Menu />} />
                                    <Route path="/r/:slug/menu" element={<Menu />} />
                                    <Route path="/r/:slug/dish/:id" element={<DishDetails />} />
                                    <Route path="/r/:slug/ar/:id" element={<ARViewer />} />
                                    <Route path="/r/:slug/track-order" element={<TrackOrderV2 />} />
                                    <Route path="/r/:slug/cart" element={<OrderCart />} />

                                    {}
                                    <Route path="/" element={<LandingPage />} />
                                </Routes>
                            </ErrorBoundary>
                        </OrderProvider>
                    </SocketProvider>
                </TenantProvider>
            </AuthProvider>
        </BrowserRouter>
    )
}

export default AppRouter;
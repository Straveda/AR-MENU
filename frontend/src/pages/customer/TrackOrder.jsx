// import { useState, useEffect } from "react";
// import axiosClient from "../../api/axiosClient";
// import { useSocket } from "../../context/SocketProvider";
// import { useTenant } from "../../context/TenantProvider";

// export default function TrackOrderV2() {
//     const { socket, connect, disconnect, joinRoom, leaveRoom } = useSocket();
//     const { slug } = useTenant();

//     const [orderCode, setOrderCode] = useState("");
//     const [orderData, setOrderData] = useState(null);
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState("");
//     const [hasSearched, setHasSearched] = useState(false);
//     const [isLive, setIsLive] = useState(false);

//     const getStatusColor = (status) => {
//         switch (status?.toLowerCase()) {
//             case "pending":
//                 return "bg-yellow-100 text-yellow-800 border-yellow-200";
//             case "preparing":
//                 return "bg-orange-100 text-orange-800 border-orange-200";
//             case "ready":
//                 return "bg-green-100 text-green-800 border-green-200";
//             case "completed":
//                 return "bg-blue-100 text-blue-800 border-blue-200";
//             default:
//                 return "bg-gray-100 text-gray-800 border-gray-200";
//         }
//     };

//     useEffect(() => {
//         const params = new URLSearchParams(window.location.search);
//         const code = params.get("code");
//         if (code) {
//             setOrderCode(code);
//             trackOrderInternal(code);
//         }
//     }, []);

//     const trackOrderInternal = async (code) => {
//         if (!code) return;
//         setLoading(true);
//         setError("");

//         if (!slug) {
//             setError("Restaurant context missing. Please try again from the menu.");
//             setLoading(false);
//             return;
//         }

//         setHasSearched(true);
//         try {
//             const res = await axiosClient.get(`/orders/r/${slug}/track/${code}`);
//             if (res.data.success) {
//                 setOrderData(res.data.data);
//             }
//         } catch (err) {
//             console.error("Error tracking order:", err);
//             setError(err.response?.data?.message || "Order not found. Please check the code and try again.");
//             setOrderData(null);
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => {
//         if (!orderData || !orderData.restaurantId || !orderData.orderCode) return;

//         connect();

//         const roomName = `ORDER_ROOM_${orderData.restaurantId}_${orderData.orderCode}`;

//         joinRoom(roomName);
//         setIsLive(true);

//         const handleUpdate = (updatedOrder) => {
//             console.log("Realtime Update Received:", updatedOrder);

//             if (updatedOrder.orderCode === orderData.orderCode) {

//                 setOrderData(prev => ({ ...prev, ...updatedOrder }));
//             }
//         };

//         socket.on("order_status_updated", handleUpdate);

//         socket.on("disconnect", () => setIsLive(false));
//         socket.on("connect", () => {
//              joinRoom(roomName);
//              setIsLive(true);
//         });

//         return () => {
//             socket.off("order_status_updated", handleUpdate);
//             socket.off("disconnect");
//             socket.off("connect");
//             leaveRoom(roomName);

//         };
//     }, [orderData?.restaurantId, orderData?.orderCode, connect, joinRoom, leaveRoom, socket]);

//     useEffect(() => {
//         if (!orderData) return;

//         const interval = setInterval(() => {

//             if (!socket.connected) {
//                 trackOrderInternal(orderData.orderCode);
//             }
//         }, 15000);

//         return () => clearInterval(interval);
//     }, [orderData?.orderCode, socket]);

//     const handleTrackOrder = (e) => {
//         e.preventDefault();
//         trackOrderInternal(orderCode);
//     };

//     return (
//         <div className="min-h-screen bg-amber-50 px-4 py-8 flex flex-col items-center">
//             {}
//             <div className="text-center mb-10 w-full max-w-2xl">
//                 <h1 className="type-h1 text-gray-800 mb-2 tracking-wide">
//                     Track Your Order
//                 </h1>
//                 <div className="w-20 h-1 bg-amber-600 mx-auto mb-4"></div>
//                 <p className="type-secondary">
//                     Enter your unique order code to see the realtime status of your meal.
//                 </p>
//             </div>

//             {}
//             <div className="card-premium w-full max-w-md p-6 border-amber-100/50 mb-8">
//                 <form onSubmit={handleTrackOrder} className="flex flex-col gap-4">
//                     <div>
//                         <label htmlFor="orderCode" className="block type-label mb-1">
//                             Enter your order code
//                         </label>
//                         <input
//                             id="orderCode"
//                             type="text"
//                             value={orderCode}
//                             onChange={(e) => setOrderCode(e.target.value.toUpperCase())}
//                             placeholder="e.g., DYP9Q"
//                             className="w-full px-4 py-3 text-lg border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-amber-50 transition-all uppercase placeholder:normal-case"
//                         />
//                     </div>
//                     <button
//                         type="submit"
//                         disabled={loading || !orderCode.trim()}
//                         className="w-full bg-amber-600 hover:bg-amber-700 type-btn text-white py-3 rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex justify-center items-center"
//                     >
//                         {loading ? (
//                             <>
//                                 <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                                 </svg>
//                                 Tracking...
//                             </>
//                         ) : (
//                             "Track Order"
//                         )}
//                     </button>
//                 </form>
//             </div>

//             {}
//             <div className="w-full max-w-2xl transition-all duration-500 ease-in-out">
//                 {error && (
//                     <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-sm animate-fade-in">
//                         <div className="flex">
//                             <div className="shrink-0">
//                                 <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
//                                     <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
//                                 </svg>
//                             </div>
//                             <div className="ml-3">
//                                 <p className="text-sm text-red-700 font-medium">
//                                     {error}
//                                 </p>
//                             </div>
//                         </div>
//                     </div>
//                 )}

//                 {orderData && (
//                     <div className="card-premium overflow-hidden border-amber-100/50 animate-slide-up relative">
//                         {}
//                         {isLive && (
//                            <div className="absolute top-4 right-1/2 translate-x-1/2 sm:translate-x-0 sm:right-6 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-green-600 border border-green-100 shadow-sm flex items-center gap-2 z-10 animate-pulse">
//                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
//                                LIVE UPDATES
//                            </div>
//                         )}
//                         {!isLive && (
//                              <div className="absolute top-4 right-1/2 translate-x-1/2 sm:translate-x-0 sm:right-6 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-500 border border-gray-100 shadow-sm flex items-center gap-2 z-10">
//                                <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
//                                OFFLINE (Polling)
//                            </div>
//                         )}

//                         {}
//                         <div className="bg-amber-600 px-6 py-4 flex justify-between items-center text-white mt-8 sm:mt-0">
//                             <div>
//                                 <p className="text-amber-100 type-label mb-1">Order Code</p>
//                                 <p className="type-metric font-bold">{orderData.orderCode}</p>
//                             </div>
//                             <div className="text-right">
//                                 <p className="text-amber-100 type-label mb-1">Table No</p>
//                                 <p className="type-metric font-bold">{orderData.tableNumber}</p>
//                             </div>
//                         </div>

//                         {}
//                         <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
//                             <span className="type-body text-gray-600 font-medium">Current Status</span>
//                             <span className={`px-4 py-1.5 rounded-full badge-standard border ${getStatusColor(orderData.orderStatus)} shadow-sm transition-all duration-300`}>
//                                 {orderData.orderStatus}
//                             </span>
//                         </div>

//                         {}
//                         <div className="p-6">
//                             <h3 className="type-h3 text-gray-800 mb-4 border-b pb-2">Order Items</h3>
//                             <div className="space-y-4">
//                                 {orderData.orderItems.map((item, index) => (
//                                     <div key={index} className="flex justify-between items-center">
//                                         <div className="flex items-center gap-3">
//                                             <div className="bg-amber-100 text-amber-800 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
//                                                 {item.quantity}x
//                                             </div>
//                                             <div>
//                                                 <p className="type-body text-gray-800 font-medium">{item.name}</p>
//                                             </div>
//                                         </div>
//                                         {}
//                                         {item.lineTotal ? (
//                                             <p className="text-gray-600 font-medium">₹{item.lineTotal}</p>
//                                         ) : (
//                                             <p className="text-gray-600 font-medium">--</p>
//                                         )}
//                                     </div>
//                                 ))}
//                             </div>

//                             {}
//                             <div className="mt-8 pt-4 border-t border-gray-100 flex justify-between items-center">
//                                 <span className="type-h3 text-gray-600">Total Amount</span>
//                                 <span className="type-metric text-amber-600">₹{orderData.total}</span>
//                             </div>
//                         </div>

//                         <div className="bg-gray-50 px-6 py-3 text-center border-t border-amber-100">
//                             <p className="text-xs text-gray-500">Thank you for dining with us!</p>
//                         </div>
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// }

// ----------------------------- Dark below -----------------------------

// import { useState, useEffect } from "react";
// import axiosClient from "../../api/axiosClient";
// import { useSocket } from "../../context/SocketProvider";
// import { useTenant } from "../../context/TenantProvider";

// export default function TrackOrderV2() {
//     const { socket, connect, disconnect, joinRoom, leaveRoom } = useSocket();
//     const { slug } = useTenant();

//     const [orderCode, setOrderCode] = useState("");
//     const [orderData, setOrderData] = useState(null);
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState("");
//     const [hasSearched, setHasSearched] = useState(false);
//     const [isLive, setIsLive] = useState(false);

//     const getStatusColor = (status) => {
//         switch (status?.toLowerCase()) {
//             case "pending":
//                 return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
//             case "preparing":
//                 return "bg-orange-500/20 text-orange-300 border-orange-500/30";
//             case "ready":
//                 return "bg-green-500/20 text-green-300 border-green-500/30";
//             case "completed":
//                 return "bg-blue-500/20 text-blue-300 border-blue-500/30";
//             default:
//                 return "bg-slate-500/20 text-slate-300 border-slate-500/30";
//         }
//     };

//     useEffect(() => {
//         const params = new URLSearchParams(window.location.search);
//         const code = params.get("code");
//         if (code) {
//             setOrderCode(code);
//             trackOrderInternal(code);
//         }
//     }, []);

//     const trackOrderInternal = async (code) => {
//         if (!code) return;
//         setLoading(true);
//         setError("");

//         if (!slug) {
//             setError("Restaurant context missing. Please try again from the menu.");
//             setLoading(false);
//             return;
//         }

//         setHasSearched(true);
//         try {
//             const res = await axiosClient.get(`/orders/r/${slug}/track/${code}`);
//             if (res.data.success) {
//                 setOrderData(res.data.data);
//             }
//         } catch (err) {
//             console.error("Error tracking order:", err);
//             setError(err.response?.data?.message || "Order not found. Please check the code and try again.");
//             setOrderData(null);
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => {
//         if (!orderData || !orderData.restaurantId || !orderData.orderCode) return;

//         connect();

//         const roomName = `ORDER_ROOM_${orderData.restaurantId}_${orderData.orderCode}`;

//         joinRoom(roomName);
//         setIsLive(true);

//         const handleUpdate = (updatedOrder) => {
//             console.log("Realtime Update Received:", updatedOrder);

//             if (updatedOrder.orderCode === orderData.orderCode) {

//                 setOrderData(prev => ({ ...prev, ...updatedOrder }));
//             }
//         };

//         socket.on("order_status_updated", handleUpdate);

//         socket.on("disconnect", () => setIsLive(false));
//         socket.on("connect", () => {
//             joinRoom(roomName);
//             setIsLive(true);
//         });

//         return () => {
//             socket.off("order_status_updated", handleUpdate);
//             socket.off("disconnect");
//             socket.off("connect");
//             leaveRoom(roomName);

//         };
//     }, [orderData?.restaurantId, orderData?.orderCode, connect, joinRoom, leaveRoom, socket]);

//     useEffect(() => {
//         if (!orderData) return;

//         const interval = setInterval(() => {

//             if (!socket.connected) {
//                 trackOrderInternal(orderData.orderCode);
//             }
//         }, 15000);

//         return () => clearInterval(interval);
//     }, [orderData?.orderCode, socket]);

//     const handleTrackOrder = (e) => {
//         e.preventDefault();
//         trackOrderInternal(orderCode);
//     };

//     return (
//         <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-8 flex flex-col items-center">
//             {/* Header */}
//             <div className="text-center mb-10 w-full max-w-2xl">
//                 <h1 className="text-3xl md:text-4xl font-bold text-slate-100 mb-2 tracking-wide">
//                     Track Your Order
//                 </h1>
//                 <div className="w-20 h-1 bg-gradient-to-r from-amber-500 to-orange-600 mx-auto mb-4 rounded-full"></div>
//                 <p className="text-slate-400">
//                     Enter your unique order code to see the realtime status of your meal.
//                 </p>
//             </div>

//             {/* Search Form */}
//             <div className="bg-slate-800/40 backdrop-blur-sm w-full max-w-md p-6 border border-slate-700/50 rounded-2xl mb-8 shadow-2xl">
//                 <form onSubmit={handleTrackOrder} className="flex flex-col gap-4">
//                     <div>
//                         <label htmlFor="orderCode" className="block text-sm font-bold text-slate-100 mb-1">
//                             Enter your order code
//                         </label>
//                         <input
//                             id="orderCode"
//                             type="text"
//                             value={orderCode}
//                             onChange={(e) => setOrderCode(e.target.value.toUpperCase())}
//                             placeholder="e.g., DYP9Q"
//                             className="w-full px-4 py-3 text-lg border border-slate-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/50 bg-slate-700/50 text-slate-100 placeholder-slate-500 transition-all uppercase placeholder:normal-case shadow-inner"
//                         />
//                     </div>
//                     <button
//                         type="submit"
//                         disabled={loading || !orderCode.trim()}
//                         className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-3 rounded-lg shadow-lg shadow-amber-500/20 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex justify-center items-center border border-amber-500/30"
//                     >
//                         {loading ? (
//                             <>
//                                 <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                                 </svg>
//                                 Tracking...
//                             </>
//                         ) : (
//                             "Track Order"
//                         )}
//                     </button>
//                 </form>
//             </div>

//             {/* Results Section */}
//             <div className="w-full max-w-2xl transition-all duration-500 ease-in-out">
//                 {error && (
//                     <div className="bg-red-500/10 border-l-4 border-red-500 p-4 rounded-md shadow-lg animate-fade-in backdrop-blur-sm">
//                         <div className="flex">
//                             <div className="shrink-0">
//                                 <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
//                                     <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
//                                 </svg>
//                             </div>
//                             <div className="ml-3">
//                                 <p className="text-sm text-red-300 font-medium">
//                                     {error}
//                                 </p>
//                             </div>
//                         </div>
//                     </div>
//                 )}

//                 {orderData && (
//                     <div className="bg-slate-800/40 backdrop-blur-sm overflow-hidden border border-slate-700/50 rounded-2xl animate-slide-up relative shadow-2xl">
//                         {/* Live Status Badge */}
//                         {isLive && (
//                             <div className="absolute top-4 right-1/2 translate-x-1/2 sm:translate-x-0 sm:right-6 bg-green-500/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-green-300 border border-green-500/30 shadow-lg flex items-center gap-2 z-10 animate-pulse">
//                                 <span className="w-2 h-2 bg-green-400 rounded-full"></span>
//                                 LIVE UPDATES
//                             </div>
//                         )}
//                         {!isLive && (
//                             <div className="absolute top-4 right-1/2 translate-x-1/2 sm:translate-x-0 sm:right-6 bg-slate-700/50 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-slate-400 border border-slate-600/30 shadow-lg flex items-center gap-2 z-10">
//                                 <span className="w-2 h-2 bg-slate-500 rounded-full"></span>
//                                 OFFLINE (Polling)
//                             </div>
//                         )}

//                         {/* Header Section */}
//                         <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-4 flex justify-between items-center text-white mt-8 sm:mt-0">
//                             <div>
//                                 <p className="text-amber-100 text-xs font-medium mb-1">Order Code</p>
//                                 <p className="text-2xl font-bold">{orderData.orderCode}</p>
//                             </div>
//                             <div className="text-right">
//                                 <p className="text-amber-100 text-xs font-medium mb-1">Table No</p>
//                                 <p className="text-2xl font-bold">{orderData.tableNumber}</p>
//                             </div>
//                         </div>

//                         {/* Status Section */}
//                         <div className="px-6 py-4 bg-slate-900/50 border-b border-slate-700/50 flex justify-between items-center">
//                             <span className="text-sm font-medium text-slate-300">Current Status</span>
//                             <span className={`px-4 py-1.5 rounded-full text-xs font-bold border ${getStatusColor(orderData.orderStatus)} shadow-sm transition-all duration-300`}>
//                                 {orderData.orderStatus}
//                             </span>
//                         </div>

//                         {/* Order Items */}
//                         <div className="p-6">
//                             <h3 className="text-lg font-bold text-slate-100 mb-4 pb-2 border-b border-slate-700/50">Order Items</h3>
//                             <div className="space-y-4">
//                                 {orderData.orderItems.map((item, index) => (
//                                     <div key={index} className="flex justify-between items-center">
//                                         <div className="flex items-center gap-3">
//                                             <div className="bg-amber-500/20 text-amber-400 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border border-amber-500/30">
//                                                 {item.quantity}x
//                                             </div>
//                                             <div>
//                                                 <p className="text-sm font-medium text-slate-100">{item.name}</p>
//                                             </div>
//                                         </div>
//                                         {/* Line Total */}
//                                         {item.lineTotal ? (
//                                             <p className="text-slate-300 font-medium">₹{item.lineTotal}</p>
//                                         ) : (
//                                             <p className="text-slate-500 font-medium">--</p>
//                                         )}
//                                     </div>
//                                 ))}
//                             </div>

//                             {/* Total Section */}
//                             <div className="mt-8 pt-4 border-t border-slate-700/50 flex justify-between items-center">
//                                 <span className="text-lg font-bold text-slate-300">Total Amount</span>
//                                 <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">₹{orderData.total}</span>
//                             </div>
//                         </div>

//                         {/* Footer */}
//                         <div className="bg-slate-900/50 px-6 py-3 text-center border-t border-slate-700/50">
//                             <p className="text-xs text-slate-500">Thank you for dining with us!</p>
//                         </div>
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// }

// ------------------------------Light below-----------------------------

import { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";
import { useSocket } from "../../context/SocketProvider";
import { useTenant } from "../../context/TenantProvider";
import { useNavigate } from "react-router-dom";
import { useMenuTheme } from "../../hooks/useMenuTheme";
import { useOrder } from "../../context/OrderContext";

export default function TrackOrderV2() {
    const { socket, connect, disconnect, joinRoom, leaveRoom } = useSocket();
    const { slug } = useTenant();
    const navigate = useNavigate();
    const { updateOrderStatusInHistory } = useOrder();
    useMenuTheme(slug);

    const [orderCode, setOrderCode] = useState("");
    const [orderData, setOrderData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [hasSearched, setHasSearched] = useState(false);
    const [isLive, setIsLive] = useState(false);

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case "pending":
                return "bg-yellow-50 text-yellow-600 border-yellow-200";
            case "preparing":
                return "bg-orange-50 text-orange-600 border-orange-200";
            case "ready":
                return "bg-green-50 text-green-600 border-green-200";
            case "completed":
                return "bg-blue-50 text-blue-600 border-blue-200";
            default:
                return "bg-slate-50 text-slate-600 border-slate-200";
        }
    };

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        if (code) {
            setOrderCode(code);
            trackOrderInternal(code);
        }
    }, []);

    const trackOrderInternal = async (code) => {
        if (!code) return;
        setLoading(true);
        setError("");

        if (!slug) {
            setError("Restaurant context missing. Please try again from the menu.");
            setLoading(false);
            return;
        }

        setHasSearched(true);
        try {
            const res = await axiosClient.get(`/orders/r/${slug}/track/${code}`);
            if (res.data.success) {
                setOrderData(res.data.data);
            }
        } catch (err) {
            console.error("Error tracking order:", err);
            setError(err.response?.data?.message || "Order not found. Please check the code and try again.");
            setOrderData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!orderData || !orderData.restaurantId || !orderData.orderCode) return;

        connect();

        const roomName = `ORDER_ROOM_${orderData.restaurantId}_${orderData.orderCode}`;

        const handleUpdate = (updatedOrder) => {
            if (updatedOrder.orderCode === orderData.orderCode) {
                setOrderData(prev => ({ ...prev, ...updatedOrder }));
                // Keep My Orders page in sync
                if (updatedOrder.orderStatus) {
                    updateOrderStatusInHistory(updatedOrder.orderCode, slug, updatedOrder.orderStatus);
                }
            }
        };

        // Join the room only once the socket is connected (fixes race condition)
        const handleConnect = () => {
            joinRoom(roomName);
            setIsLive(true);
        };

        const handleDisconnect = () => setIsLive(false);

        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);
        socket.on("order_status_updated", handleUpdate);

        // If socket is already connected when this effect runs, join immediately
        if (socket.connected) {
            joinRoom(roomName);
            setIsLive(true);
        }

        return () => {
            socket.off("connect", handleConnect);
            socket.off("disconnect", handleDisconnect);
            socket.off("order_status_updated", handleUpdate);
            leaveRoom(roomName);
        };
    }, [orderData?.restaurantId, orderData?.orderCode, connect, joinRoom, leaveRoom, socket, slug, updateOrderStatusInHistory]);

    useEffect(() => {
        if (!orderData) return;

        const interval = setInterval(() => {
            if (!socket.connected) {
                trackOrderInternal(orderData.orderCode);
            }
        }, 15000);

        return () => clearInterval(interval);
    }, [orderData?.orderCode, socket]);

    const handleTrackOrder = (e) => {
        e.preventDefault();
        trackOrderInternal(orderCode);
    };

    return (
        <div className="min-h-screen min-h-dvh" style={{ background: 'var(--menu-bg)', color: 'var(--menu-secondary)', fontFamily: 'var(--menu-font)' }}>
            {/* Header */}
            <div className="backdrop-blur-md border-b sticky top-0 z-30 shadow-sm" style={{ background: 'var(--menu-bg)', borderColor: 'var(--menu-accent)', opacity: 0.98 }}>
                <div className="max-w-7xl mx-auto px-4 py-4 md:py-8 flex flex-col items-center text-center">
                    <h1 className="text-xl md:text-3xl font-black tracking-tight mb-2" style={{ color: 'var(--menu-secondary)' }}>
                        Track Your Order
                    </h1>
                    <p className="text-slate-500 font-medium max-w-lg mx-auto">
                        Real-time updates from our kitchen to your table. Watch your meal's journey!
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-5 md:py-10 flex flex-col items-center">

                {/* Search Form */}
                <div className="bg-white w-full max-w-xl p-4 md:p-8 border border-slate-100 rounded-3xl mb-6 shadow-xl shadow-slate-200/50 animate-slide-up">
                    <form onSubmit={handleTrackOrder} className="flex flex-col gap-6">
                        <div>
                            <label htmlFor="orderCode" className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
                                Order Identifying Code
                            </label>
                            <div className="relative group">
                                <input
                                    id="orderCode"
                                    type="text"
                                    value={orderCode}
                                    onChange={(e) => setOrderCode(e.target.value.toUpperCase())}
                                    placeholder="e.g., DYP9Q"
                                    className="w-full px-4 py-3 text-base font-black border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 bg-slate-50 text-slate-800 placeholder:text-slate-300 transition-all uppercase placeholder:normal-case shadow-inner"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-amber-500 transition-colors">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !orderCode.trim()}
                            className="w-full font-black py-4 rounded-2xl shadow-xl transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex justify-center items-center gap-3 border"
                            style={{ background: 'var(--menu-primary)', color: 'var(--menu-primary-text)', borderColor: 'var(--menu-primary)' }}
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    <span className="tracking-wide">Searching...</span>
                                </>
                            ) : (
                                <>
                                    <span className="text-sm">Track Details</span>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Results Section */}
                <div className="w-full max-w-2xl transition-all duration-500 ease-in-out px-2">
                    {error && (
                        <div className="bg-red-50 border border-red-100 p-5 rounded-3xl shadow-lg animate-fade-in flex items-center gap-4">
                            <div className="bg-red-500/10 p-2 rounded-xl">
                                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <p className="text-sm text-red-800 font-black">
                                {error}
                            </p>
                        </div>
                    )}

                    {orderData && (
                        <div className="bg-white overflow-hidden border border-slate-100 rounded-[2.5rem] animate-slide-up relative shadow-2xl">
                            {/* Status Badges Overlay */}
                            <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                                {isLive ? (
                                    <div className="bg-emerald-50 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black text-emerald-600 border border-emerald-100 shadow-sm flex items-center gap-2 animate-pulse">
                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                        LIVE STATUS
                                    </div>
                                ) : (
                                    <div className="bg-slate-50 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black text-slate-400 border border-slate-100 shadow-sm flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
                                        PAUSED SYNC
                                    </div>
                                )}
                            </div>

                            {/* Top Gradient Card */}
                            <div className="bg-gradient-to-br from-amber-500 to-orange-600 px-5 py-8 flex justify-between items-center text-white relative">
                                {/* Decorative Pattern */}
                                <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                                    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                                        <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
                                    </svg>
                                </div>

                                <div className="relative z-10">
                                    <p className="text-amber-100 text-xs font-black uppercase tracking-widest mb-2">Order Identification</p>
                                    <p className="text-2xl font-black tabular-nums">{orderData.orderCode}</p>
                                </div>
                                <div className="text-right relative z-10">
                                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-2 ml-auto backdrop-blur-sm border border-white/30">
                                        <span className="text-2xl">📍</span>
                                    </div>
                                    <p className="text-amber-100 text-xs font-black uppercase tracking-widest mb-1">Table</p>
                                    <p className="text-xl font-black">{orderData.tableNumber}</p>
                                </div>
                            </div>

                            {/* Status Visualization */}
                            <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center gap-4">
                                <div className={`p-3 rounded-2xl ${getStatusColor(orderData.orderStatus)} shadow-inner`}>
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-0.5">Kitchen Progress</p>
                                    <p className={`text-xl font-black uppercase tracking-tight ${getStatusColor(orderData.orderStatus).split(' ')[1]}`}>
                                        {orderData.orderStatus}
                                    </p>
                                </div>
                            </div>

                            {/* Order Content */}
                            <div className="p-5">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-3">Kitchen Ticket</h3>
                                <div className="space-y-6">
                                    {orderData.orderItems.map((item, index) => (
                                        <div key={index} className="flex justify-between items-center group">
                                            <div className="flex items-center gap-4">
                                                <div className="bg-slate-50 text-amber-600 w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm border border-slate-100 shadow-sm group-hover:scale-110 transition-transform">
                                                    {item.quantity}x
                                                </div>
                                                <div>
                                                    <p className="text-base font-black text-slate-800 leading-tight">{item.name}</p>
                                                    <p className="text-xs font-bold text-slate-400 mt-0.5">Unit Price: ₹{item.price || item.unitPrice || '--'}</p>
                                                </div>
                                            </div>
                                            <p className="text-base font-black text-slate-700">₹{item.lineTotal || (item.quantity * (item.price || item.unitPrice || 0))}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Total Summary */}
                                <div className="mt-10 pt-6 border-t border-dashed border-slate-200 flex justify-between items-center">
                                    <div>
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">Settlement Amount</span>
                                        <span className="text-4xl font-black text-slate-900 leading-none">₹{orderData.total}</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-[10px] font-black border border-emerald-100 mb-1 inline-block">PAID VIA TABLE</div>
                                        <p className="text-[10px] font-bold text-slate-400 italic">Included all taxes & charges</p>
                                    </div>
                                </div>
                            </div>

                            {/* Order Footer */}
                            <div className="bg-slate-50 px-8 py-4 text-center border-t border-slate-100">
                                <p className="text-xs font-bold text-slate-400 tracking-wider">
                                    ✨ Please show this screen to the waiter if requested.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Helpful Actions */}
                <div className="mt-10 flex gap-4">
                    <button
                        onClick={() => navigate(`/r/${slug}/menu`)}
                        className="px-6 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-black text-slate-600 hover:text-amber-600 hover:border-amber-200 transition-all shadow-sm active:scale-95 flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7 7-7m-7 7h18" />
                        </svg>
                        Back to Menu
                    </button>
                    <button
                        onClick={() => navigate(`/r/${slug}/my-orders`)}
                        className="px-6 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-black text-slate-600 hover:text-amber-600 hover:border-amber-200 transition-all shadow-sm active:scale-95 flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        My Orders
                    </button>
                </div>
            </div>
        </div>
    );
}



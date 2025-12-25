import AppRouter from "./router/AppRouter";
import AuthProvider from "./context/AuthContext";
import { OrderProvider } from "./context/OrderContext";

function App() {
  return (
    <AuthProvider>
      <OrderProvider>
        <AppRouter />
      </OrderProvider>
    </AuthProvider>
  );
}

export default App;

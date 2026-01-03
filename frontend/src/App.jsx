import AppRouter from "./router/AppRouter";
import { ToastProvider } from "./components/common/Toast/ToastContext";

function App() {
  return (
    <ToastProvider>
      <AppRouter />
    </ToastProvider>
  );
}

export default App;

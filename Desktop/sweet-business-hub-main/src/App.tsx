import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ThemeProvider } from "@/components/ThemeProvider";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import POS from "./pages/POS";
import Sales from "./pages/Sales";
import Purchases from "./pages/Purchases";
import Inventory from "./pages/Inventory";
import Customers from "./pages/Customers";
import Suppliers from "./pages/Suppliers";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Categories from "./pages/Categories";
import Brands from "./pages/Brands";
import Units from "./pages/Units";
import ServiceOrders from "./pages/ServiceOrders";
import Technicians from "./pages/Technicians";
import ServiceTypes from "./pages/ServiceTypes";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/pos" element={<ProtectedRoute><POS /></ProtectedRoute>} />
              <Route path="/sales" element={<ProtectedRoute><Sales /></ProtectedRoute>} />
              <Route path="/purchases" element={<ProtectedRoute><Purchases /></ProtectedRoute>} />
              <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
              <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
              <Route path="/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
              <Route path="/brands" element={<ProtectedRoute><Brands /></ProtectedRoute>} />
              <Route path="/units" element={<ProtectedRoute><Units /></ProtectedRoute>} />
              <Route path="/service-orders" element={<ProtectedRoute><ServiceOrders /></ProtectedRoute>} />
              <Route path="/technicians" element={<ProtectedRoute><Technicians /></ProtectedRoute>} />
              <Route path="/service-types" element={<ProtectedRoute><ServiceTypes /></ProtectedRoute>} />
              <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
              <Route path="/suppliers" element={<ProtectedRoute><Suppliers /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

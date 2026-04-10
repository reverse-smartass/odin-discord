// ============================================================
// src/App.jsx
// ============================================================

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ChatLayout from "./pages/ChatLayout";
import PeoplePage from "./pages/PeoplePage";
import ChatRoom from "./pages/ChatRoom";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import NotPermittedPage from "./pages/NotPermittedPage";

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/not-permitted" replace />;
}

function GuestRoute({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to="/chat" replace /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<GuestRoute><HomePage /></GuestRoute>} />
          <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/signup" element={<GuestRoute><SignupPage /></GuestRoute>} />
          <Route path="/not-permitted" element={<NotPermittedPage />} />
          <Route
            path="/chat"
            element={<PrivateRoute><ChatLayout /></PrivateRoute>}
          >
            <Route index element={<PeoplePage />} />
            <Route path="people" element={<PeoplePage />} />
            <Route path="room/:chatroomId" element={<ChatRoom />} />
          </Route>
          <Route
            path="/settings/password"
            element={<PrivateRoute><ChangePasswordPage /></PrivateRoute>}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

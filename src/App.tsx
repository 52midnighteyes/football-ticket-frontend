import { Route, Routes } from "react-router";
import LoginPage from "@/pages/auth/login/login.page";
import RegisterPage from "@/pages/auth/register/register.page";

import Navbar from "./components/navbar";
import RequestForgotPasswordPage from "./pages/auth/request-forgot-password/request-forgot-password.page";
import ForgotPasswordVerificationPage from "./pages/auth/forgot-password-verification/forgot-password-verification.page";
import VerifyAccountPage from "./pages/auth/verify-account/verify-account.page";
import UserProfilePage from "./pages/user/profile/profile.page";
import CreateEventPage from "./pages/event/create-event/create-event.page";
import UpdateEventPage from "./pages/event/update-event/update-event.page";
import DashboardPage from "./pages/organizer/dashboard/dashboard.page";
import NotFoundPage from "./pages/not-found/not-found.page";

function App() {
  return (
    <>
      <main className="relative">
        <Navbar />
        <Routes>
          <Route path="/" element={<div>dummy homepage</div>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/forgot-password"
            element={<RequestForgotPasswordPage />}
          />
          <Route
            path="/forgot-password-verification/:token"
            element={<ForgotPasswordVerificationPage />}
          />
          <Route path="/profile" element={<UserProfilePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/event/create" element={<CreateEventPage />} />
          <Route path="/event/update/:id" element={<UpdateEventPage />} />
          <Route path="/verify/:token" element={<VerifyAccountPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </>
  );
}

export default App;

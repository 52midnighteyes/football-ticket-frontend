import { Route, Routes } from "react-router";
import LoginPage from "@/pages/auth/login/login.page";
import RegisterPage from "@/pages/auth/register/register.page";

import Navbar from "./components/navbar";
import RequestForgotPasswordPage from "./pages/auth/request-forgot-password/request-forgot-password.page";
import ForgotPasswordVerificationPage from "./pages/auth/forgot-password-verification/forgot-password-verification.page";

function App() {
  return (
    <>
      <main className="relative">
        <Navbar />
        <Routes>
          <Route path="/" element={""} />
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
        </Routes>
      </main>
    </>
  );
}

export default App;

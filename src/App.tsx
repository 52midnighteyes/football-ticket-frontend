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
import OrganizerEventDetailPage from "./pages/organizer/event-detail/organizer-event-detail.page";
import NotFoundPage from "./pages/not-found/not-found.page";
import HomePage from "./pages/home/home.page";
import TransactionsPage from "./pages/transaction/transactions.page";
import TransactionCheckoutPage from "./pages/transaction/checkout/transaction-checkout.page";
import EventDetailPage from "./pages/event/detail/event-detail.page";

function App() {
  return (
    <>
      <main className="relative">
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
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
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/event/:eventIdentifier" element={<EventDetailPage />} />
          <Route
            path="/dashboard/events/:eventIdentifier"
            element={<OrganizerEventDetailPage />}
          />
          <Route
            path="/transactions/checkout/:eventIdentifier"
            element={<TransactionCheckoutPage />}
          />
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

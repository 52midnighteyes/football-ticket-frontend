import { Route, Routes } from "react-router";
import LoginPage from "@/pages/auth/login/login.page";
import RegisterPage from "@/pages/auth/register/register.page";

import Navbar from "./components/navbar";

function App() {
  return (
    <>
      <main className="relative">
        <Navbar />
        <Routes>
          <Route path="/" element={""} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </main>
    </>
  );
}

export default App;

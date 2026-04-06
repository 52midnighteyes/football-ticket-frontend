import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";

import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>
      <StrictMode>
        <Route path="/" element={<App />} />
      </StrictMode>
    </Routes>
  </BrowserRouter>,
);

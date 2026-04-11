import { Route, Routes } from "react-router";

import Navbar from "./components/navbar";

function App() {
  return (
    <>
      <main className="relative">
        <Navbar />
        <Routes>
          <Route path="/" element={""} />
        </Routes>
      </main>
    </>
  );
}

export default App;

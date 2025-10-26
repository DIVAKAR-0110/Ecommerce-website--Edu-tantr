import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Vendorlogin from "./pages/Vendorlogin";
import LoginPage from "./pages/LoginPage";
import SellerLogin from "./pages/SellerLogin";
import SalesRegister from "./pages/SalesRegister";
import Forgot from "./pages/Forgot";

import Show from "./pages/Show";
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/Vendorlogin" element={<Vendorlogin />} />
        <Route path="/LoginPage" element={<LoginPage />} />
        <Route path="/SellerLogin" element={<SellerLogin />} />
        <Route path="/SalesRegister" element={<SalesRegister />} />
        <Route path="/Forgot" element={<Forgot />} />
       
        <Route path="/Show" element={<Show />} />
      </Routes>
    </Router>
  );
}

export default App;

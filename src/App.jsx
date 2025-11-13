import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Vendorlogin from "./pages/Vendorlogin";
import LoginPage from "./pages/LoginPage";
import SellerLogin from "./pages/SellerLogin";
import SalesRegister from "./pages/SalesRegister";
import Forgot from "./pages/Forgot";
import Dashboard from "./pages/Dashboard";
import Add from "./pages/Add";
import Confirm from "./pages/Confirm";
import List from "./pages/List";
import Admin_View from "./pages/Admin_View";
import Manage from "./pages/Manage";
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
        <Route path="/seller-dashboard" element={<Dashboard />} />
          <Route path="/seller-dashboard/add-product" element={<Add />} />
          <Route path="/seller-dashboard/list-product" element={<List />} />
           <Route path="/seller-dashboard/manage-inventory" element={<Manage />} />
       
        <Route path="/Show" element={<Show />} />
        <Route path="/Confirm" element={<Confirm />} />
        <Route path="/admin-view" element={<Admin_View />} />
       
      </Routes>
    </Router>
  );
}

export default App;

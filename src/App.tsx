/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Gallery from "./pages/Gallery";
import Store from "./pages/Store";
import PluginDetail from "./pages/PluginDetail";
import Dashboard from "./pages/Dashboard";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Communication from "./pages/Communication";
import CommunicationPanel from "./innsaeiCommunication/CommunicationPanel";
import { useEffect } from "react";

export default function App() {
  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <Router>
      <Routes>
        {/* Bare panel for Resolume's Web Page source: no site chrome, fills the view. */}
        <Route path="/panel" element={<div className="h-screen bg-[#1b1b1b]"><CommunicationPanel /></div>} />
        <Route
          path="*"
          element={
            <div className="min-h-screen bg-black text-on-surface font-body selection:bg-primary-container selection:text-on-primary">
              <Navbar />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/store" element={<Store />} />
                <Route path="/plugin/:id" element={<PluginDetail />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/communication" element={<Communication />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/login" element={<Login />} />
              </Routes>
              <Footer />
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

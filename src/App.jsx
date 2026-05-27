import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { Mail, Users, Settings, BarChart2, Zap, Layout } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import Contacts from './pages/Contacts';
import Campaigns from './pages/Campaigns';
import Templates from './pages/Templates';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Sidebar = () => {
  return (
    <div className="sidebar">
      <div className="logo">
        <Zap size={28} />
        <span>AutoMail Pro</span>
      </div>
      <nav>
        <NavLink to="/" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          <BarChart2 size={20} /> Dashboard
        </NavLink>
        <NavLink to="/campaigns" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          <Mail size={20} /> Campaigns
        </NavLink>
        <NavLink to="/templates" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          <Layout size={20} /> Templates
        </NavLink>
        <NavLink to="/contacts" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          <Users size={20} /> Contacts
        </NavLink>
        <NavLink to="/accounts" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          <Settings size={20} /> Gmail Accounts
        </NavLink>
      </nav>
    </div>
  );
};

function App() {
  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <ToastContainer theme="dark" position="bottom-right" />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/accounts" element={<Accounts />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

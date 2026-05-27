import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Outlet, Navigate } from 'react-router-dom';
import { Mail, Users, Settings, BarChart2, Zap, Layout, LogOut } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import Contacts from './pages/Contacts';
import Campaigns from './pages/Campaigns';
import Templates from './pages/Templates';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthContext } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Swal from 'sweetalert2';

const Sidebar = () => {
  const { logout } = React.useContext(AuthContext);
  const handleLogout = () => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You will be logged out of your session.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Yes, logout!',
      background: '#1e293b',
      color: '#f8fafc'
    }).then((result) => {
      if (result.isConfirmed) {
        logout();
      }
    });
  };

  return (
    <div className="sidebar">
      <div className="logo">
        <Zap size={28} />
        <span>AutoMail Pro</span>
      </div>
      <nav style={{ flex: 1 }}>
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
      <div style={{ padding: '20px' }}>
        <button onClick={handleLogout} className="nav-item" style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#94a3b8', padding: '10px 15px' }}>
          <LogOut size={20} style={{ marginRight: '10px' }} /> Logout
        </button>
      </div>
    </div>
  );
};

const MainLayout = () => {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <ToastContainer theme="dark" position="bottom-right" />
        <Outlet />
      </main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/accounts" element={<Accounts />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

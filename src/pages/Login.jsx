import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Zap, Mail, Lock, Loader2 } from 'lucide-react';
import '../index.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const success = await login(email, password);
    setIsSubmitting(false);
    if (success) {
      navigate('/');
    }
  };

  return (
    <div className="login-container" style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center', color: '#f8fafc' }}>
      <div className="login-box" style={{ backgroundColor: '#1e293b', padding: '40px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', width: '100%', maxWidth: '400px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '30px' }}>
          <Zap size={36} color="#3b82f6" />
          <h1 style={{ marginLeft: '10px', fontSize: '24px', fontWeight: 'bold' }}>AutoMail Pro</h1>
        </div>
        
        <h2 style={{ fontSize: '18px', marginBottom: '20px', textAlign: 'center', color: '#cbd5e1' }}>Admin Login</h2>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#94a3b8' }}>Email Address</label>
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#0f172a', borderRadius: '8px', padding: '10px 15px' }}>
              <Mail size={18} color="#64748b" style={{ marginRight: '10px' }} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                style={{ backgroundColor: 'transparent', border: 'none', color: '#f8fafc', width: '100%', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#94a3b8' }}>Password</label>
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#0f172a', borderRadius: '8px', padding: '10px 15px' }}>
              <Lock size={18} color="#64748b" style={{ marginRight: '10px' }} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ backgroundColor: 'transparent', border: 'none', color: '#f8fafc', width: '100%', outline: 'none' }}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            style={{ 
              width: '100%', 
              padding: '12px', 
              backgroundColor: isSubmitting ? '#94a3b8' : '#3b82f6', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              fontSize: '16px', 
              fontWeight: 'bold', 
              cursor: isSubmitting ? 'not-allowed' : 'pointer', 
              transition: 'background-color 0.2s',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
            onMouseOver={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = '#2563eb')}
            onMouseOut={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = '#3b82f6')}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={20} className="animate-spin" style={{ marginRight: '8px', animation: 'spin 1s linear infinite' }} />
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </form>
      </div>
    </div>
  );
};

export default Login;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, UploadCloud, Search, ChevronLeft, ChevronRight, Edit, Save, X } from 'lucide-react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

const Accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [totalAccounts, setTotalAccounts] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  const [accountType, setAccountType] = useState('gmail');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({ 
    email: '', 
    password: '', 
    dailyLimit: 100,
    smtpHost: '',
    smtpPort: 465
  });
  const [loading, setLoading] = useState(false);

  const fetchAccounts = async () => {
    try {
      const res = await axios.get(`/api/accounts?page=${page}&limit=10&search=${searchQuery}`);
      setAccounts(res.data.accounts);
      setTotalAccounts(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [page, searchQuery]);

  const handleEdit = (acc) => {
    setEditingId(acc._id);
    setAccountType(acc.smtpHost ? 'smtp' : 'gmail');
    setFormData({
      email: acc.email,
      password: '', // Don't show password, require them to re-enter if editing
      dailyLimit: acc.dailyLimit,
      smtpHost: acc.smtpHost || '',
      smtpPort: acc.smtpPort || 465
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setAccountType('gmail');
    setFormData({ email: '', password: '', dailyLimit: 100, smtpHost: '', smtpPort: 465 });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const submitData = { ...formData };
    if (accountType === 'gmail') {
      submitData.smtpHost = '';
      submitData.smtpPort = '';
    }

    try {
      if (editingId) {
        await axios.put(`/api/accounts/${editingId}`, submitData);
        toast.success('Account updated successfully');
      } else {
        await axios.post('/api/accounts', submitData);
        toast.success('Account added successfully');
      }
      handleCancelEdit();
      fetchAccounts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving account.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return toast.warn('Please select a file');
    
    const data = new FormData();
    data.append('file', file);
    
    setUploading(true);
    try {
      const res = await axios.post('/api/accounts/upload', data);
      toast.success(res.data.message);
      setFile(null);
      if (document.getElementById('accountUploadFile')) {
        document.getElementById('accountUploadFile').value = '';
      }
      fetchAccounts();
    } catch (error) {
      toast.error('Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  const deleteAccount = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#3b82f6',
      confirmButtonText: 'Yes, delete it!',
      background: '#1e293b',
      color: '#fff'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`/api/accounts/${id}`);
        toast.success('Account deleted');
        fetchAccounts();
      } catch (error) {
        toast.error('Error deleting account');
      }
    }
  };

  const deleteAllAccounts = async () => {
    const result = await Swal.fire({
      title: 'Delete ALL Accounts?',
      text: "This action cannot be undone. Are you sure?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#3b82f6',
      confirmButtonText: 'Yes, delete all!',
      background: '#1e293b',
      color: '#fff'
    });

    if(result.isConfirmed) {
      try {
        await axios.delete('/api/accounts/all');
        toast.success('All accounts deleted successfully');
        fetchAccounts();
      } catch (error) {
        toast.error('Error deleting all accounts');
      }
    }
  };

  const downloadSampleAccounts = () => {
    const csvContent = "data:text/csv;charset=utf-8,email,password,dailyLimit,smtpHost,smtpPort\ngmailuser@gmail.com,app_password_here,100,,\ncustom@domain.com,password123,500,smtp.hostinger.com,465";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sample_accounts.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <h1>Email Accounts Manager</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>{editingId ? 'Edit Account' : 'Add Single Account'}</h2>
            {editingId && <button className="btn btn-danger" type="button" onClick={handleCancelEdit} style={{ padding: '0.3rem 0.6rem' }}><X size={16} /> Cancel</button>}
          </div>
          
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label>Account Provider</label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="accountType" 
                  checked={accountType === 'gmail'} 
                  onChange={() => setAccountType('gmail')} 
                /> Gmail
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="accountType" 
                  checked={accountType === 'smtp'} 
                  onChange={() => setAccountType('smtp')} 
                /> Custom SMTP
              </label>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
            {accountType === 'gmail' && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                For Gmail, you must use an <strong>App Password</strong> generated from your Google Account settings.
              </p>
            )}
            
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" className="form-control" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required placeholder={accountType === 'gmail' ? "e.g. name@gmail.com" : "e.g. info@yourdomain.com"} disabled={!!editingId} />
            </div>
            
            <div className="form-group">
              <label>{accountType === 'gmail' ? 'App Password' : 'Email Password'} {editingId && <span style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>(Leave blank to keep unchanged)</span>}</label>
              <input type="password" className="form-control" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required={!editingId} />
            </div>

            {accountType === 'smtp' && (
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label>SMTP Host</label>
                  <input type="text" className="form-control" value={formData.smtpHost} onChange={e => setFormData({...formData, smtpHost: e.target.value})} required placeholder="e.g. smtp.hostinger.com" />
                </div>
                <div className="form-group">
                  <label>SMTP Port</label>
                  <input type="number" className="form-control" value={formData.smtpPort} onChange={e => setFormData({...formData, smtpPort: parseInt(e.target.value)})} required placeholder="e.g. 465" />
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Daily Limit</label>
              <input type="number" className="form-control" value={formData.dailyLimit} onChange={e => setFormData({...formData, dailyLimit: parseInt(e.target.value)})} required />
            </div>
            
            <button type="submit" className="btn" disabled={loading}>
              {editingId ? <><Save size={18} /> {loading ? 'Saving...' : 'Update Account'}</> : <><Plus size={18} /> {loading ? 'Adding...' : 'Add Account'}</>}
            </button>
          </form>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0 }}>Bulk Upload</h2>
            <button type="button" className="btn" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', background: 'rgba(255,255,255,0.1)' }} onClick={downloadSampleAccounts}>
              Download Sample
            </button>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Upload a file with columns: <strong>email</strong>, <strong>password</strong>. Optional columns: <strong>dailyLimit</strong>, <strong>smtpHost</strong>, <strong>smtpPort</strong>.
          </p>
          <form onSubmit={handleUpload}>
            <div className="form-group">
              <input 
                id="accountUploadFile"
                type="file" 
                accept=".xlsx, .xls, .csv" 
                onChange={(e) => setFile(e.target.files[0])}
                className="form-control"
              />
            </div>
            <button type="submit" className="btn" disabled={uploading || !file}>
              <UploadCloud size={18} /> {uploading ? 'Uploading...' : 'Upload File'}
            </button>
          </form>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <h2>Your Sending Accounts ({totalAccounts})</h2>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="form-control" 
                placeholder="Search email or host..." 
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
                style={{ paddingLeft: '35px', width: '250px' }}
              />
            </div>
            {accounts.length > 0 && (
              <button className="btn btn-danger" onClick={deleteAllAccounts} style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>
                <Trash2 size={16} /> Delete All
              </button>
            )}
          </div>
        </div>

        <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Type</th>
                <th>Sent Today</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map(acc => (
                <tr key={acc._id}>
                  <td>{acc.email}</td>
                  <td>
                    <span style={{ fontSize: '0.8rem', color: '#888', background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>
                      {acc.smtpHost ? 'Custom SMTP' : 'Gmail'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '80px', height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${(acc.emailsSentToday / acc.dailyLimit) * 100}%`, height: '100%', background: 'var(--primary)' }}></div>
                      </div>
                      <span style={{ fontSize: '0.9rem' }}>{acc.emailsSentToday}/{acc.dailyLimit}</span>
                    </div>
                  </td>
                  <td><span className={`badge ${acc.status}`}>{acc.status.toUpperCase()}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn" style={{ padding: '0.4rem', background: 'var(--accent)' }} onClick={() => handleEdit(acc)} title="Edit Account">
                        <Edit size={16} />
                      </button>
                      <button className="btn btn-danger" style={{ padding: '0.4rem' }} onClick={() => deleteAccount(acc._id)} title="Delete Account">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {accounts.length === 0 && (
                <tr><td colSpan="5" style={{textAlign: 'center', padding: '2rem', color: 'var(--text-muted)'}}>No accounts found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
            <button 
              className="btn" 
              style={{ padding: '0.4rem 0.8rem', background: 'var(--border-color)' }}
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <span style={{ fontSize: '0.9rem' }}>Page {page} of {totalPages}</span>
            <button 
              className="btn" 
              style={{ padding: '0.4rem 0.8rem', background: 'var(--border-color)' }}
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Accounts;

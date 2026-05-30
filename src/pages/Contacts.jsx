import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UploadCloud, Plus, Trash2, Edit, X, Save, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

const Contacts = () => {
  const [contacts, setContacts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  
  const [totalContacts, setTotalContacts] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadGroupId, setUploadGroupId] = useState('');
  const [formData, setFormData] = useState({ email: '', name: '', status: 'active', groups: [] });
  const [editingId, setEditingId] = useState(null);

  const fetchGroups = async () => {
    try {
      const res = await axios.get('/api/contact-groups');
      setGroups(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchContacts = async () => {
    try {
      const res = await axios.get(`/api/contacts?page=${page}&limit=10&search=${searchQuery}&groupId=${selectedGroupId}`);
      setContacts(res.data.contacts);
      setTotalContacts(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchGroups();
    fetchContacts();
  }, [page, searchQuery, selectedGroupId]);

  const handleEdit = (contact) => {
    setEditingId(contact._id);
    setFormData({
      email: contact.email,
      name: contact.name || '',
      status: contact.status,
      groups: contact.groups ? contact.groups.map(g => g._id) : []
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ email: '', name: '', status: 'active', groups: [] });
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`/api/contacts/${editingId}`, formData);
        toast.success('Contact updated successfully');
      } else {
        await axios.post('/api/contacts', formData);
        toast.success('Contact added successfully');
      }
      handleCancelEdit();
      fetchContacts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving contact');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return toast.warn('Please select a file');
    
    const data = new FormData();
    data.append('file', file);
    if (uploadGroupId) data.append('groupId', uploadGroupId);
    
    setUploading(true);
    try {
      const res = await axios.post('/api/contacts/upload', data);
      toast.success(res.data.message);
      setFile(null);
      document.getElementById('bulkUpload').value = '';
      fetchContacts();
    } catch (error) {
      toast.error('Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  const deleteContact = async (id) => {
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
        await axios.delete(`/api/contacts/${id}`);
        toast.success('Contact deleted');
        fetchContacts();
      } catch (error) {
        toast.error('Error deleting contact');
      }
    }
  };

  const downloadSampleContacts = () => {
    const csvContent = "data:text/csv;charset=utf-8,email,name\njohn.doe@example.com,John Doe\njane.smith@example.com,Jane Smith";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sample_contacts.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    try {
      await axios.post('/api/contact-groups', { name: newGroupName });
      toast.success('Group created');
      setNewGroupName('');
      fetchGroups();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error creating group');
    }
  };

  const deleteGroup = async (id) => {
    if (window.confirm('Are you sure you want to delete this group? Contacts will not be deleted, just unassigned from this group.')) {
      try {
        await axios.delete(`/api/contact-groups/${id}`);
        toast.success('Group deleted');
        fetchGroups();
        if (selectedGroupId === id) setSelectedGroupId('');
      } catch (error) {
        toast.error('Error deleting group');
      }
    }
  };

  return (
    <div>
      <h1>Contacts Manager</h1>
      
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2>Manage Contact Groups</h2>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', alignItems: 'flex-start' }}>
          <form onSubmit={handleCreateGroup} style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
            <input 
              type="text" 
              className="form-control" 
              placeholder="New Group Name (e.g. Clients)" 
              value={newGroupName} 
              onChange={e => setNewGroupName(e.target.value)} 
            />
            <button type="submit" className="btn" style={{ padding: '0.5rem 1rem' }}><Plus size={18}/> Add</button>
          </form>
          <div style={{ flex: 2, display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {groups.map(g => (
              <span key={g._id} className="badge" style={{ background: 'var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0.6rem' }}>
                {g.name}
                <Trash2 size={14} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => deleteGroup(g._id)} />
              </span>
            ))}
            {groups.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No groups created yet.</span>}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0 }}>Bulk Upload</h2>
            <button type="button" className="btn" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', background: 'rgba(255,255,255,0.1)' }} onClick={downloadSampleContacts}>
              Download Sample
            </button>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Upload a file with columns <strong>Email</strong> and optionally <strong>Name</strong>.
          </p>
          <form onSubmit={handleUpload}>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label>Assign to Group (Optional)</label>
              <select className="form-control" value={uploadGroupId} onChange={e => setUploadGroupId(e.target.value)}>
                <option value="">-- No Group --</option>
                {groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <input 
                id="bulkUpload"
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

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>{editingId ? 'Edit Contact' : 'Manual Entry'}</h2>
            {editingId && <button className="btn btn-danger" type="button" onClick={handleCancelEdit} style={{ padding: '0.3rem 0.6rem' }}><X size={16} /> Cancel</button>}
          </div>
          <form onSubmit={handleManualSubmit} style={{ marginTop: '1rem' }}>
            <div className="form-group">
              <label>Name</label>
              <input type="text" className="form-control" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" className="form-control" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
            </div>
            {editingId && (
              <div className="form-group">
                <label>Status</label>
                <select className="form-control" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                  <option value="active">Active</option>
                  <option value="unsubscribed">Unsubscribed</option>
                  <option value="bounced">Bounced</option>
                </select>
              </div>
            )}
            <div className="form-group">
              <label>Groups (Hold Ctrl/Cmd to select multiple)</label>
              <select multiple className="form-control" value={formData.groups} onChange={e => setFormData({...formData, groups: Array.from(e.target.selectedOptions, option => option.value)})} style={{height: '80px'}}>
                {groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
              </select>
            </div>
            <button type="submit" className="btn">
              {editingId ? <><Save size={18} /> Update Contact</> : <><Plus size={18} /> Add Contact</>}
            </button>
          </form>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <h2>Your Contacts ({totalContacts})</h2>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <select className="form-control" value={selectedGroupId} onChange={e => { setSelectedGroupId(e.target.value); setPage(1); }} style={{ width: '180px' }}>
              <option value="">All Groups</option>
              {groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
            </select>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="form-control" 
                placeholder="Search name or email..." 
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
                style={{ paddingLeft: '35px', width: '250px' }}
              />
            </div>
          </div>
        </div>

        <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Groups</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map(c => (
                <tr key={c._id}>
                  <td>{c.name || '-'}</td>
                  <td>{c.email}</td>
                  <td>{c.groups && c.groups.length > 0 ? c.groups.map(g => <span key={g._id} className="badge" style={{marginRight: '4px', background: 'var(--border-color)'}}>{g.name}</span>) : '-'}</td>
                  <td><span className={`badge ${c.status === 'active' ? 'active' : 'exhausted'}`}>{c.status.toUpperCase()}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn" style={{ padding: '0.4rem', background: 'var(--accent)' }} onClick={() => handleEdit(c)} title="Edit">
                        <Edit size={16} />
                      </button>
                      <button className="btn btn-danger" style={{ padding: '0.4rem' }} onClick={() => deleteContact(c._id)} title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {contacts.length === 0 && (
                <tr><td colSpan="4" style={{textAlign: 'center', padding: '2rem', color: 'var(--text-muted)'}}>No contacts found.</td></tr>
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

export default Contacts;

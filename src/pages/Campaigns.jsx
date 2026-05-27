import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Send, PlayCircle, FileText, X, Trash2 } from 'lucide-react';
import Select from 'react-select';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  
  const [formData, setFormData] = useState({ 
    name: '', subject: '', bodyHtml: '', 
    delayPerEmail: 1, pauseAfterCount: 0, pauseDuration: 0,
    selectedAccounts: [], attachments: []
  });
  const [loading, setLoading] = useState(false);

  const [reportModal, setReportModal] = useState({ isOpen: false, campaignName: '', logs: [] });

  const fetchData = async () => {
    try {
      const campRes = await axios.get('/api/campaigns');
      setCampaigns(campRes.data);
      const accRes = await axios.get('/api/accounts?all=true');
      setAccounts(accRes.data);
      const tplRes = await axios.get('/api/templates');
      setTemplates(tplRes.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAccountToggle = (id) => {
    setFormData(prev => {
      const selected = prev.selectedAccounts.includes(id)
        ? prev.selectedAccounts.filter(accId => accId !== id)
        : [...prev.selectedAccounts, id];
      return { ...prev, selectedAccounts: selected };
    });
  };

  const handleTemplateSelect = (e) => {
    const tplId = e.target.value;
    setSelectedTemplate(tplId);
    if (tplId) {
      const tpl = templates.find(t => t._id === tplId);
      if (tpl) {
        setFormData(prev => ({
          ...prev,
          subject: tpl.subject,
          bodyHtml: tpl.bodyHtml,
          attachments: tpl.attachments || []
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        subject: '',
        bodyHtml: '',
        attachments: []
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.selectedAccounts.length === 0) {
      return alert('Please select at least one sender account.');
    }
    setLoading(true);
    try {
      await axios.post('/api/campaigns', formData);
      setFormData({ name: '', subject: '', bodyHtml: '', delayPerEmail: 1, pauseAfterCount: 0, pauseDuration: 0, selectedAccounts: [], attachments: [] });
      setSelectedTemplate('');
      fetchData();
      toast.success('Campaign created successfully');
    } catch (error) {
      toast.error('Error creating campaign');
    } finally {
      setLoading(false);
    }
  };

  const startCampaign = async (id) => {
    const result = await Swal.fire({
      title: 'Start Campaign',
      text: 'Start sending this campaign now?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      background: '#1e293b',
      color: '#fff'
    });

    if (result.isConfirmed) {
      try {
        const res = await axios.post(`/api/campaigns/${id}/start`);
        toast.success(res.data.message || 'Campaign started!');
        fetchData();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Error starting campaign');
      }
    }
  };

  const viewReport = async (camp) => {
    try {
      const res = await axios.get(`/api/campaigns/${camp._id}/report`);
      setReportModal({ isOpen: true, campaignName: camp.name, logs: res.data });
    } catch (error) {
      toast.error('Error fetching report');
    }
  };

  const deleteCampaign = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "This will also delete its logs. You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#3b82f6',
      confirmButtonText: 'Yes, delete it!',
      background: '#1e293b',
      color: '#fff'
    });

    if(result.isConfirmed) {
      try {
        await axios.delete(`/api/campaigns/${id}`);
        toast.success('Campaign deleted');
        fetchData();
      } catch (error) {
        toast.error('Error deleting campaign');
      }
    }
  };

  return (
    <div>
      <h1>Campaigns Manager</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="card">
          <h2>Create New Campaign</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Select Template</label>
              <select className="form-control" value={selectedTemplate} onChange={handleTemplateSelect}>
                <option value="">-- Write Custom Email Below --</option>
                {templates.map(tpl => (
                  <option key={tpl._id} value={tpl._id}>{tpl.name}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Campaign Name</label>
              <input type="text" className="form-control" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            </div>

            {!selectedTemplate && (
              <>
                <div className="form-group">
                  <label>Email Subject</label>
                  <input type="text" className="form-control" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} required />
                </div>
                
                <div className="form-group">
                  <label>Email Body (Use {"{{name}}"} for personalization)</label>
                  <textarea 
                    className="form-control"
                    value={formData.bodyHtml} 
                    onChange={(e) => setFormData({...formData, bodyHtml: e.target.value})} 
                    style={{ height: '200px', width: '100%', resize: 'vertical' }}
                    placeholder="Hello {{name}},&#10;&#10;Write your content here..."
                    required
                  />
                </div>
              </>
            )}

            {selectedTemplate && (
              <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid #3b82f6', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                <p style={{ margin: 0, color: '#60a5fa' }}>✔ Template "{templates.find(t=>t._id === selectedTemplate)?.name}" selected.</p>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>The subject, body, and any attachments from this template will be used for this campaign.</p>
              </div>
            )}
            
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ margin: 0 }}>Select Sender Accounts</label>
                <button 
                  type="button" 
                  className="btn" 
                  style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem', background: 'rgba(255,255,255,0.1)' }}
                  onClick={() => {
                    const activeAccounts = accounts.filter(a => a.status === 'active').map(a => a._id);
                    setFormData({...formData, selectedAccounts: activeAccounts});
                  }}
                >
                  Select All Active
                </button>
              </div>
              <Select
                isMulti
                value={
                  accounts.filter(a => a.status === 'active').length > 0 && formData.selectedAccounts.length === accounts.filter(a => a.status === 'active').length
                  ? [{ value: 'ALL_ACTIVE', label: `All ${formData.selectedAccounts.length} Active Accounts Selected` }]
                  : accounts.filter(a => formData.selectedAccounts.includes(a._id)).map(acc => ({
                      value: acc._id,
                      label: `${acc.email} (${acc.emailsSentToday}/${acc.dailyLimit} used)`
                    }))
                }
                options={accounts.map(acc => ({
                  value: acc._id,
                  label: `${acc.email} (${acc.emailsSentToday}/${acc.dailyLimit} used)`
                }))}
                onChange={(selectedOptions, actionMeta) => {
                  if (actionMeta.action === 'clear' || (actionMeta.action === 'remove-value' && actionMeta.removedValue.value === 'ALL_ACTIVE')) {
                    setFormData({...formData, selectedAccounts: []});
                    return;
                  }
                  setFormData({
                    ...formData,
                    selectedAccounts: selectedOptions ? selectedOptions.filter(opt => opt.value !== 'ALL_ACTIVE').map(opt => opt.value) : []
                  });
                }}
                styles={{
                  control: (base) => ({
                    ...base,
                    background: '#0f172a',
                    borderColor: '#334155',
                    color: '#fff'
                  }),
                  menu: (base) => ({
                    ...base,
                    background: '#0f172a',
                    color: '#fff',
                    zIndex: 100
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isFocused ? '#334155' : '#0f172a',
                    color: '#fff',
                    cursor: 'pointer'
                  }),
                  multiValue: (base) => ({
                    ...base,
                    backgroundColor: '#3b82f6',
                  }),
                  multiValueLabel: (base) => ({
                    ...base,
                    color: '#fff',
                  }),
                  multiValueRemove: (base) => ({
                    ...base,
                    color: '#fff',
                    ':hover': {
                      backgroundColor: '#2563eb',
                      color: '#fff',
                    },
                  }),
                  input: (base) => ({
                    ...base,
                    color: '#fff',
                  }),
                }}
                placeholder="Select accounts..."
              />
              {accounts.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>No accounts available. Add accounts first.</p>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Delay per Email (sec)</label>
                <input type="number" className="form-control" value={formData.delayPerEmail} onChange={e => setFormData({...formData, delayPerEmail: Number(e.target.value)})} min="0" />
              </div>
              <div className="form-group">
                <label>Pause After (Emails)</label>
                <input type="number" className="form-control" value={formData.pauseAfterCount} onChange={e => setFormData({...formData, pauseAfterCount: Number(e.target.value)})} min="0" />
              </div>
              <div className="form-group">
                <label>Pause Duration (mins)</label>
                <input type="number" className="form-control" value={formData.pauseDuration} onChange={e => setFormData({...formData, pauseDuration: Number(e.target.value)})} min="0" />
              </div>
            </div>

            <button type="submit" className="btn" disabled={loading}>
              <Send size={18} /> {loading ? 'Saving...' : 'Save Draft'}
            </button>
          </form>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Your Campaigns</h2>
            <button className="btn" style={{ background: 'rgba(255,255,255,0.1)' }} onClick={fetchData}>Refresh</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            {campaigns.map(camp => (
              <div key={camp._id} style={{ border: '1px solid var(--border-color)', borderRadius: '0.5rem', padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.2rem' }}>{camp.name}</h3>
                  <span className={`badge ${camp.status}`}>{camp.status.toUpperCase()}</span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.2rem' }}>Subject: {camp.subject}</p>
                {camp.attachments && camp.attachments.length > 0 && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>Attachments: {camp.attachments.length}</p>
                )}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
                  <div style={{ fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--success)' }}>Sent: {camp.sentCount}</span> | 
                    <span style={{ color: 'var(--danger)', marginLeft: '0.5rem' }}>Failed: {camp.failedCount}</span> | 
                    <span style={{ marginLeft: '0.5rem' }}>Target: {camp.targetContactsCount}</span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {camp.status === 'draft' && (
                      <button className="btn" onClick={() => startCampaign(camp._id)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.9rem' }}>
                        <PlayCircle size={16} /> Start
                      </button>
                    )}
                    {(camp.status === 'sending' || camp.status === 'completed') && (
                      <button className="btn" onClick={() => viewReport(camp)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.9rem', background: 'var(--accent)' }}>
                        <FileText size={16} /> View Report
                      </button>
                    )}
                    <button className="btn btn-danger" onClick={() => deleteCampaign(camp._id)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.9rem' }} title="Delete Campaign">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {campaigns.length === 0 && (
              <p style={{textAlign: 'center', color: 'var(--text-muted)'}}>No campaigns yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {reportModal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '80%', maxHeight: '80vh', overflowY: 'auto', background: 'var(--bg-dark)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2>Report: {reportModal.campaignName}</h2>
              <button className="btn btn-danger" onClick={() => setReportModal({ isOpen: false, campaignName: '', logs: [] })}><X size={16} /></button>
            </div>
            <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
              <table>
                <thead>
                  <tr>
                    <th>Recipient Email</th>
                    <th>Sender Used</th>
                    <th>Status</th>
                    <th>Error Detail (if any)</th>
                  </tr>
                </thead>
                <tbody>
                  {reportModal.logs.map(log => (
                    <tr key={log._id}>
                      <td>{log.contactEmail}</td>
                      <td>{log.accountId?.email || 'N/A'}</td>
                      <td><span className={`badge ${log.status === 'sent' ? 'active' : 'exhausted'}`}>{log.status.toUpperCase()}</span></td>
                      <td style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>{log.errorMessage || '-'}</td>
                    </tr>
                  ))}
                  {reportModal.logs.length === 0 && (
                    <tr><td colSpan="4" style={{ textAlign: 'center' }}>No logs generated yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Campaigns;

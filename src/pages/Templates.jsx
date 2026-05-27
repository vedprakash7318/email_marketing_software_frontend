import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, Trash2, Paperclip, Edit, X } from 'lucide-react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

const Templates = () => {
  const [templates, setTemplates] = useState([]);
  const [formData, setFormData] = useState({ name: '', subject: '', bodyHtml: '' });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const fetchTemplates = async () => {
    try {
      const res = await axios.get('/api/templates');
      setTemplates(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleEdit = (tpl) => {
    setEditingId(tpl._id);
    setFormData({
      name: tpl.name,
      subject: tpl.subject,
      bodyHtml: tpl.bodyHtml
    });
    setFiles([]); // Note: existing attachments remain unless we overwrite them, for simplicity we just append or keep
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', subject: '', bodyHtml: '' });
    setFiles([]);
    if (document.getElementById('templateFiles')) document.getElementById('templateFiles').value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.subject || !formData.bodyHtml) {
      return toast.warn('Please fill all fields');
    }
    setLoading(true);
    try {
      let uploadedAttachments = [];
      
      if (files.length > 0) {
        const uploadData = new FormData();
        files.forEach(file => uploadData.append('media', file));
        
        const uploadRes = await axios.post('/api/upload', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        uploadedAttachments = uploadRes.data.files.map(f => ({
          filename: f.filename,
          path: f.path
        }));
      }

      if (editingId) {
        // Find existing template to keep old attachments if no new ones are added (or we can replace them)
        // Here we replace them if new files are selected, otherwise keep old ones.
        const existingTpl = templates.find(t => t._id === editingId);
        const finalAttachments = files.length > 0 ? uploadedAttachments : existingTpl.attachments;

        await axios.put(`/api/templates/${editingId}`, {
          ...formData,
          attachments: finalAttachments
        });
        toast.success('Template updated successfully!');
      } else {
        await axios.post('/api/templates', {
          ...formData,
          attachments: uploadedAttachments
        });
        toast.success('Template saved successfully!');
      }
      
      handleCancelEdit();
      fetchTemplates();
    } catch (error) {
      console.error(error);
      toast.error('Error saving template');
    } finally {
      setLoading(false);
    }
  };

  const deleteTemplate = async (id) => {
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
        await axios.delete(`/api/templates/${id}`);
        toast.success('Template deleted');
        fetchTemplates();
      } catch (error) {
        toast.error('Error deleting template');
      }
    }
  };

  return (
    <div>
      <h1>Email Templates</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Create and save email templates with text, links, and file attachments.
      </p>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>{editingId ? 'Edit Template' : 'Create New Template'}</h2>
            {editingId && <button className="btn btn-danger" onClick={handleCancelEdit} style={{ padding: '0.3rem 0.6rem' }}><X size={16} /> Cancel</button>}
          </div>
          <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
            <div className="form-group">
              <label>Template Name</label>
              <input type="text" className="form-control" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="e.g. Welcome Email" />
            </div>
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
                placeholder="Hello {{name}},&#10;&#10;Write your email content here. You can use HTML tags like <b>bold</b> or <br> for new lines."
                required
              />
            </div>

            <div className="form-group">
              <label><Paperclip size={16} style={{ verticalAlign: 'middle', marginRight: '5px' }}/> Attach Files (Images, Videos, PDFs)</label>
              <input type="file" id="templateFiles" className="form-control" multiple onChange={handleFileChange} />
              {files.length > 0 && <small style={{ color: 'var(--success)' }}>{files.length} new files selected (will replace old attachments)</small>}
            </div>

            <button type="submit" className="btn" disabled={loading}>
              <Save size={18} /> {loading ? 'Saving...' : (editingId ? 'Update Template' : 'Save Template')}
            </button>
          </form>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Saved Templates</h2>
            <button className="btn" style={{ background: 'rgba(255,255,255,0.1)' }} onClick={fetchTemplates}>Refresh</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            {templates.map(tpl => (
              <div key={tpl._id} style={{ border: '1px solid var(--border-color)', borderRadius: '0.5rem', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>{tpl.name}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Subject: {tpl.subject}</p>
                  {tpl.attachments && tpl.attachments.length > 0 && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.3rem' }}>
                      <Paperclip size={12} style={{ verticalAlign: 'middle' }}/> {tpl.attachments.length} attachment(s)
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn" type="button" onClick={() => handleEdit(tpl)} title="Edit" style={{ background: 'var(--accent)', padding: '0.5rem' }}>
                    <Edit size={16} />
                  </button>
                  <button className="btn btn-danger" type="button" onClick={() => deleteTemplate(tpl._id)} title="Delete" style={{ padding: '0.5rem' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            {templates.length === 0 && (
              <p style={{textAlign: 'center', color: 'var(--text-muted)'}}>No templates saved yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Templates;

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Save, Trash2, Paperclip, Edit, X, Eye } from 'lucide-react';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import BlotFormatter from 'quill-blot-formatter';

Quill.register('modules/blotFormatter', BlotFormatter.default || BlotFormatter);

import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

const Templates = () => {
  const [templates, setTemplates] = useState([]);
  const [formData, setFormData] = useState({ name: '', subject: '', bodyHtml: '' });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [previewModal, setPreviewModal] = useState(false);
  
  const quillRef = useRef(null);

  const imageHandler = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      const data = new FormData();
      data.append('media', file);
      try {
        const res = await axios.post('/api/upload', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        const url = res.data.files[0].url;
        const quill = quillRef.current.getEditor();
        const range = quill.getSelection();
        quill.insertEmbed(range ? range.index : 0, 'image', url);
      } catch (error) {
        toast.error('Image upload failed');
      }
    };
  };

  const modules = React.useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: imageHandler
      }
    },
    blotFormatter: {}
  }), []);

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

  // Add tooltips to Quill toolbar
  useEffect(() => {
    setTimeout(() => {
      const tooltips = {
        '.ql-bold': 'Bold',
        '.ql-italic': 'Italic',
        '.ql-underline': 'Underline',
        '.ql-strike': 'Strikethrough',
        '.ql-header': 'Heading Size',
        '.ql-list[value="ordered"]': 'Numbered List',
        '.ql-list[value="bullet"]': 'Bullet List',
        '.ql-link': 'Insert Link',
        '.ql-image': 'Insert Image',
        '.ql-color': 'Text Color',
        '.ql-background': 'Background Color',
        '.ql-clean': 'Clear Formatting'
      };

      Object.keys(tooltips).forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          el.setAttribute('title', tooltips[selector]);
        });
      });
    }, 500); // Wait for Quill to render
  });

  const handleEdit = (tpl) => {
    setEditingId(tpl._id);
    setFormData({ 
      name: tpl.name || '', 
      subject: tpl.subject || '', 
      bodyHtml: tpl.bodyHtml || '', 
      attachments: tpl.attachments || [] 
    });
    setFiles([]); // Clear new files when editing
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', subject: '', bodyHtml: '', attachments: [] });
    setFiles([]);
    if (document.getElementById('templateFileInput')) document.getElementById('templateFileInput').value = '';
  };

  const removeExistingAttachment = (index) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const removeNewFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    const input = document.getElementById('templateFileInput');
    if (input) input.value = '';
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

      const finalData = {
        ...formData,
        attachments: [...(formData.attachments || []), ...uploadedAttachments]
      };

      if (editingId) {
        await axios.put(`/api/templates/${editingId}`, finalData);
        toast.success('Template updated successfully');
        setEditingId(null);
      } else {
        await axios.post('/api/templates', finalData);
        toast.success('Template created successfully');
      }
      
      setFormData({ name: '', subject: '', bodyHtml: '', attachments: [] });
      setFiles([]);
      if (document.getElementById('templateFileInput')) document.getElementById('templateFileInput').value = '';
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
            {editingId && <button className="btn btn-danger" onClick={cancelEdit} style={{ padding: '0.3rem 0.6rem' }}><X size={16} /> Cancel</button>}
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
            
            <div className="form-group" style={{ marginBottom: '4rem' }}>
              <label>Email Body (Use {"{{name}}"} for personalization)</label>
              <ReactQuill 
                ref={quillRef}
                theme="snow"
                value={formData.bodyHtml}
                onChange={(content) => setFormData({...formData, bodyHtml: content})}
                modules={modules}
                style={{ height: '300px', marginBottom: '20px' }}
                placeholder="Hello {{name}}, Write your email content here..."
              />
            </div>

            <div className="form-group">
              <label>Attach Files (Images, Videos, PDFs)</label>
              
              {/* Show Existing Attachments */}
              {formData.attachments && formData.attachments.length > 0 && (
                <div style={{ marginBottom: '1rem', background: 'rgba(59, 130, 246, 0.1)', padding: '0.5rem', borderRadius: '0.5rem' }}>
                  <small style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Existing Attachments:</small>
                  <ul style={{ margin: '0.5rem 0 0 0', padding: 0, listStyle: 'none', fontSize: '0.85rem' }}>
                    {formData.attachments.map((att, i) => (
                      <li key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', background: 'rgba(0,0,0,0.2)', padding: '4px 8px', borderRadius: '4px' }}>
                        <span>{att.filename}</span>
                        <button type="button" onClick={() => removeExistingAttachment(i)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }} title="Remove this attachment"><X size={14} /></button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <input type="file" id="templateFileInput" className="form-control" multiple onChange={(e) => setFiles(Array.from(e.target.files))} />
              
              {/* Show New Files */}
              {files.length > 0 && (
                <div style={{ marginTop: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', padding: '0.5rem', borderRadius: '0.5rem' }}>
                  <small style={{ color: 'var(--success)', fontWeight: 'bold' }}>{files.length} new file(s) selected:</small>
                  <ul style={{ margin: '0.5rem 0 0 0', padding: 0, listStyle: 'none', fontSize: '0.85rem' }}>
                    {files.map((file, i) => (
                      <li key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', background: 'rgba(0,0,0,0.2)', padding: '4px 8px', borderRadius: '4px' }}>
                        <span>{file.name}</span>
                        <button type="button" onClick={() => removeNewFile(i)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }} title="Remove this file"><X size={14} /></button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button type="submit" className="btn" disabled={loading}>
                <Save size={18} /> {loading ? 'Saving...' : (editingId ? 'Update Template' : 'Save Template')}
              </button>
              <button type="button" className="btn" style={{ background: '#10b981' }} onClick={() => setPreviewModal(true)}>
                <Eye size={18} /> Live Preview
              </button>
            </div>
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
      {/* Preview Modal */}
      {previewModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-dark)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <h2>Live Preview: {formData.subject || 'No Subject'}</h2>
              <button className="btn btn-danger" onClick={() => setPreviewModal(false)}><X size={16} /></button>
            </div>
            
            <div style={{ padding: '20px', minHeight: '400px', borderRadius: '8px', overflowY: 'auto', maxHeight: '60vh', border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
              <div>
                <div className="ql-editor" dangerouslySetInnerHTML={{ __html: formData.bodyHtml.replace(/{{name}}/g, 'John Doe') }} style={{ padding: 0, minHeight: 'auto', overflowY: 'visible', color: 'var(--text-main)' }} />
                <p style={{ fontSize: '11px', color: '#999', marginTop: '30px', fontFamily: 'Arial, sans-serif' }}>
                  You are receiving this email because you opted in. <a href="#" style={{ color: '#666', textDecoration: 'underline' }}>Unsubscribe</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Templates;

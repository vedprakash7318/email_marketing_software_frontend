import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Mail, Users, AlertCircle, CheckCircle } from 'lucide-react';

const StatCard = ({ title, value, icon, color }) => (
  <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
    <div style={{ padding: '1rem', borderRadius: '1rem', background: `rgba(${color}, 0.1)`, color: `rgb(${color})` }}>
      {icon}
    </div>
    <div>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>{title}</p>
      <h3 style={{ fontSize: '1.8rem', fontWeight: '700' }}>{value}</h3>
    </div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalAccounts: 0,
    totalContacts: 0,
    emailsSent: 0,
    emailsFailed: 0,
    logs: []
  });

  useEffect(() => {
    // In a real app, this would be a single /api/stats endpoint
    const fetchData = async () => {
      try {
        const [accRes, contRes, logsRes] = await Promise.all([
          axios.get('/api/accounts'),
          axios.get('/api/contacts'),
          axios.get('/api/logs')
        ]);
        
        const logs = logsRes.data;
        const sent = logs.filter(l => l.status === 'sent').length;
        const failed = logs.filter(l => l.status === 'failed').length;

        setStats({
          totalAccounts: accRes.data.length,
          totalContacts: contRes.data.length,
          emailsSent: sent,
          emailsFailed: failed,
          logs: logs.slice(0, 5) // Recent 5 logs
        });
      } catch (error) {
        console.error("Error fetching dashboard data", error);
      }
    };
    fetchData();
  }, []);

  return (
    <div>
      <h1>Dashboard Overview</h1>
      <div className="dashboard-grid">
        <StatCard title="Total Accounts" value={stats.totalAccounts} icon={<Mail size={28} />} color="59, 130, 246" />
        <StatCard title="Total Contacts" value={stats.totalContacts} icon={<Users size={28} />} color="139, 92, 246" />
        <StatCard title="Emails Sent" value={stats.emailsSent} icon={<CheckCircle size={28} />} color="16, 185, 129" />
        <StatCard title="Failed" value={stats.emailsFailed} icon={<AlertCircle size={28} />} color="239, 68, 68" />
      </div>

      <div className="card">
        <h2>Recent Activity Log</h2>
        <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
          <table>
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Contact Email</th>
                <th>Account Used</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {stats.logs.map(log => (
                <tr key={log._id}>
                  <td>{log.campaignId?.name || 'N/A'}</td>
                  <td>{log.contactEmail}</td>
                  <td>{log.accountId?.email || 'N/A'}</td>
                  <td>
                    <span className={`badge ${log.status === 'sent' ? 'active' : 'exhausted'}`}>
                      {log.status.toUpperCase()}
                    </span>
                  </td>
                  <td>{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {stats.logs.length === 0 && (
                <tr><td colSpan="5" style={{textAlign: 'center', color: 'var(--text-muted)'}}>No recent activity found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

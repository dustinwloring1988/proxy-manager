import { useState, useEffect } from 'react';
import { ProxyHost, CreateProxyHostDto, Certificate, CreateCertificateDto, ApiResponse } from 'shared';

const API_BASE = '/api/proxy-hosts';
const CERT_API_BASE = '/api/certificates';

type Tab = 'hosts' | 'certificates';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('hosts');
  const [hosts, setHosts] = useState<ProxyHost[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHostModal, setShowHostModal] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [editingHost, setEditingHost] = useState<ProxyHost | null>(null);
  const [hostFormData, setHostFormData] = useState<CreateProxyHostDto>({
    domain: '',
    targetUrl: '',
    enabled: true,
    sslEnabled: false,
  });
  const [certFormData, setCertFormData] = useState<CreateCertificateDto>({
    domain: '',
    email: '',
    provider: 'letsencrypt',
  });
  const [certLoading, setCertLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [hostsRes, certsRes] = await Promise.all([
        fetch(API_BASE),
        fetch(CERT_API_BASE),
      ]);
      const hostsData: ApiResponse<ProxyHost[]> = await hostsRes.json();
      const certsData: ApiResponse<Certificate[]> = await certsRes.json();
      
      if (hostsData.success && hostsData.data) {
        setHosts(hostsData.data);
      }
      if (certsData.success && certsData.data) {
        setCertificates(certsData.data);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleHostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const url = editingHost ? `${API_BASE}/${editingHost.id}` : API_BASE;
    const method = editingHost ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hostFormData),
      });
      const data: ApiResponse<ProxyHost> = await res.json();
      
      if (data.success) {
        fetchData();
        closeHostModal();
      }
    } catch (err) {
      console.error('Failed to save host:', err);
    }
  };

  const handleHostDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this proxy host?')) return;
    
    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
      const data: ApiResponse<void> = await res.json();
      
      if (data.success) {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to delete host:', err);
    }
  };

  const handleToggleEnabled = async (host: ProxyHost) => {
    try {
      const res = await fetch(`${API_BASE}/${host.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !host.enabled }),
      });
      const data: ApiResponse<ProxyHost> = await res.json();
      
      if (data.success) {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to toggle host:', err);
    }
  };

  const handleCertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCertLoading(true);
    
    try {
      const res = await fetch(CERT_API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(certFormData),
      });
      const data: ApiResponse<Certificate> = await res.json();
      
      if (data.success) {
        fetchData();
        closeCertModal();
      } else {
        alert(data.error || 'Failed to create certificate');
      }
    } catch (err) {
      console.error('Failed to create certificate:', err);
      alert('Failed to create certificate. Make sure your domain DNS points to this server.');
    } finally {
      setCertLoading(false);
    }
  };

  const handleCertDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this certificate?')) return;
    
    try {
      const res = await fetch(`${CERT_API_BASE}/${id}`, { method: 'DELETE' });
      const data: ApiResponse<void> = await res.json();
      
      if (data.success) {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to delete certificate:', err);
    }
  };

  const openHostModal = (host?: ProxyHost) => {
    if (host) {
      setEditingHost(host);
      setHostFormData({
        domain: host.domain,
        targetUrl: host.targetUrl,
        enabled: host.enabled,
        sslEnabled: host.sslEnabled,
        certificateId: host.certificateId,
      });
    } else {
      setEditingHost(null);
      setHostFormData({ domain: '', targetUrl: '', enabled: true, sslEnabled: false });
    }
    setShowHostModal(true);
  };

  const closeHostModal = () => {
    setShowHostModal(false);
    setEditingHost(null);
    setHostFormData({ domain: '', targetUrl: '', enabled: true, sslEnabled: false });
  };

  const openCertModal = () => {
    setCertFormData({ domain: '', email: '', provider: 'letsencrypt' });
    setShowCertModal(true);
  };

  const closeCertModal = () => {
    setShowCertModal(false);
    setCertFormData({ domain: '', email: '', provider: 'letsencrypt' });
  };

  if (loading) {
    return (
      <div className="app-container">
        <div className="main-content">
          <div className="loading-container">
            <div className="loading-spinner"></div>
          </div>
        </div>
      </div>
    );
  };

  const getCertForHost = (certId?: number) => {
    if (!certId) return null;
    return certificates.find(c => c.id === certId);
  };

  const isExpiringSoon = (dateStr: string) => {
    const expiry = new Date(dateStr);
    const now = new Date();
    const daysUntil = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil < 30;
  };

  return (
    <div className="app-container">
      <div className="main-content">
        <header className="header">
          <div className="header-left">
            <div className="logo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div>
              <h1>Proxy Manager</h1>
              <div className="header-subtitle">Reverse proxy management interface</div>
            </div>
          </div>
          <div className="status-badge">
            <span className="status-dot"></span>
            System Online
          </div>
        </header>

        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'hosts' ? 'active' : ''}`}
            onClick={() => setActiveTab('hosts')}
          >
            Proxy Hosts
          </button>
          <button 
            className={`tab ${activeTab === 'certificates' ? 'active' : ''}`}
            onClick={() => setActiveTab('certificates')}
          >
            SSL Certificates
          </button>
        </div>

        {activeTab === 'hosts' && (
          <div className="card stagger-1">
            <div className="card-header">
              <div className="card-title">
                <div className="card-title-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <path d="M9 9h6M9 13h6M9 17h4"/>
                  </svg>
                </div>
                Proxy Hosts
              </div>
              <button className="btn btn-primary" onClick={() => openHostModal()}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Add Host
              </button>
            </div>

            {hosts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 8v4M12 16h.01"/>
                  </svg>
                </div>
                <h3 className="empty-title">No proxy hosts configured</h3>
                <p className="empty-text">Add your first proxy host to start routing traffic.</p>
                <button className="btn btn-primary" onClick={() => openHostModal()}>
                  Create Proxy Host
                </button>
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Domain</th>
                      <th>Target URL</th>
                      <th>SSL</th>
                      <th>Certificate</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hosts.map((host, idx) => {
                      const cert = getCertForHost(host.certificateId);
                      return (
                        <tr key={host.id} style={{ animationDelay: `${0.1 + idx * 0.05}s` }}>
                          <td className="domain-cell">{host.domain}</td>
                          <td className="url-cell">{host.targetUrl}</td>
                          <td>
                            <span className={`badge ${host.sslEnabled ? 'badge-ssl' : 'badge-no-ssl'}`}>
                              {host.sslEnabled ? 'SSL' : 'None'}
                            </span>
                          </td>
                          <td className="url-cell">{cert ? cert.domain : '—'}</td>
                          <td>
                            <span className={`badge ${host.enabled ? 'badge-enabled' : 'badge-disabled'}`}>
                              {host.enabled ? 'Active' : 'Disabled'}
                            </span>
                          </td>
                          <td>
                            <div className="actions-cell">
                              <button 
                                className={`btn ${host.enabled ? 'btn-warning' : 'btn-success'}`}
                                onClick={() => handleToggleEnabled(host)}
                              >
                                {host.enabled ? 'Disable' : 'Enable'}
                              </button>
                              <button className="btn btn-secondary" onClick={() => openHostModal(host)}>
                                Edit
                              </button>
                              <button className="btn btn-danger" onClick={() => handleHostDelete(host.id)}>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'certificates' && (
          <div className="card stagger-2">
            <div className="card-header">
              <div className="card-title">
                <div className="card-title-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </div>
                SSL Certificates
              </div>
              <button className="btn btn-primary" onClick={openCertModal}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                New Certificate
              </button>
            </div>

            {certificates.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    <path d="M9 12l2 2 4-4"/>
                  </svg>
                </div>
                <h3 className="empty-title">No certificates configured</h3>
                <p className="empty-text">Request an SSL certificate to enable HTTPS for your domains.</p>
                <button className="btn btn-primary" onClick={openCertModal}>
                  Request Certificate
                </button>
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Domain</th>
                      <th>Provider</th>
                      <th>Expires</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {certificates.map((cert, idx) => (
                      <tr key={cert.id} style={{ animationDelay: `${0.1 + idx * 0.05}s` }}>
                        <td className="domain-cell">{cert.domain}</td>
                        <td><span className="cert-provider">{cert.provider}</span></td>
                        <td className={`cert-expiry ${isExpiringSoon(cert.expiresAt) ? 'warning' : ''}`}>
                          {new Date(cert.expiresAt).toLocaleDateString()}
                          {isExpiringSoon(cert.expiresAt) && ' (Expiring soon)'}
                        </td>
                        <td>
                          <div className="actions-cell">
                            <button className="btn btn-danger" onClick={() => handleCertDelete(cert.id)}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {showHostModal && (
          <div className="modal-overlay" onClick={closeHostModal}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingHost ? 'Edit Proxy Host' : 'Add Proxy Host'}</h2>
                <button className="modal-close" onClick={closeHostModal}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              <form onSubmit={handleHostSubmit}>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Domain</label>
                    <input
                      type="text"
                      value={hostFormData.domain}
                      onChange={e => setHostFormData({ ...hostFormData, domain: e.target.value })}
                      placeholder="example.com"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Target URL</label>
                    <input
                      type="text"
                      value={hostFormData.targetUrl}
                      onChange={e => setHostFormData({ ...hostFormData, targetUrl: e.target.value })}
                      placeholder="http://localhost:8080"
                      required
                    />
                  </div>
                  {certificates.length > 0 && (
                    <div className="form-group">
                      <label>SSL Certificate</label>
                      <select
                        value={hostFormData.certificateId || ''}
                        onChange={e => setHostFormData({ 
                          ...hostFormData, 
                          certificateId: e.target.value ? parseInt(e.target.value) : undefined,
                          sslEnabled: !!e.target.value
                        })}
                      >
                        <option value="">None</option>
                        {certificates.map(cert => (
                          <option key={cert.id} value={cert.id}>{cert.domain}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="form-group">
                    <div className="checkbox-group">
                      <input
                        type="checkbox"
                        id="enabled"
                        checked={hostFormData.enabled}
                        onChange={e => setHostFormData({ ...hostFormData, enabled: e.target.checked })}
                      />
                      <label htmlFor="enabled">Enable this proxy host</label>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeHostModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingHost ? 'Update Host' : 'Create Host'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showCertModal && (
          <div className="modal-overlay" onClick={closeCertModal}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Request SSL Certificate</h2>
                <button className="modal-close" onClick={closeCertModal}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              <form onSubmit={handleCertSubmit}>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Domain</label>
                    <input
                      type="text"
                      value={certFormData.domain}
                      onChange={e => setCertFormData({ ...certFormData, domain: e.target.value })}
                      placeholder="example.com"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email (optional)</label>
                    <input
                      type="email"
                      value={certFormData.email}
                      onChange={e => setCertFormData({ ...certFormData, email: e.target.value })}
                      placeholder="admin@example.com"
                    />
                  </div>
                  <div className="note-text">
                    <strong>Note:</strong> Ensure your domain's DNS A record points to this server and port 80 is accessible. Let's Encrypt will verify domain ownership via HTTP challenge.
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeCertModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={certLoading}>
                    {certLoading ? 'Requesting...' : 'Request Certificate'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

import { Router } from 'express';
import { 
  getAllProxyHosts, 
  getProxyHostById, 
  createProxyHost, 
  updateProxyHost, 
  deleteProxyHost,
  getAllCertificates
} from '../database';
import { writeNginxConfig, reloadNginx } from '../services/nginx';
import { CreateProxyHostDto, UpdateProxyHostDto } from 'shared';

const router = Router();

router.get('/', (req, res) => {
  const hosts = getAllProxyHosts();
  res.json({ success: true, data: hosts });
});

router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const host = getProxyHostById(id);
  
  if (!host) {
    return res.status(404).json({ success: false, error: 'Proxy host not found' });
  }
  
  res.json({ success: true, data: host });
});

router.post('/', (req, res) => {
  const data = req.body as CreateProxyHostDto;
  
  if (!data.domain || !data.targetUrl) {
    return res.status(400).json({ success: false, error: 'Domain and target URL are required' });
  }
  
  const host = createProxyHost(data);
  const hosts = getAllProxyHosts();
  const certs = getAllCertificates();
  writeNginxConfig(hosts, certs);
  reloadNginx();
  
  res.status(201).json({ success: true, data: host });
});

router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const data = req.body as UpdateProxyHostDto;
  
  const host = updateProxyHost(id, data);
  
  if (!host) {
    return res.status(404).json({ success: false, error: 'Proxy host not found' });
  }
  
  const hosts = getAllProxyHosts();
  const certs = getAllCertificates();
  writeNginxConfig(hosts, certs);
  reloadNginx();
  
  res.json({ success: true, data: host });
});

router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const deleted = deleteProxyHost(id);
  
  if (!deleted) {
    return res.status(404).json({ success: false, error: 'Proxy host not found' });
  }
  
  const hosts = getAllProxyHosts();
  const certs = getAllCertificates();
  writeNginxConfig(hosts, certs);
  reloadNginx();
  
  res.json({ success: true });
});

router.post('/reload', (req, res) => {
  const hosts = getAllProxyHosts();
  const certs = getAllCertificates();
  writeNginxConfig(hosts, certs);
  reloadNginx();
  res.json({ success: true });
});

export default router;

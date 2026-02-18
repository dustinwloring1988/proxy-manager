import { Router } from 'express';
import { getAllCertificates, getCertificateById, deleteCertificate as deleteCertFromDb } from '../database';
import { requestCertificate, deleteCertificateFiles } from '../services/certificate';
import { CreateCertificateDto } from 'shared';

const router = Router();

router.get('/', (req, res) => {
  const certs = getAllCertificates();
  res.json({ success: true, data: certs });
});

router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const cert = getCertificateById(id);
  
  if (!cert) {
    return res.status(404).json({ success: false, error: 'Certificate not found' });
  }
  
  res.json({ success: true, data: cert });
});

router.post('/', async (req, res) => {
  const data = req.body as CreateCertificateDto;
  
  if (!data.domain) {
    return res.status(400).json({ success: false, error: 'Domain is required' });
  }
  
  try {
    const cert = await requestCertificate(data, data.email);
    res.status(201).json({ success: true, data: cert });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const cert = getCertificateById(id);
  
  if (!cert) {
    return res.status(404).json({ success: false, error: 'Certificate not found' });
  }
  
  deleteCertificateFiles(cert.domain);
  deleteCertFromDb(id);
  
  res.json({ success: true });
});

export default router;

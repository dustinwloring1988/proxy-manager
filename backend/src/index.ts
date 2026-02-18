import express from 'express';
import cors from 'cors';
import proxyHostsRouter from './routes/proxyHosts';
import certificatesRouter from './routes/certificates';
import { writeNginxConfig } from './services/nginx';
import { getAllProxyHosts, getAllCertificates } from './database';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const hosts = getAllProxyHosts();
const certs = getAllCertificates();
writeNginxConfig(hosts, certs);

app.use('/api/proxy-hosts', proxyHostsRouter);
app.use('/api/certificates', certificatesRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Proxy Manager API running on port ${PORT}`);
});

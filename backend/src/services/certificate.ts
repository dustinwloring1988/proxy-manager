import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { CreateCertificateDto, Certificate } from 'shared';
import { createCertificate as dbCreateCertificate, getCertificateByDomain } from '../database';

const CERTBOT_VOLUME = '/etc/letsencrypt';
const CERTBOT_WEBROOT = '/var/www/certbot';

export const requestCertificate = async (data: CreateCertificateDto, email?: string): Promise<Certificate> => {
  const domain = data.domain;
  const certPath = path.join(CERTBOT_VOLUME, 'live', domain);
  
  const existingCert = getCertificateByDomain(domain);
  if (existingCert) {
    return existingCert;
  }

  const emailArg = email ? `--email ${email}` : '--register-unsafely-without-email';
  
  try {
    execSync(
      `certbot certonly --webroot -w ${CERTBOT_WEBROOT} -d ${domain} ${emailArg} --agree-tos --non-interactive`,
      { stdio: 'ignore' }
    );
  } catch (error) {
    throw new Error(`Failed to obtain SSL certificate for ${domain}. Make sure DNS points to this server and port 80 is accessible.`);
  }

  const keyPath = path.join(certPath, 'privkey.pem');
  const fullchainPath = path.join(certPath, 'fullchain.pem');
  
  if (!fs.existsSync(keyPath) || !fs.existsSync(fullchainPath)) {
    throw new Error('Certificate files were not created properly');
  }

  const expiresAt = getCertificateExpiry(domain);
  
  return dbCreateCertificate(data, fullchainPath, keyPath, expiresAt);
};

export const getCertificateExpiry = (domain: string): string => {
  try {
    const result = execSync(
      `certbot certificates --domain ${domain}`,
      { encoding: 'utf8' }
    );
    
    const match = result.match(/Expiry Date:\s*(.*?)(?:\n|$)/);
    if (match && match[1]) {
      return match[1].trim();
    }
  } catch (error) {
    console.log('Could not get certificate expiry, using default');
  }
  
  const date = new Date();
  date.setMonth(date.getMonth() + 3);
  return date.toISOString();
};

export const renewCertificate = async (domain: string): Promise<Certificate | null> => {
  const existingCert = getCertificateByDomain(domain);
  if (!existingCert) {
    return null;
  }

  try {
    execSync(
      `certbot renew --cert-name ${domain} --non-interactive`,
      { stdio: 'ignore' }
    );
  } catch (error) {
    console.log(`Failed to renew certificate for ${domain}:`, error);
    return null;
  }

  const expiresAt = getCertificateExpiry(domain);
  return { ...existingCert, expiresAt };
};

export const deleteCertificateFiles = (domain: string): void => {
  try {
    execSync(
      `certbot delete --cert-name ${domain} --non-interactive`,
      { stdio: 'ignore' }
    );
  } catch (error) {
    console.log(`Failed to delete certificate files for ${domain}`);
  }
};

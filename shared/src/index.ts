export interface ProxyHost {
  id: number;
  domain: string;
  targetUrl: string;
  enabled: boolean;
  sslEnabled: boolean;
  certificateId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Certificate {
  id: number;
  domain: string;
  provider: 'letsencrypt' | 'self-signed';
  certPath: string;
  keyPath: string;
  expiresAt: string;
  createdAt: string;
}

export interface CreateCertificateDto {
  domain: string;
  email?: string;
  provider?: 'letsencrypt' | 'self-signed';
}

export interface CreateProxyHostDto {
  domain: string;
  targetUrl: string;
  enabled?: boolean;
  sslEnabled?: boolean;
  certificateId?: number;
}

export interface UpdateProxyHostDto {
  domain?: string;
  targetUrl?: string;
  enabled?: boolean;
  sslEnabled?: boolean;
  certificateId?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ProxyHostApi {
  list: () => Promise<ApiResponse<ProxyHost[]>>;
  get: (id: number) => Promise<ApiResponse<ProxyHost>>;
  create: (data: CreateProxyHostDto) => Promise<ApiResponse<ProxyHost>>;
  update: (id: number, data: UpdateProxyHostDto) => Promise<ApiResponse<ProxyHost>>;
  delete: (id: number) => Promise<ApiResponse<void>>;
  reload: () => Promise<ApiResponse<void>>;
}

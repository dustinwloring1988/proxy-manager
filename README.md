# Proxy Manager

A reverse proxy management system with a web UI for managing proxy hosts and SSL certificates.

## Features

- **Proxy Host Management**: Create, edit, and delete reverse proxy configurations
- **SSL Certificate Management**: Request Let's Encrypt certificates with automatic renewal
- **Real-time Nginx Configuration**: Changes automatically update the nginx config
- **Web UI**: Modern React-based interface for managing all settings

## Tech Stack

- **Frontend**: React + Vite + TypeScript
- **Backend**: Express + TypeScript
- **Database**: SQLite (better-sqlite3)
- **Reverse Proxy**: Nginx
- **SSL**: Let's Encrypt via Certbot
- **Containerization**: Docker + Docker Compose

## Project Structure

```
proxy-manager/
├── backend/           # Express API server
│   └── src/
│       ├── index.ts           # Server entry point
│       ├── database.ts        # SQLite database operations
│       ├── routes/            # API routes
│       │   ├── proxyHosts.ts
│       │   └── certificates.ts
│       └── services/          # Business logic
│           ├── nginx.ts       # Nginx config generation
│           └── certificate.ts # Certbot integration
├── frontend/          # React web UI
│   └── src/
│       └── App.tsx           # Main application
├── shared/            # Shared TypeScript types
└── docker-compose.yml # Docker orchestration
```

## Getting Started

### Prerequisites

- Docker
- Docker Compose

### Installation & Running

```bash
# Start all services
npm run dev

# Or directly with docker-compose
docker-compose up
```

### Access

- Web UI: http://localhost:3001
- API: http://localhost:3000
- Nginx (HTTP): http://localhost:80
- Nginx (HTTPS): https://localhost:443

## API Endpoints

### Proxy Hosts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/proxy-hosts` | List all proxy hosts |
| GET | `/api/proxy-hosts/:id` | Get single proxy host |
| POST | `/api/proxy-hosts` | Create proxy host |
| PUT | `/api/proxy-hosts/:id` | Update proxy host |
| DELETE | `/api/proxy-hosts/:id` | Delete proxy host |
| POST | `/api/proxy-hosts/reload` | Reload nginx config |

### Certificates

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/certificates` | List all certificates |
| GET | `/api/certificates/:id` | Get single certificate |
| POST | `/api/certificates` | Request new certificate |
| DELETE | `/api/certificates/:id` | Delete certificate |

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Backend server port |
| `NODE_ENV` | `development` | Node environment |

### Creating a Proxy Host

1. Click "Add Host" in the web UI
2. Enter the domain (e.g., `example.com`)
3. Enter the target URL (e.g., `http://localhost:8080`)
4. Optionally enable SSL and select a certificate

### Requesting SSL Certificates

1. Click "New Certificate" in the SSL Certificates tab
2. Enter your domain
3. Optionally enter an email for Let's Encrypt notifications
4. Ensure your domain's DNS A record points to this server
5. Port 80 must be accessible for HTTP challenge

## Building

```bash
# Build all workspaces
npm run build

# Clean up containers and volumes
npm run clean
```

## License

MIT

<div align="center">

# ⚡ ImportCSV: Open Source CSV Importer

<p align="center">
  <strong>The open-source CSV import solution for modern web applications</strong>
</p>

<p align="center">
  <em>Import rows in seconds with intelligent column mapping and validation</em>
</p>

[![Importer License: MIT](https://img.shields.io/badge/Frontend_License-MIT-blue.svg)](frontend/LICENSE)
[![Backend License: AGPL-3.0](https://img.shields.io/badge/Backend_License-AGPL--3.0-green.svg)](backend/LICENSE)
[![Admin License: AGPL-3.0](https://img.shields.io/badge/Admin_License-AGPL--3.0-green.svg)](admin/LICENSE)
[![Slack](https://img.shields.io/badge/Slack-Join%20Community-4A154B?logo=slack)](https://importcsv.slack.com)

<p align="center">
  <a href="#quick-start">Quick Start</a> •
  <a href="#documentation">Docs</a> •
  <a href="#demo">Demo</a> •
  <a href="#contributing">Contributing</a>
</p>

## Demo

https://github.com/user-attachments/assets/bca218fa-9fd1-4beb-abed-f3b1d745946a


## Features

<div align="center">
  <img src="docs/assets/importer.png" alt="ImportCSV Demo" width="800">
  <img src="docs/assets/schema.png" alt="ImportCSV Demo" width="800">
  <img src="docs/assets/mapping.png" alt="ImportCSV Demo" width="800">
  <img src="docs/assets/validation.png" alt="ImportCSV Demo" width="800">
  <img src="docs/assets/webhooks.png" alt="ImportCSV Demo" width="800">
</div>

</div>

## 🚀 Why ImportCSV?

Data importing is a critical but challenging part of any business application. ImportCSV solves this with a **production-ready**, **fully customizable** solution that handles the entire CSV import workflow:

- 📊 **Simple UI** - Polished, responsive interface for uploading and mapping data
- 🔄 **Intelligent Mapping** - Automatically matches columns to your schema
- ⚡ **High Performance** - Process millions of rows with background queue processing
- 🔌 **Easy Integration** - Drop-in React components for any web application
- 🔒 **Secure** - Built-in authentication and data validation

## ✨ Key Features

- **Smart Column Mapping** - Fuzzy matching of source columns to destination fields
- **Multi-Format Support** - Import from CSV, XLS, XLSX, and TSV files
- **Scalable Processing** - Redis Queue for handling large imports in the background
- **Secure Authentication** - JWT-based auth with automatic token refresh
- **Embeddable Components** - React SDK for seamless integration into any app
- **Comprehensive Validation** - Client and server-side validation with detailed feedback
- **Webhook Integration** - Connect with your existing systems and workflows
- **Customizable UI** - Tailor the interface to match your application's design

## 🏗️ Architecture

ImportCSV consists of three main components working together seamlessly:

- **Backend API** - FastAPI server with Redis Queue for background processing
- **Frontend SDK** - React components for file uploads and column mapping
- **Admin Dashboard** - Next.js application for managing and monitoring imports

## 🛠️ Tech Stack

- **Backend**: Python, FastAPI, SQLAlchemy, Redis Queue, PostgreSQL
- **Frontend**: TypeScript, React, Tailwind CSS
- **Admin**: Next.js, TypeScript, Shadcn UI
- **Deployment**: Docker & Docker Compose

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose installed
- Git for cloning the repository

### One-Command Setup with Docker

```bash
# Clone the repository
git clone https://github.com/abhishekray07/importcsv.git
cd importcsv

# Start all services
docker-compose up -d
```

This starts the complete stack:

- **PostgreSQL database** (port 5432)
- **Redis** for queue management (port 6379)
- **Backend API server** (http://localhost:8000)
- **Background worker** for processing imports
- **Admin dashboard** (http://localhost:3000)

### Accessing the Services

- **Admin Dashboard**: http://localhost:3000
  - Default login: Use the sign-up page to create your first admin account
  - Manage importers, view imports, configure webhooks
  
- **API Documentation**: http://localhost:8000/docs
  - Interactive API documentation (Swagger/OpenAPI)
  - Test endpoints directly from the browser

### First-Time Setup

After starting the services:

1. **Run database migrations** (if not auto-applied):
   ```bash
   docker-compose exec backend alembic upgrade head
   ```

2. **Create your admin account**:
   - Visit http://localhost:3000/auth/signup
   - Register with your email and password

3. **Create your first importer**:
   - Log in to the admin dashboard
   - Click "New Importer" to configure your first CSV import schema

### Stopping the Services

```bash
docker-compose down

# To also remove volumes (database data):
docker-compose down -v
```

## 📚 Documentation

Detailed documentation for each component:

- [Backend API Documentation](./backend/README.md)
- [Frontend SDK Documentation](./frontend/README.md)
- [Admin Dashboard Documentation](./admin/README.md)
- [API Reference](./backend/docs/api.md)

## 🔌 Integration

### Using the React SDK

```jsx
import { CSVImporter } from "csv-import-react";

function MyImportPage() {
  return (
    <CSVImporter
      importerKey="your-importer-key"
      onComplete={(result) => console.log("Import complete!", result)}
    />
  );
}
```

### Publishing for Local Development

```bash
cd frontend
yarn publish:local:react

cd {YOUR_PROJECT_PATH}
yalc add csv-import-react
```

See the [Frontend README](./frontend/README.md) for detailed integration instructions.

## 🔮 Roadmap

Upcoming features:

- **Multiple Destinations** - Export to different target systems
- **Dynamic Schema Detection** - Runtime schema configuration
- **Advanced Validation Rules** - Custom validation logic
- **Data Transformations** - Apply transformations during import
- **Analytics Dashboard** - Import statistics and performance tracking
- **AI-Powered Data Cleaning** - Automatic data normalization

## 👥 Contributing

We welcome contributions! Here's how to get started:

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project uses a dual-licensing approach:

- **Frontend** (`/frontend`) - MIT License for the embeddable CSV import component
- **Backend** (`/backend`) - AGPL-3.0 License for the API server and business logic
- **Admin** (`/admin`) - AGPL-3.0 License for the administration dashboard

See the [LICENSE](LICENSE) file for the complete licensing details.

### Why Dual Licensing?

We use MIT for the frontend to encourage widespread adoption and easy integration into your applications, while AGPL for the backend ensures that improvements to the server-side software remain open source when deployed as a service.

For organizations requiring different licensing terms for the backend and admin components, commercial licenses are available. Contact us for more information.

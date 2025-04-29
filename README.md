<div align="center">

# ImportCSV

<p align="center">
  <em>CSV import solution for web applications</em>
</p>

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

</div>

## Overview

ImportCSV helps users import CSV and spreadsheet data into web applications. It provides a React frontend for file uploads and column mapping, with a FastAPI backend for processing and storage.

> **Note**: The CSV Importer component was forked from [TableFlow's CSV Import](https://github.com/tableflowhq/csv-import) and enhanced with additional features.

## Key Features

- **Column Mapping** - Match source columns to destination fields
- **Multiple File Formats** - Support for CSV, XLS, XLSX, and TSV files
- **Background Processing** - Redis Queue for handling large imports
- **Authentication** - JWT-based auth with token refresh
- **Embeddable Components** - React components for easy integration
- **Data Validation** - Client-side validation with feedback
- **Webhooks** - Integration points for custom workflows

## Architecture

The project has three main components:

- **Backend** - FastAPI server with Redis Queue for background processing
- **Frontend** - React SDK for file uploads and column mapping
- **Admin** - Next.js dashboard for managing imports

## Tech Stack

- **Backend**: Python, FastAPI, SQLAlchemy, Redis Queue
- **Frontend**: TypeScript, React, Tailwind CSS
- **Admin**: Next.js, TypeScript, Shadcn
- **Deployment**: Docker & Docker Compose

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- Docker & Docker Compose (for deployment)

### Quick Start with Docker

The easiest way to get started is using Docker Compose:

```bash
# Clone the repository
git clone https://github.com/abhishekray07/importcsv.git
cd importcsv

# Start all services
docker-compose up -d
```

This will start:

- PostgreSQL database
- Redis for queue management
- Backend API server
- Frontend development server
- Admin dashboard

Visit http://localhost:3000 for the admin dashboard.

### Manual Setup

For development, you can set up each component individually:

1. **Backend Setup**

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your configuration
uvicorn app.main:app --reload
```

2. **Frontend Setup**

See frontend publishing instructions below.

4. **Admin Dashboard Setup**

```bash
cd admin
npm install
npm run dev
```

## Documentation

For detailed documentation on each component, please refer to the README in each directory:

- [Backend Documentation](./backend/README.md)
- [Frontend SDK Documentation](./frontend/README.md)
- [Admin Dashboard Documentation](./admin/README.md)

## Publishing the Frontend Library

### Using Yalc (for Local Development)

```bash
cd frontend
yarn publish:local:react


cd {YOUR_PROJECT_PATH}
yalc add csv-import-react
```

See the [Frontend README](./frontend/README.md) for more detailed instructions.

## Roadmap

Future development plans include:

- **Multiple Destinations** - Support for exporting to different target systems
- **Dynamic CSV Schemas** - Runtime schema detection and configuration
- **Enhanced Validation** - Improved server-side validation rules
- **Data Transformations** - Custom transformations during import
- **Analytics** - Import statistics and performance tracking

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

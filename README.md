# ImportCSV

An intuitive, flexible, open-source CSV importer focused on exceptional developer experience, leveraging LLMs to simplify tedious import tasks, improve data quality, and speed up integration.

## Features

- **Dynamic Schema & Columns**
  - Auto-detect schema from uploaded CSVs
  - Runtime addition/editing of columns and field types

- **Multiple File Support**
  - CSV, XLS, XLSX, TSV

- **Embeddable UI & SDK**
  - One-line embed (React, Vue, Angular)
  - SDK methods for advanced integrations

- **Intelligent LLM-powered Column Matching & Data Cleaning**
  - Auto-match column names/types via GPT
  - Smart column mapping with AI-powered suggestions
  - One-click auto-correction & validation fixes

- **Comprehensive Validation**
  - Client-side immediate validation feedback
  - Server-side JSON Schema-based validation

- **Extensible Webhooks & Integration**
  - Webhook events (import start, validation errors, completion)
  - Direct integrations (Postgres, APIs, Airtable)

- **Self-hosting & Cloud Option**
  - Docker-compose for easy self-hosting
  - Separate managed cloud version (SaaS) available

## Architecture

```
Frontend Embeddable Widget (React SDK)
              │
              └─── Backend API (FastAPI Python)
                      │─── Authentication (JWT, OAuth for cloud)
                      │─── Schema & Column Detection (OpenAI API or local LLM)
                      │─── Data Validation & Cleaning (JSON Schema, GPT-driven corrections)
                      │─── Destination Integration Layer (Postgres, Airtable, custom API)
                      │─── Webhook Service
                      │
                      └─── Data Storage Layer (Postgres/SQLite for OSS, managed Postgres for cloud)
```

## Tech Stack

- **Backend**: Python 3.11+, FastAPI, SQLAlchemy, Pydantic
- **Frontend**: TypeScript, React, Tailwind CSS
- **LLM Integration**: LiteLLM
- **Deployment**: Docker & Docker-compose

## LLM-Enhanced Column Mapping

ImportCSV now features AI-powered column mapping that intelligently matches CSV columns to your schema:

- **Smart Semantic Matching**: Understands relationships between column names beyond string similarity
- **Context-Aware**: Uses sample data to improve matching accuracy
- **User Control**: Toggle between AI and traditional matching

### Configuration

1. Set your OpenAI API key in the backend `.env` file:
   ```
   OPENAI_API_KEY=your-api-key-here
   OPENAI_MODEL=gpt-3.5-turbo  # or gpt-4 for higher accuracy
   ```

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- Docker & Docker Compose (for deployment)
- OpenAI API key (for LLM-enhanced features)

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/importcsv.git
cd importcsv
```

2. Set up the backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. Set up the frontend
```bash
cd ../frontend
npm install
```

4. Configure environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. Start the development servers
```bash
# Backend
cd backend
uvicorn app.main:app --reload

# Frontend
cd ../frontend
npm run dev
```

## License

[MIT](LICENSE)

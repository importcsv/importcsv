<div align="center">

# ImportCSV

### The AI-powered CSV importer for React applications

[![Frontend License: MIT](https://img.shields.io/badge/Frontend-MIT-blue.svg)](frontend/LICENSE)
[![Backend License: AGPL-3.0](https://img.shields.io/badge/Backend-AGPL--3.0-green.svg)](backend/LICENSE)
[![npm version](https://img.shields.io/npm/v/@importcsv/react)](https://www.npmjs.com/package/@importcsv/react)

[Documentation](https://docs.importcsv.com) | [Live Demo](https://demo.importcsv.com) | [API Reference](http://localhost:8000/docs) | [Join Slack](https://importcsv.slack.com)

</div>

## What is ImportCSV?

A React component that handles CSV imports with automatic column mapping and data validation.

**Two ways to use it:**
- **Local Mode**: Everything runs in the browser. No backend needed.
- **Backend Mode**: Adds AI column mapping and natural language transformations with OpenAI.

## How It Works

### Local Mode
1. Users upload CSV/Excel files
2. Virtual scrolling handles large files without crashing
3. Built-in validation catches errors (email, phone, date formats)
4. Transformations clean the data (trim, capitalize, normalize)
5. You get clean, validated JSON

### Backend Mode (with AI)
1. Same upload experience
2. OpenAI automatically maps columns based on names and sample data
3. Users can fix errors with natural language ("fix all phone numbers")
4. Background processing with Redis Queue for large files
5. Webhook notifications when imports complete

## Demo

https://github.com/user-attachments/assets/bca218fa-9fd1-4beb-abed-f3b1d745946a

## Getting Started

ImportCSV works in two modes:

### Option 1: Local Mode (No Backend Required)
Perfect for getting started quickly. Configure everything in your React code.

```jsx
import { CSVImporter } from "@importcsv/react";

function App() {
  return (
    <CSVImporter
      columns={[
        { id: 'name', label: 'Name', validators: [{ type: 'required' }] },
        { id: 'email', label: 'Email', validators: [{ type: 'email' }] },
        { id: 'phone', label: 'Phone' }
      ]}
      onComplete={(data) => console.log("Import complete!", data)}
    />
  );
}
```

### Option 2: Backend Mode (Full Features)
For production apps with centralized configuration, AI features, and background processing.

```jsx
import { CSVImporter } from "@importcsv/react";

function App() {
  return (
    <CSVImporter
      importerKey="contacts"
      backendUrl="https://your-api.com"  // Your backend API
      onComplete={(data) => console.log("Import complete!", data)}
    />
  );
}
```

**Which mode should I use?** Local mode for quick prototypes and simple needs. Backend mode for production apps with AI features, webhooks, and team collaboration. [See detailed comparison](#local-vs-backend-mode)

## Features

<details>
<summary><b>Automatic Column Mapping</b></summary>

Uses OpenAI to match CSV columns to your schema (Backend Mode only).

**Example:**
Your schema expects `email`, but the CSV has `Customer Email Address`.
ImportCSV automatically maps them together.

**How it works:**
- Sends column names + sample data to OpenAI
- Returns mapping suggestions with confidence scores
- Caches results in Redis for repeated imports

**Code:**
```javascript
// Your schema
const columns = [
  { id: "email", label: "Email" },
  { id: "name", label: "Name" },
  { id: "phone", label: "Phone" }
];

// CSV has: "Customer Email", "Full Name", "Telephone"
// AI maps them automatically to your schema
```

</details>

<details>
<summary><b>Natural Language Transformations</b></summary>

Fix data issues by describing what you want in plain English (Backend Mode only).

**Example commands:**
- "Fix all email addresses"
- "Format phone numbers as (XXX) XXX-XXXX"
- "Convert dates to YYYY-MM-DD"
- "Capitalize all names"
- "Remove special characters"

**How it works:**
- Uses BAML templates for structured AI prompts
- OpenAI processes the transformation request
- Returns specific cell changes for review
- User accepts or rejects each change

</details>

<details>
<summary><b>Data Validation</b></summary>

Built-in validators for common data types (works in both modes).

**Available validators:**
- Required fields
- Email format
- Phone number format
- Date validation
- Number ranges (min/max)
- Regex patterns
- Custom validation functions

**Example:**
```jsx
const columns = [
  {
    id: "email",
    label: "Email",
    validators: [
      { type: "required" },
      { type: "email" }
    ]
  }
];
```

Users see validation errors inline and can fix them before import.

</details>

<details>
<summary><b>Performance & Large Files</b></summary>

**Local Mode:**
- Virtual scrolling with @tanstack/react-virtual
- Handles up to 100,000 rows in browser
- Memory usage: ~2x file size

**Backend Mode:**
- Redis Queue for background processing
- Chunked processing for files >50MB
- Can handle 1GB+ files
- Webhook notifications when complete

</details>

## Local vs Backend Mode

<details>
<summary><b>Choosing Between Local and Backend Mode</b></summary>

### Quick Comparison

| Feature | Local Mode | Backend Mode |
|---------|------------|--------------|
| **Setup Time** | 2 minutes | 30 minutes |
| **Configuration** | In React code | Admin dashboard |
| **AI Column Mapping** | ❌ No | ✅ Yes (OpenAI) |
| **Natural Language Transforms** | ❌ No | ✅ Yes |
| **Large Files (>10MB)** | Limited | ✅ Background processing |
| **Webhooks** | ❌ Manual | ✅ Built-in |
| **Team Collaboration** | ❌ Code changes | ✅ Admin UI |
| **Multiple Environments** | Code duplication | ✅ Shared configs |
| **Data Privacy** | Client-side only | ✅ Self-hosted option |

### When to Use Local Mode

- **Quick prototypes** or proof of concepts
- **Simple imports** with static schemas
- **Single developer** projects
- **No backend** infrastructure available
- **Client-side only** applications

### When to Use Backend Mode

- **Production applications** with complex needs
- **AI features** for smart column mapping
- **Team collaboration** on import configurations
- **Webhook notifications** to other systems
- **Large file processing** with background jobs
- **Multiple applications** sharing configs
- **Audit trails** and import history

### Migration Path
Start with Local Mode for quick development, then migrate to Backend Mode when you need advanced features:
1. Set up backend infrastructure (Docker makes this easy)
2. Create importers in admin dashboard
3. Replace `columns` prop with `importerKey` and `backendUrl`

</details>

## Installation

### For Local Mode (Quick Start)

```bash
npm install @importcsv/react
# or
yarn add @importcsv/react
```

### For Backend Mode (Full Features)

```bash
# Clone and start all services with Docker
git clone https://github.com/abhishekray07/importcsv.git
cd importcsv
docker-compose up -d

# Access services
# Admin Dashboard: http://localhost:3000
# API: http://localhost:8000/docs
```


## Configuration

### Enable AI Features (Backend Mode Only)

To enable AI column mapping and natural language transformations in Backend Mode:

1. Add to your backend `.env` file:
```bash
# Required for AI features
OPENAI_API_KEY=sk-xxxxx
```

2. Restart the backend service:
```bash
docker-compose restart backend
```

**Note:** AI features are only available in Backend Mode. In Local Mode, column mapping uses fuzzy string matching.

## Why ImportCSV?

| | Build Your Own | ImportCSV Local | ImportCSV + Backend |
|--|---------------|-----------------|---------------------|
| Setup time | Weeks | 5 minutes | 30 minutes |
| Column mapping | Manual UI | Fuzzy matching | AI-powered (OpenAI) |
| Large files | Custom solution | Virtual scrolling | Background processing |
| Data validation | Write validators | Built-in validators | Built-in + AI fixes |
| Transformations | Custom code | Built-in transforms | Natural language |

## Technical Stack

**Frontend:**
- Virtual scrolling with @tanstack/react-virtual
- Built-in validators (email, phone, date, regex)
- Transformations (trim, capitalize, normalize)
- TypeScript + React/Preact

**Backend (Optional):**
- FastAPI + PostgreSQL + Redis
- OpenAI integration via LiteLLM and BAML
- Background jobs with Redis Queue (RQ)
- Webhook notifications

## Limitations

- AI features require OpenAI API key (Backend Mode only)
- Natural language commands are English-only
- No built-in deduplication
- React/Preact only (no Vue/Angular versions)
- No streaming upload (files loaded to memory first)

## Community & Support

- [Slack Community](https://importcsv.slack.com) - Get help and share feedback
- [Documentation](https://docs.importcsv.com) - Guides and API reference
- [GitHub Issues](https://github.com/importcsv/importcsv/issues) - Bug reports and feature requests

## Contributing

We welcome contributions! See our [Contributing Guide](CONTRIBUTING.md) for details.

```bash
# Quick start for contributors
git clone https://github.com/importcsv/importcsv.git
cd importcsv
docker-compose up -d
```

## License

- **Frontend** (`/frontend`): MIT License - Use freely in your applications
- **Backend** (`/backend`): AGPL-3.0 - Modifications must be open sourced
- **Admin** (`/admin`): AGPL-3.0 - Modifications must be open sourced

For commercial licensing options, [contact us](mailto:support@importcsv.com).
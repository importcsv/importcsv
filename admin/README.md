# ImportCSV Admin Dashboard

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-green.svg)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14.0+-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

A Next.js-based admin interface for the ImportCSV application.

## Overview

This admin dashboard provides an interface for managing CSV imports and configurations.

## Technology Stack

- **Framework**: Next.js
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI components

## Project Structure

```
admin/
├── src/
│   ├── app/          # Next.js App Router pages
│   ├── components/   # Reusable UI components
│   ├── context/      # React context providers
│   ├── lib/          # Utility libraries
│   ├── types/        # TypeScript type definitions
│   └── utils/        # Helper functions
├── public/           # Static assets
└── package.json      # Dependencies and scripts
```

## Getting Started

### Prerequisites

- Node.js
- Backend API running

### Installation

1. Install dependencies:

```bash
npm install
# or
yarn install
```

2. Run the development server:

```bash
npm run dev
# or
yarn dev
```

3. Open [http://localhost:3000](http://localhost:3000) with your browser to see the dashboard.

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run linter

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](../LICENSE) file for details.

# og-preview

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg) ![License](https://img.shields.io/badge/license-MIT-green.svg) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg)

> Fetch and preview Open Graph meta tags from any URL. Debug how your links look on social media.

## Features

- CLI tool
- TypeScript support

## Tech Stack

**Runtime:**
- TypeScript v5.9.3

## Prerequisites

- Node.js >= 18.0.0
- npm or yarn

## Installation

```bash
cd og-preview
npm install
```

Or install globally:

```bash
npm install -g og-preview
```

## Usage

### CLI

```bash
og-preview
```

### Available Scripts

| Script | Command |
|--------|---------|
| `npm run build` | `tsc` |
| `npm run start` | `node dist/index.js` |
| `npm run serve` | `node dist/index.js --serve` |

## Project Structure

```
├── public
│   └── index.html
├── src
│   ├── fetcher.ts
│   ├── formatter.ts
│   ├── index.ts
│   ├── parser.ts
│   ├── scorer.ts
│   └── server.ts
├── package.json
├── README.md
└── tsconfig.json
```

## License

This project is licensed under the **MIT** license.

## Author

**Zakaria Kone**

# PoishaGo

Fintech digital wallet app built for Bangladesh featuring native money transfers, bill payments, rewards portal, and compliance dashboards.

## Tech Stack

- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand
- **Form Validation**: Zod + React Hook Form
- **Icons**: Lucide React
- **Testing**: Vitest + React Testing Library

## Getting Started

**Prerequisites:** Node.js (v18+)

### 1. Installation

Install all frontend dependencies:
```bash
npm install
```

### 2. Development

Run the local development server:
```bash
npm run dev
```

### 3. Testing

We use Vitest and React Testing Library for frontend testing.

To run tests in watch mode during development:
```bash
npm run test
```

To run all tests once (CI mode):
```bash
npm run test:run
```



### 4. Build for Production

```bash
npm run build
```

## Features & Architecture

- **Global Error Handling**: Custom `ErrorBoundary` prevents the app from crashing entirely during runtime errors.
- **Unified Toast Notifications**: Reusable `useToast` and `useApiCall` hooks auto-manage loading states and error/success alerts globally.
- **Zod Validation**: Robust schema definitions in `src/utils/validators.ts` for all user inputs (NID, Phone, PINs, Transfer Amounts).
- **Advanced Pagination**: Reusable `Pagination` component for cleanly rendering large datasets (like transaction histories) with customizable page sizes.

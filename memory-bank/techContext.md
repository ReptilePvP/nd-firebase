# Tech Context

## Technologies Used
- **Frontend**: React, TypeScript, Vite
- **Backend**: Firebase (Authentication, Firestore, Cloud Functions)
- **AI Services**: Google Gemini (likely `firebase_functions_src/geminiService.ts`), potentially OpenAI (`services/openAiService.ts`)
- **Package Management**: npm/yarn

## Development Setup
- Node.js and npm/yarn for package management.
- Firebase CLI for deploying backend services.
- Vite for frontend development server and build.

## Technical Constraints
- Firebase free tier limitations (if applicable).
- AI service API rate limits.
- Data storage for feedback: Firestore is a likely candidate.

## Dependencies
- `package.json` and `firebase_functions_src/package.json` will list specific dependencies.
- Frontend dependencies: React, etc.
- Firebase Cloud Functions dependencies: Firebase Admin SDK, AI service SDKs (e.g., `@google/generative-ai`).

## Tool Usage Patterns
- `execute_command`: For running `npm install`, `npm run dev`, `firebase deploy`.
- `read_file`: To inspect existing code, especially `components/ResultDisplay.tsx`, `firebase_functions_src/index.ts`, `firebase_functions_src/geminiService.ts`, and `services/geminiService.ts` or `services/openAiService.ts`.
- `write_to_file` / `replace_in_file`: For modifying existing files or creating new ones.
- `search_files`: To locate relevant code sections, e.g., where AI results are displayed or processed.

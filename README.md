BulkFlow
BulkFlow is an asynchronous bulk data processing platform that helps businesses upload, process, monitor, and export CSV and Excel datasets without waiting for the entire operation to finish.
Instead of processing every row during the upload request, BulkFlow records the upload and sends work to background queues. Workers process the data independently, while the application tracks job status, row-level results, failures, and progress.
Project note: The enrichment flow currently uses a mock provider unless a real provider has been configured. Do not describe the mock as live AI enrichment.

Table of Contents

- Why BulkFlow?
- How It Works
- Features
- Architecture
- Technology Stack
- Project Structure
- Getting Started
- Environment Variables
- Run the Application
- Typical Workflow
- Job Statuses
- API Overview
- Testing
- Production Considerations
- Future Improvements
- License
  Why BulkFlow?
  Processing a spreadsheet with hundreds or thousands of records can involve parsing files, transforming rows, calling enrichment services, handling errors, and preparing exports. Doing all of that inside one HTTP request can make an application slow and difficult to monitor.
  BulkFlow separates uploading from processing:
- The API accepts the upload and records its metadata.
- A background worker parses the file.
- Individual rows are saved and processed asynchronously.
- Job status and row counts are persisted so users can check progress later.
- Failed rows retain error details.
- Eligible jobs can be retried.
- Completed results can be exported to CSV.
  This project demonstrates a practical background-processing architecture using queues, workers, persistent job state, and real-time updates.
  How It Works
  CSV/XLSX selected in the frontend
  |
  v
  React frontend
  |
  v
  Express API
  |
  v
  Upload record and file storage
  |
  v
  BullMQ ingestion queue
  |
  v
  Ingestion worker
  (parse the spreadsheet)
  |
  v
  Row-level results in MongoDB
  |
  v
  BullMQ processing queue
  |
  v
  Processing worker
  |
  +------> Update job and upload statistics
  | |
  | v
  | Socket.IO events
  | |
  | v
  | Live frontend updates
  v
  Completed results
  |
  v
  BullMQ export queue
  |
  v
  Export worker
  |
  v
  CSV file
  BullMQ uses Redis to coordinate background tasks. The API handles user requests while workers handle longer-running ingestion, row processing, and export operations.
  Features
  File uploads
- Accepts CSV and XLSX input files.
- Stores upload metadata and processing configuration.
- Keeps ingestion separate from row processing.
  Asynchronous processing
- Uses BullMQ and Redis for background queues.
- Separates ingestion, processing, and export into distinct workers.
- Persists job state and processing counters in MongoDB.
  Real-time progress
- Tracks total, processed, successful, and failed rows.
- Calculates progress as a percentage.
- Uses Socket.IO to send job status and progress events to connected clients.
  Row-level results and errors
- Stores each input row as an individual result.
- Preserves original row data alongside processed data.
- Records result status, processing timestamps, and error details.
  Retry and cancellation
- Supports retrying eligible failed or partially failed jobs.
- Supports cancellation for eligible uploads and jobs.
- Exposes lifecycle state so the frontend can show the current outcome.
  Optional enrichment flow
- Provides an enrichment step that can be enabled for a job.
- Uses a provider/service abstraction that can be connected to a real service.
- The current mock provider demonstrates the flow but does not perform external AI enrichment by itself.
  CSV exports
- Generates CSV files from processed results.
- Runs export generation in a background worker.
- Stores export status and file metadata.
  Dashboard and API
- Dashboard summaries for jobs, uploads, processing totals, and recent activity.
- REST endpoints for authentication, uploads, jobs, results, exports, and dashboard data.
- JWT-based authentication, Zod validation where implemented, pagination where implemented, and security middleware.
  Architecture
  BulkFlow has a React frontend and a Node.js backend. The API and background workers run as separate processes.
  Component Responsibility
  React + Vite User interface for uploads, jobs, results, progress, and exports
  Express 5 REST API and request handling
  MongoDB + Mongoose Persistent users, uploads, jobs, results, and export records
  Redis Queue infrastructure
  BullMQ Background task queues
  Worker processes Parse files, process rows, and generate exports
  Socket.IO Live job status and progress events
  Axios Frontend HTTP client
  Tailwind CSS Frontend styling

Technology Stack
Frontend

- React
- Vite
- React Router
- Axios
- Tailwind CSS
- Socket.IO Client
- lucide-react
  Backend
- Node.js
- Express 5
- MongoDB and Mongoose
- Redis and BullMQ
- Socket.IO
- Multer
- csv-parser
- @andreeewill/exceljs
- Zod
- JWT authentication
- Helmet, CORS, and other configured middleware
  Project Structure
  BulkFlow/
  ├── apps/
  │ ├── backend/
  │ │ ├── src/
  │ │ │ ├── app/
  │ │ │ ├── config/
  │ │ │ ├── constants/
  │ │ │ ├── middlewares/
  │ │ │ ├── modules/
  │ │ │ │ ├── auth/
  │ │ │ │ ├── users/
  │ │ │ │ ├── uploads/
  │ │ │ │ ├── jobs/
  │ │ │ │ ├── results/
  │ │ │ │ ├── exports/
  │ │ │ │ ├── processing/
  │ │ │ │ ├── enrichment/
  │ │ │ │ └── dashboard/
  │ │ │ ├── queues/
  │ │ │ ├── workers/
  │ │ │ ├── services/
  │ │ │ ├── socket/
  │ │ │ ├── utils/
  │ │ │ ├── server.js
  │ │ │ └── worker.js
  │ │ ├── tests/
  │ │ └── package.json
  │ └── frontend/
  │ ├── src/
  │ │ ├── components/
  │ │ ├── context/
  │ │ ├── hooks/
  │ │ ├── pages/
  │ │ ├── routes/
  │ │ ├── services/
  │ │ ├── socket/
  │ │ ├── utils/
  │ │ ├── App.jsx
  │ │ ├── main.jsx
  │ │ └── index.css
  │ ├── package.json
  │ └── vite.config.js
  └── README.md
  The structure may evolve as the application grows.
  Getting Started
  Prerequisites
  Install or configure:
- Node.js (prefer a current LTS release)
- npm
- MongoDB, locally or through MongoDB Atlas
- Redis, locally or through a reachable Redis service
- Git
  Check your installed versions:
  node --version
  npm --version

1. Clone the repository
   git clone <YOUR_REPOSITORY_URL>
   cd BulkFlow
   Replace <YOUR_REPOSITORY_URL> with your repository URL.
2. Install backend dependencies
   cd apps/backend
   npm install
   Create apps/backend/.env using the template below.
3. Install frontend dependencies
   In another terminal:
   cd apps/frontend
   npm install
   Create apps/frontend/.env using the template below.
   Environment Variables
   Backend — apps/backend/.env
   PORT=3000
   DB_URI=mongodb+srv://<username>:<password>@<cluster-host>/<database>?retryWrites=true&w=majority
   JWT_SECRET=replace_with_a_long_random_secret
   JWT_EXPIRES_IN=7d
   REFRESH_TOKEN_SECRET=replace_with_another_long_random_secret
   REFRESH_TOKEN_EXPIRES_IN=14d
   REDIS_URL=redis://localhost:6379
   CLIENT_URL=http://localhost:5173
   Important:

- Replace the MongoDB placeholders with your actual connection string.
- URL-encode special characters in MongoDB credentials when necessary.
- Make sure Redis is running and reachable at REDIS_URL.
- CLIENT_URL should match the frontend origin.
- Check src/config/env.js to confirm the variables required by your current version.
- Never commit real secrets or share .env files.
  Frontend — apps/frontend/.env
  VITE*API_URL=http://localhost:3000/api/v1
  Only put public configuration in variables prefixed with VITE*. Frontend variables are exposed to client-side code, so never store secrets there.
  Run the Application
  Start MongoDB and Redis first. Run the API, workers, and frontend in separate terminals.
  Terminal 1 — Backend API
  cd apps/backend
  npm run dev
  The API uses port 3000 by default.
  Terminal 2 — Background workers
  cd apps/backend
  npm run dev:worker
  For a non-development worker process, use:
  npm run start:worker
  Use npm run start:worker, not npm start:worker.
  Terminal 3 — Frontend
  cd apps/frontend
  npm run dev
  Open the local URL printed by Vite, typically http://localhost:5173.
  Startup checklist
- MongoDB is reachable from the API and worker processes.
- Redis is running and the REDIS_URL is correct.
- VITE_API_URL points to the API.
- CLIENT_URL matches the frontend origin for CORS and Socket.IO.
- The worker process stays running and connects to its dependencies.
  Typical Workflow

1. Register or log in to authenticate.
2. Upload a spreadsheet in CSV or XLSX format.
3. Configure the job by giving it a name and choosing whether to enable enrichment.
4. Monitor progress and inspect job status and row counts.
5. Review results and inspect row-level errors.
6. Retry eligible jobs when processing fails or some rows have errors.
7. Export results to CSV after processing completes.
   Job Statuses
   Status Meaning
   queued Work is waiting for a worker
   processing Ingestion or processing is underway
   completed Processing finished without failed rows
   completed_with_errors Processing finished, but one or more rows failed
   failed The job failed before completing successfully
   cancelled The job was cancelled

A completed_with_errors job has finished, but some individual results may have failed. Inspect those results to understand the cause.
API Overview
The local API base URL is:
http://localhost:3000/api/v1
The main resource areas are:
Resource Purpose
Authentication and users Account creation and authentication
Uploads Submit files and retrieve upload information
Jobs Create, list, inspect, update, cancel, or retry eligible jobs
Results Retrieve row-level results and error details
Exports Request CSV exports and inspect export status
Dashboard Retrieve summary metrics and recent jobs

Most application endpoints require an access token. Consult the backend route definitions and validation schemas for the exact paths, request bodies, and supported operations.
Testing
Start with a small, well-formed CSV:
name,email,company,job_title,city,industry
Aarav Mehta,aarav@example.com,TechNova,Software Engineer,Bengaluru,Technology
Priya Sharma,priya@example.com,FinEdge,Engineering Manager,Mumbai,Finance
Rohan Verma,rohan@example.com,CloudPeak,CTO,Hyderabad,Technology
Check that:

- The upload is accepted and recorded.
- A job can be created for the upload.
- Ingestion creates the expected number of results.
- Successful processing reaches 100% progress.
- Successful and failed counts match the row-level results.
- The job interface receives live updates.
- A completed job can be exported and the downloaded CSV is correct.
- XLSX input is parsed correctly.
- Cancellation and retry behavior follows the job's current state.
  Use synthetic test data. Avoid uploading real customer or personal information into an environment you do not control.
  Production Considerations
- Enrichment: Connect and test a real provider before claiming live AI enrichment.
- Large files: Measure memory usage and consider streaming/batch parsing and database writes for large datasets.
- Worker scaling: Tune concurrency, retries, rate limits, and cancellation behavior before increasing throughput.
- Export storage: The current implementation stores exports on the backend filesystem. Multi-instance deployments generally need private object storage or shared storage.
- Security: Use strong secrets, restrict database/network access, validate uploaded files, and keep dependencies updated.
- Observability: Consider structured logs, metrics, health checks, and alerting for the API, workers, MongoDB, and Redis.
  Future Improvements
- Integration and end-to-end tests for the complete upload-to-export flow.
- Streaming or batch-based parsing for very large files.
- Stronger retry and cancellation observability.
- Integration with a real enrichment provider.
- Private object storage for uploads and exports.
- Metrics, structured logs, health checks, and CI checks.
- Deployment instructions for production environments.
  Contributing

1. Fork the repository.
2. Create a focused feature branch.
3. Make your change and add or update tests.
4. Run the relevant checks.
5. Open a pull request explaining the change and how it was tested.
   License
   Add a license file before distributing the project publicly. Without a license, explicit reuse and redistribution permissions have not been granted.

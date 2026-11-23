# St. Paul's University Academic Workflow Backend

A Node.js and Express API prototype for receiving and tracking student academic workflow requests.

## Run locally
1. Install Node.js.
2. Download or clone this repository.
3. Run `npm install`.
4. Run `npm start`.
5. Open `http://localhost:5000` to check the server.

## API endpoints
- `GET /` — backend health check
- `POST /api/requests` — submit a student request
- `GET /api/requests` — list all requests
- `GET /api/requests/student/:admissionNumber` — list requests for an admission number
- `GET /api/requests/:id` — get one request
- `PATCH /api/requests/:id/status` — update a request status

A request submission requires `studentName`, `admissionNumber`, `requestType`, and `description`.

## Important security and deployment notice
This is a development prototype. It does not yet implement verified student sign-in, staff authentication, role-based authorization, or protected audit operations. Do not expose the list or status-update endpoints publicly with real student information until authentication and authorization are implemented. JSON-file storage may be temporary on hosted services; use persistent storage such as PostgreSQL before relying on hosted records.

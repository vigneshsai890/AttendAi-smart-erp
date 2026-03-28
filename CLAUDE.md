# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

This project has a 3-tier architecture:
1. **Frontend**: React application located at the root directory.
2. **Backend**: Java/Spring Boot application located in `backend/`.
3. **AI Module**: Python/Flask microservice for facial recognition located in `ai_module/`.

## Commands

```bash
# Frontend (Root)
npm start        # Start React dev server (port 3000)
npm test         # Run React tests
npm run build    # Build for production

# Backend (Java/Spring Boot)
cd backend && ./mvnw spring-boot:run # Start Spring Boot app (port 8080)
cd backend && ./mvnw clean install   # Build Java app
cd backend && ./mvnw test            # Run Java tests

# AI Module (Python)
cd ai_module && pip install -r requirements.txt
cd ai_module && python server.py     # Start Flask AI server (port 5000)
```

## Architecture

**Smart Attendance System** uses facial recognition to track student attendance.

### Frontend (React App)
- At the root (`package.json`, `src/`, `public/`). Built with Create React App (React 19).
- Uses `react-router-dom` for routing, `axios` for HTTP, `chart.js` for visualizations, and Tailwind CSS.
- Key views: `AdminPanel.js`, `Dashboard.js`, `StudentDashboard.js`, `CameraAttendance.js`.

### Backend (Java Spring Boot)
- Under `backend/`. Exposes REST APIs at `localhost:8080/api/` for managing users, students, and attendance.
- Database: Uses **MySQL** (`smartclass_db`) via Spring Data JPA / Hibernate. Configured in `backend/src/main/resources/application.properties` (default: root/root).
- Core entities: `User`, `Student`, `AttendanceRecord`, `Role`.

### AI Module (Python/Flask)
- Under `ai_module/`. A microservice running on port 5000 that processes images for facial recognition using **MediaPipe** and **OpenCV**.
- Receives images via the `/process-class-photo` endpoint, extracts face embeddings (`scan_faces.py`), matches against `known_faces/`, and makes an HTTP POST back to the Spring Boot backend (`localhost:8080/api/attendance/mark`) to record attendance.

## Development Notes
- When making frontend changes, edit the files in the root `src/` directory.
- For AI/Computer Vision logic, modify `ai_module/`. Ensure changes to face processing update the corresponding database records in the backend via HTTP.
- For data model or API changes, modify the Spring Boot `backend/` and verify MySQL connections.

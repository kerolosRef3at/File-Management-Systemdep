# Backend Requirements Specifications - AITU File Management System

This document specifies the required REST API endpoints, security configurations, payload models, and response formats needed by the frontend application.

---

## Authentication & Authorization

All endpoints (except `/api/Auth/*`) require a signed JSON Web Token (JWT) in the `Authorization` header:
`Authorization: Bearer <JWT_ACCESS_TOKEN>`

### Supported Roles:
- **Supervisor**: Full administrative access to files, courses, user accounts, and system logs.
- **IT Manager**: Read/write access to IT department files and IT courses. Read-only access to repository. No access to user accounts or audit logs.
- **EL Manager**: Read/write access to EL department files and EL courses. Read-only access to repository. No access to user accounts or audit logs.
- **Mechanical Manager**: Read/write access to ME department files and ME courses. Read-only access to repository. No access to user accounts or audit logs.
- **Public User**: Read-only access to public files and course outlines. Cannot perform write operations.

---

## 1. Authentication Endpoints (`/api/Auth`)

### POST /api/Auth/login
Logs in a user and returns their JWT access token.
* **HTTP Method**: `POST`
* **Purpose**: User Authentication.
* **Authentication**: None.
* **User Roles**: Anyone.
* **Request Body**:
  * `username` (string, required): Username or email.
  * `password` (string, required): Minimum 6 characters.
* **Expected Response**:
  * Status: `200 OK`
  * Body:
    ```json
    {
      "token": "header.payload.signature",
      "refreshToken": "ref_token_uuid",
      "role": "Supervisor"
    }
    ```
* **Error Responses**:
  * Status `400 Bad Request` if validations fail.
  * Status `401 Unauthorized` for invalid credentials.

### POST /api/Auth/forgot-password
Initiates password recovery by sending a 6-digit OTP verification code to the email.
* **HTTP Method**: `POST`
* **Purpose**: Request OTP recovery.
* **Authentication**: None.
* **Request Body**:
  * `email` (string, required): Standard email format.
* **Expected Response**:
  * Status: `200 OK`
  * Body:
    ```json
    {
      "message": "OTP verification code sent to your registered email address."
    }
    ```
* **Error Responses**:
  * Status `404 Not Found` if email is not registered.

### POST /api/Auth/verify-otp
Verifies the 6-digit code sent to the email.
* **HTTP Method**: `POST`
* **Purpose**: Verify OTP.
* **Authentication**: None.
* **Request Body**:
  * `email` (string, required)
  * `code` (string, required): 6-digit code.
* **Expected Response**:
  * Status: `200 OK`
  * Body:
    ```json
    {
      "verified": true,
      "tempResetToken": "temp_token_uuid"
    }
    ```
* **Error Responses**:
  * Status `400 Bad Request` if OTP is invalid or expired.

### POST /api/Auth/reset-password
Resets the password to a new value using verification metadata.
* **HTTP Method**: `POST`
* **Purpose**: Reset password.
* **Authentication**: None.
* **Request Body**:
  * `email` (string, required)
  * `code` (string, required)
  * `newPassword` (string, required): Strong password (8+ chars, upper, lower, number, special).
* **Expected Response**:
  * Status: `200 OK`
  * Body:
    ```json
    {
      "success": true
    }
    ```
* **Error Responses**:
  * Status `400 Bad Request` if password constraints are violated.

### POST /api/Auth/change-password
Updates password for an active session.
* **HTTP Method**: `POST`
* **Purpose**: Change password from profile.
* **Authentication**: JWT Token.
* **User Roles**: Supervisor, IT Manager, EL Manager, Mechanical Manager.
* **Request Body**:
  * `oldPassword` (string, required)
  * `newPassword` (string, required): Strong password rules.
* **Expected Response**:
  * Status: `200 OK`
  * Body:
    ```json
    {
      "success": true
    }
    ```

---

## 2. File Repository Endpoints (`/api/Files`)

### GET /api/Files
Lists all institutional files stored in the repository.
* **HTTP Method**: `GET`
* **Purpose**: Explore repository files.
* **Authentication**: JWT Token.
* **User Roles**: All roles (Public User can view, Managers see filtered default department view, Supervisor sees all).
* **Expected Response**:
  * Status: `200 OK`
  * Body:
    ```json
    [
      {
        "id": 1,
        "name": "IT_Syllabus_2024.pdf",
        "type": "PDF",
        "version": "v1.2",
        "size": "2.4 MB",
        "dept": "IT DEPT",
        "downloads": 142,
        "uploadDate": "2026-06-20",
        "uploadedBy": "j.carter"
      }
    ]
    ```

### POST /api/Files
Uploads a file to the central repository.
* **HTTP Method**: `POST`
* **Purpose**: File upload.
* **Authentication**: JWT Token.
* **User Roles**: Supervisor, IT Manager, EL Manager, Mechanical Manager.
* **Request Body**: Form Data (multipart/form-data) containing the file file, department category, and estimates size.
* **Expected Response**:
  * Status: `201 Created`
  * Body:
    ```json
    {
      "id": 5,
      "name": "Project_Blueprint.pdf",
      "type": "PDF",
      "version": "v1.0",
      "size": "3.5 MB",
      "dept": "IT DEPT",
      "downloads": 0,
      "uploadDate": "2026-06-28",
      "uploadedBy": "admin"
    }
    ```

### DELETE /api/Files/{id}
Deletes a file by its integer ID.
* **HTTP Method**: `DELETE`
* **Purpose**: Remove files.
* **Authentication**: JWT Token.
* **User Roles**: Supervisor, IT Manager, EL Manager, Mechanical Manager.
* **Path Parameters**:
  * `id` (integer, required): File ID.
* **Expected Response**:
  * Status: `200 OK`
  * Body:
    ```json
    {
      "success": true
    }
    ```

---

## 3. Course Management Endpoints (`/api/Courses`)

### GET /api/Courses
Retrieves the list of university courses catalogs.
* **HTTP Method**: `GET`
* **Purpose**: Get course outline categories.
* **Authentication**: None (accessible to Public User too).
* **Expected Response**:
  * Status: `200 OK`
  * Body:
    ```json
    [
      {
        "id": 1,
        "title": "Advanced Software Architecture & Design Patterns",
        "dept": "IT",
        "img": "https://images.unsplash.com/photo-1555066931-4365d14bab8c",
        "lessons": 5,
        "size": "1.2 GB"
      }
    ]
    ```

### GET /api/Courses/{id}
Gets curriculum details and video links by course ID.
* **HTTP Method**: `GET`
* **Purpose**: Dynamic course module outlines playlist player.
* **Authentication**: None.
* **Path Parameters**:
  * `id` (integer, required)
* **Expected Response**:
  * Status: `200 OK`
  * Body:
    ```json
    {
      "id": 1,
      "title": "Advanced Software Architecture & Design Patterns",
      "dept": "IT",
      "img": "https://images.unsplash.com/photo-1555066931-4365d14bab8c",
      "modules": [
        {
          "name": "Module 1: Creational Patterns",
          "lessons": [
            { "id": "l1", "title": "1. Intro to Styles", "file": "https://w3schools.com/movie.mp4", "type": "video" }
          ]
        }
      ]
    }
    ```

### POST /api/Courses
Creates a new course module curriculum structure.
* **HTTP Method**: `POST`
* **Purpose**: Publish new courses.
* **Authentication**: JWT Token.
* **User Roles**: Supervisor, IT Manager, EL Manager, Mechanical Manager.
* **Request Body**:
  * `title` (string, required)
  * `dept` (string, required)
  * `description` (string)
  * `img` (string, DataURL/URL thumbnail)
  * `modules` (array of objects containing module name and lessons array)
* **Expected Response**:
  * Status: `201 Created`
  * Body:
    ```json
    {
      "id": 4,
      "title": "Robotics Systems",
      "success": true
    }
    ```

---

## 4. User Access Endpoints (`/api/Admin`)

### GET /api/Admin/all
Retrieves all registered university user accounts.
* **HTTP Method**: `GET`
* **Purpose**: Access Control user list.
* **Authentication**: JWT Token.
* **User Roles**: Supervisor.
* **Expected Response**:
  * Status: `200 OK`
  * Body:
    ```json
    [
      {
        "id": 2,
        "username": "j.carter",
        "email": "j.carter@university.edu",
        "phone": "+1 555-0288",
        "role": "IT Manager",
        "joined": "2025-03-22",
        "isProtected": false
      }
    ]
    ```

### POST /api/Admin/create
Registers a new administrator account in AITU.
* **HTTP Method**: `POST`
* **Purpose**: Create Admin Account.
* **Authentication**: JWT Token.
* **User Roles**: Supervisor.
* **Request Body**:
  * `username` (string, required)
  * `email` (string, required)
  * `phone` (string)
  * `role` (string, required): Supervisor, IT Manager, EL Manager, Mechanical Manager.
* **Expected Response**:
  * Status: `201 Created`
  * Body:
    ```json
    {
      "id": 6,
      "username": "k.adams",
      "role": "IT Manager",
      "joined": "2026-06-28"
    }
    ```

### DELETE /api/Admin/{id}
Deletes an administrator account.
* **HTTP Method**: `DELETE`
* **Purpose**: Revoke User access.
* **Authentication**: JWT Token.
* **User Roles**: Supervisor.
* **Path Parameters**:
  * `id` (integer)
* **Expected Response**:
  * Status: `200 OK`
  * Body:
    ```json
    {
      "success": true
    }
    ```

### GET /api/Admin/logs
Retrieves system audit logs.
* **HTTP Method**: `GET`
* **Purpose**: Audit trails inspection.
* **Authentication**: JWT Token.
* **User Roles**: Supervisor.
* **Expected Response**:
  * Status: `200 OK`
  * Body:
    ```json
    [
      {
        "id": 1,
        "admin": "admin",
        "role": "Supervisor",
        "action": "Login",
        "target": "System",
        "datetime": "2026-06-28 08:14:32"
      }
    ]
    ```

### PUT /api/Admin/profile
Updates email and phone for the active profile user.
* **HTTP Method**: `PUT`
* **Purpose**: Profile settings update.
* **Authentication**: JWT Token.
* **User Roles**: Supervisor, IT Manager, EL Manager, Mechanical Manager.
* **Request Body**:
  * `email` (string, required)
  * `mobile` (string, required)
* **Expected Response**:
  * Status: `200 OK`
  * Body:
    ```json
    {
      "success": true
    }
    ```

---

## 5. Dashboard Metrics Endpoints (`/api/Dashboard`)

### GET /api/Dashboard/metrics
Retrieves campus analytics statistics metrics.
* **HTTP Method**: `GET`
* **Purpose**: Fetch metrics widgets & charts.
* **Authentication**: JWT Token.
* **User Roles**: Supervisor, IT Manager, EL Manager, Mechanical Manager.
* **Expected Response**:
  * Status: `200 OK`
  * Body:
    ```json
    {
      "totalFiles": 14208,
      "storageCapacityUsed": 84,
      "storageCapacityValue": "8.4 TB",
      "pendingTasks": 42,
      "netActivity": "128.5k",
      "trends": {
        "totalFiles": "+ 12% vs last month",
        "storageCapacity": "84% capacity reached",
        "pendingTasks": "Requires admin review",
        "netActivity": "+ 5.2% growth"
      },
      "downloadVelocity": [
        { "month": "Jan", "count": 160 }
      ],
      "resourceMix": {
        "documents": 60,
        "media": 25,
        "logs": 15
      },
      "highImpactDocuments": [
        { "name": "Academic_Charter.pdf", "source": "Council", "downloads": 1245, "weight": "2.4 MB", "type": "PDF" }
      ],
      "recentEvents": [
        { "user": "Prof. Kamal", "action": "uploaded", "target": "Course_Intro.pdf", "time": "10m ago", "type": "info" }
      ]
    }
    ```

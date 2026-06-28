# API Integration Contract Specifications - AITU Frontend

This document establishes the binding integration contract between the frontend pages and the backend services.

---

## 1. Landing Page (`index.html`)

* **Page Description**: Academic infrastructure home window.
* **Authentication**: None.
* **Role Permissions**: Public guest and authenticated users.
* **Required APIs**: None.
* **Behavior**:
  * Checks if `aitu_token` exists. If yes, updates the login button UI text to "Go to Portal" and updates click action to route to `repository.html` (for Public Users) or `dashboard.html` (for administrative Managers).

---

## 2. Authentication Pages (`login.html`, `forgot-password.html`, `otp.html`, `reset-password.html`)

### Login Panel
* **Required APIs**: `POST /api/Auth/login`
* **Request Fields**:
  * `username` (string, required): Minimum length 3. Validated as email if it contains `@`.
  * `password` (string, required): Minimum length 6.
* **Response Model**:
  ```typescript
  interface LoginResponse {
    token: string;          // Bearer JWT Token
    refreshToken: string;   // Token to renew session
    role: string;           // Supervisor | IT Manager | EL Manager | Mechanical Manager | Public User
  }
  ```
* **Authentication**: None.
* **Frontend Validations**:
  * Username must not be empty.
  * Password must be >= 6 characters.
  * Buttons disabled while sending. Show error cards on incorrect credentials.

### Recovery Trigger
* **Required APIs**: `POST /api/Auth/forgot-password`
* **Request Fields**:
  * `email` (string, required): Must match email regular expression format.
* **Response Model**: `{ message: string }`
* **Frontend Validations**:
  * Must be a valid format email address.

### OTP Verification
* **Required APIs**: `POST /api/Auth/verify-otp`
* **Request Fields**:
  * `email` (string, required)
  * `code` (string, required): 6-digit numeric string.
* **Response Model**: `{ verified: boolean, tempResetToken?: string }`
* **Frontend Validations**:
  * Automatic field advancement. Only numerical input characters allowed. Full 6 digits must be populated to trigger submit.

### Password Reset
* **Required APIs**: `POST /api/Auth/reset-password`
* **Request Fields**:
  * `email` (string, required)
  * `code` (string, required)
  * `newPassword` (string, required)
* **Response Model**: `{ success: boolean }`
* **Frontend Validations**:
  * Real-time password requirement checklist validation:
    * 8+ characters.
    * 1+ uppercase letter & 1+ lowercase letter.
    * 1+ number.
    * 1+ special symbol check.
  * Password match confirmation validation.

---

## 3. Analytics Dashboard (`dashboard.html`)

* **Page Description**: Administrative system metrics panel.
* **Authentication**: JWT Token required.
* **Role Permissions**: `Supervisor`, `IT Manager`, `EL Manager`, `Mechanical Manager`.
* **Required APIs**: `GET /api/Dashboard/metrics`
* **Response Model**:
  ```typescript
  interface DashboardMetricsResponse {
    totalFiles: number;
    storageCapacityUsed: number;   // percentage integer (e.g. 84)
    storageCapacityValue: string;  // display capacity (e.g. "8.4 TB")
    pendingTasks: number;
    netActivity: string;           // e.g. "128.5k"
    trends: {
      totalFiles: string;
      storageCapacity: string;
      pendingTasks: string;
      netActivity: string;
    };
    downloadVelocity: Array<{
      month: string;
      count: number;
    }>;
    resourceMix: {
      documents: number;  // percentages
      media: number;
      logs: number;
    };
    highImpactDocuments: Array<{
      name: string;
      source: string;
      downloads: number;
      weight: string;
      type: string;       // PDF | XLSX | DOCX | DWG
    }>;
    recentEvents: Array<{
      user: string;
      action: string;     // uploaded | isolated | finalized
      target: string;
      time: string;       // e.g. "10 minutes ago"
      type: string;       // info | critical | neutral
    }>;
  }
  ```
* **Frontend View Actions**:
  * Render SVG line graph dynamically using `downloadVelocity` array coordinates.
  * Render donut resource split chart conic-gradient CSS properties using `resourceMix`.
  * Loading state displays metric skeletons.

---

## 4. Central File Repository (`repository.html`)

* **Page Description**: Explores AITU documents directories.
* **Authentication**: JWT Token (optional, supports Public User guest browsing).
* **Role Permissions**:
  * All roles can browse.
  * Only `Supervisor`, `IT Manager`, `EL Manager`, `Mechanical Manager` can upload or delete.
* **Required APIs**:
  * `GET /api/Files` (List files)
  * `POST /api/Files` (Upload file)
  * `DELETE /api/Files/{id}` (Delete file)
* **Response Models**:
  * **GET files**:
    ```typescript
    interface FileItem {
      id: number;
      name: string;
      type: string;       // PDF | XLSX | DWG | MP4 | DOCX
      version: string;    // e.g. "v1.2"
      size: string;       // e.g. "2.4 MB"
      dept: string;       // e.g. "IT DEPT"
      downloads: number;
      uploadDate: string; // YYYY-MM-DD
      uploadedBy: string;
    }
    ```
  * **POST Upload File**:
    * Request payload: `multipart/form-data` containing properties: file, department, file type, estimated size.
    * Response: `FileItem`.
  * **DELETE File**:
    * Path parameter: `id` (integer).
    * Response: `{ success: boolean }`.
* **Frontend View Actions**:
  * Selection action bar appears upon checking files.
  * IT, EL, ME department filters defaults automatically matching active manager role.
  * Deletion restricted to active administrator roles.

---

## 5. Course Repository Catalogue (`courses.html`)

* **Page Description**: Lists course curriculum modules. Dual-mode: public view (navbar + sidebar + cards with badges + pagination + CTA) and admin view (admin sidebar + dept tabs + upload card).
* **Authentication**: None for public view. JWT Token for admin view.
* **Required APIs**: `GET /api/Courses`
* **Response Model**:
  ```typescript
  interface CourseListItem {
    id: number;
    title: string;
    dept: string;         // IT | ME | EL
    category: string;     // UNDERGRAD | PROFESSIONAL | RESEARCH
    img: string;          // Thumbnail url
    lessons: number;
    size: string;         // e.g. "1.2 GB"
    description: string;  // Brief course description
    lastUpdated: string;  // e.g. "Oct 2023"
    author: {
      name: string;
      title: string;
    };
  }
  ```
* **Frontend View Actions**:
  * Public users see cards with department + category badges, pagination, and CTA banner.
  * Supervisors and managers see admin layout with dept tabs and "+ Upload New Course" dashed card.

---

## 6. Course Curriculum Builder (`create-course.html`)

* **Page Description**: Creates curriculum modules with content table, publishing options, and admin guidelines.
* **Authentication**: JWT Token required.
* **Role Permissions**: `Supervisor`, `IT Manager`, `EL Manager`, `Mechanical Manager`.
* **Required APIs**: `POST /api/Courses`
* **Request Payload**:
  ```typescript
  interface CreateCourseRequest {
    title: string;
    dept: string;              // IT | ME | EL
    category: string;          // UNDERGRAD | PROFESSIONAL | RESEARCH
    description?: string;
    img?: string;              // Base64 DataURL or Image link
    visibility: string;        // public | students | admin
    guestDownloads: boolean;   // Allow non-registered users to download
    modules: Array<{
      name: string;            // e.g. "Module 1: Basic Principles"
      lessons: Array<{
        id: string;
        title: string;
        file: string;          // Video/document URL
        type: string;          // video | document
        size?: string;         // e.g. "450 MB"
      }>;
    }>;
    size?: string;             // e.g. "1.2 GB"
  }
  ```
* **Response Model**: `{ id: number, success: boolean }`
* **Frontend Validations**:
  * Title is required. Department is required.
  * Content table shows lessons with file type icons, sizes, and edit/delete actions.
  * Package status bar shows dynamically calculated total size.
  * Publishing options: visibility radios (Public Guest, Registered Students, Admin Only) + guest download toggle.
  * Admin Guidelines sidebar displays file naming, bandwidth, and thumbnail spec recommendations.
  * Preview card shows live course title and thumbnail preview.

---

## 7. Course Details Resource Viewer (`course-details.html`)

* **Page Description**: View course resource bundle details with expandable modules, download bundle sidebar, author info, and related bundles.
* **Authentication**: None (Public access).
* **Required APIs**: `GET /api/Courses/{id}`
* **Path Parameters**: `id` (integer)
* **Response Model**:
  ```typescript
  interface CourseDetails {
    id: number;
    title: string;
    dept: string;
    category: string;
    img: string;
    lastUpdated: string;
    description: string;
    size: string;
    author: {
      name: string;
      title: string;
      bio: string;
    };
    resources: Array<{       // Download bundle content types
      name: string;          // e.g. "Course Syllabus"
      type: string;          // PDF | PPTX | ZIP | MULTI | XLSX
      size: string;          // e.g. "4.2 MB"
    }>;
    modules: Array<{
      name: string;
      lessons: Array<{
        id: string;
        title: string;
        file: string;        // URL to resource file
        type: string;        // video | document
        size?: string;       // e.g. "4.2 MB"
      }>;
    }>;
    relatedCourses?: number[];  // IDs of related courses
  }
  ```
* **Frontend View Actions**:
  * Breadcrumb navigation: Home > Courses > Course Title.
  * Hero banner with course image overlay and total size badge.
  * Package Overview section with description and content stats.
  * Resource List with expandable accordion modules — each file has download icon.
  * Download Bundle sidebar card with "Download All Resources" button → triggers confirmation modal.
  * Download confirmation modal shows content type cards in 2×2 grid, total size, and Usage Restriction Policy warning.
  * Curriculum Author card with avatar, name, title, bio, and faculty profile link.
  * Related Resource Bundles card with clickable related course items.

---

## 8. User Management Portal (`users.html`)

* **Page Description**: System accounts access control.
* **Authentication**: JWT Token required.
* **Role Permissions**: `Supervisor` only.
* **Required APIs**:
  * `GET /api/Admin/all` (List admins)
  * `POST /api/Admin/create` (Add admin user)
  * `DELETE /api/Admin/{id}` (Delete admin user)
* **Response Models**:
  * **GET All Users**:
    ```typescript
    interface AdminUser {
      id: number;
      username: string;
      email: string;
      phone: string;
      role: string;    // Supervisor | IT Manager | EL Manager | Mechanical Manager
      joined: string;  // YYYY-MM-DD
      isProtected: boolean;
    }
    ```
  * **POST Create User**:
    * Request payload: `{ username: string, email: string, phone: string, role: string }`
    * Response: `AdminUser`.
  * **DELETE User**:
    * Path parameter: `id` (integer).
    * Response: `{ success: boolean }`.
* **Frontend Validations**:
  * Email must match regular email pattern.
  * Protected accounts cannot click delete trigger.

---

## 9. System Audit Logs (`logs.html`)

* **Page Description**: Inspect administrator operations history logs.
* **Authentication**: JWT Token required.
* **Role Permissions**: `Supervisor` only.
* **Required APIs**: `GET /api/Admin/logs`
* **Response Model**:
  ```typescript
  interface AuditLogItem {
    id: number;
    admin: string;
    role: string;
    action: string;    // Login | Add File | Delete File | Create Folder | Upload Video | Add User | Delete User | Change Password | Update Profile
    target: string;
    datetime: string;  // YYYY-MM-DD HH:MM:SS
  }
  ```

---

## 10. Profile Settings (`profile.html`)

* **Page Description**: Personal profile detail settings.
* **Authentication**: JWT Token required.
* **Role Permissions**: `Supervisor`, `IT Manager`, `EL Manager`, `Mechanical Manager`.
* **Required APIs**:
  * `PUT /api/Admin/profile` (Update info)
  * `POST /api/Auth/change-password` (Update credentials)
* **Request Payloads**:
  * **PUT profile**: `{ email: string, mobile: string }`
  * **POST change password**: `{ oldPassword: string, newPassword: string }`
* **Response Models**:
  * Response is standard validation payload `{ success: boolean }`.
* **Frontend Validations**:
  * Validates password strength checklist before update request trigger.

# Backend Dashboard API Requirements

This document specifies every API endpoint required by the AITU Admin Dashboard frontend. The frontend team has built the integration layer and is currently using mock data. Replace `USE_MOCK = true` with `false` in `js/shared/services.js` once these endpoints are live.

**Base URL**: Configured in `js/shared/api.js` → `BASE_URL`  
**Authentication**: All endpoints require `Authorization: Bearer <token>` header unless stated otherwise.

---

## 1. Dashboard Statistics

**Method**: `GET`  
**URL**: `/api/Dashboard/stats`  
**Authentication**: Required  
**Required Role**: Supervisor, IT Manager, EL Manager, Mechanical Manager

### Query Parameters

| Param | Type   | Required | Description                          |
|-------|--------|----------|--------------------------------------|
| days  | number | No       | Time range filter (7, 30, 90, 365). Default: 30 |

### Response Schema

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
    }
}
```

### Field Details

| Field                  | Type   | Description                                          |
|------------------------|--------|------------------------------------------------------|
| totalFiles             | number | Total file count across all departments              |
| storageCapacityUsed    | number | Storage usage percentage (0-100)                     |
| storageCapacityValue   | string | Human-readable storage usage (e.g. "8.4 TB")        |
| pendingTasks           | number | Number of tasks awaiting admin action                |
| netActivity            | string | Network activity metric (e.g. "128.5k")             |
| trends.totalFiles      | string | Change indicator text for total files                |
| trends.storageCapacity | string | Change indicator text for storage                    |
| trends.pendingTasks    | string | Change indicator text for pending tasks              |
| trends.netActivity     | string | Change indicator text for network activity           |

---

## 2. Download Velocity (Monthly Downloads Chart)

**Method**: `GET`  
**URL**: `/api/Dashboard/downloads`  
**Authentication**: Required  
**Required Role**: Supervisor, IT Manager, EL Manager, Mechanical Manager

### Query Parameters

| Param | Type   | Required | Description                     |
|-------|--------|----------|---------------------------------|
| year  | number | No       | Year to fetch data for. Default: current year |

### Response Schema

```json
[
    { "month": "Jan", "count": 6500 },
    { "month": "Feb", "count": 8200 },
    { "month": "Mar", "count": 7800 },
    { "month": "Apr", "count": 12500 },
    { "month": "May", "count": 10500 },
    { "month": "Jun", "count": 14000 },
    { "month": "Jul", "count": 13200 },
    { "month": "Aug", "count": 9000 },
    { "month": "Sep", "count": 11000 },
    { "month": "Oct", "count": 14500 },
    { "month": "Nov", "count": 15200 },
    { "month": "Dec", "count": 13800 }
]
```

### Field Details

| Field | Type   | Description                                |
|-------|--------|--------------------------------------------|
| month | string | Three-letter month abbreviation (Jan-Dec)  |
| count | number | Total download count for that month        |

---

## 3. Resource Mix (Downloads by Department)

**Method**: `GET`  
**URL**: `/api/Dashboard/resource-mix`  
**Authentication**: Required  
**Required Role**: Supervisor, IT Manager, EL Manager, Mechanical Manager

### Response Schema

```json
{
    "it": 4520,
    "el": 2180,
    "me": 1890
}
```

### Field Details

| Field | Type   | Description                              |
|-------|--------|------------------------------------------|
| it    | number | Total downloads from IT department       |
| el    | number | Total downloads from EL department       |
| me    | number | Total downloads from ME department       |

> Note: Values represent download counts. The frontend calculates percentages client-side.

---

## 4. High-Impact Documents

**Method**: `GET`  
**URL**: `/api/Dashboard/documents`  
**Authentication**: Required  
**Required Role**: Supervisor, IT Manager, EL Manager, Mechanical Manager

### Query Parameters

| Param | Type   | Required | Description                        |
|-------|--------|----------|------------------------------------|
| limit | number | No       | Max number of results. Default: 5  |

### Response Schema

```json
[
    {
        "name": "2024_Academic_Charter.pdf",
        "source": "Council Office",
        "downloads": 1245,
        "weight": "2.4 MB",
        "type": "PDF"
    },
    {
        "name": "Q1_Enrollment_Stats.xlsx",
        "source": "Registrar",
        "downloads": 892,
        "weight": "4.1 MB",
        "type": "XLSX"
    },
    {
        "name": "Faculty_Handbook_V2.docx",
        "source": "HR Academic",
        "downloads": 756,
        "weight": "1.2 MB",
        "type": "DOCX"
    },
    {
        "name": "Campus_Rebranding_Assets.zip",
        "source": "Communications",
        "downloads": 412,
        "weight": "156 MB",
        "type": "ZIP"
    }
]
```

### Field Details

| Field     | Type   | Description                                         |
|-----------|--------|-----------------------------------------------------|
| name      | string | File name with extension                            |
| source    | string | Originating office/department                       |
| downloads | number | Total access/download count                         |
| weight    | string | Human-readable file size                            |
| type      | string | File type: "PDF", "XLSX", "DOCX", "ZIP", etc.      |

> Documents should be sorted by `downloads` descending by the backend.

---

## 5. System Events (Recent Activity)

**Method**: `GET`  
**URL**: `/api/Dashboard/events`  
**Authentication**: Required  
**Required Role**: Supervisor, IT Manager, EL Manager, Mechanical Manager

### Query Parameters

| Param | Type   | Required | Description                         |
|-------|--------|----------|-------------------------------------|
| limit | number | No       | Max number of results. Default: 10  |

### Response Schema

```json
[
    {
        "user": "Prof. Kamal",
        "action": "uploaded",
        "target": "Course_Intro.pdf",
        "time": "10 minutes ago",
        "type": "info"
    },
    {
        "user": "Security Bot",
        "action": "isolated",
        "target": "suspicious_login.log",
        "time": "1 hour ago",
        "type": "critical"
    },
    {
        "user": "System",
        "action": "finalized",
        "target": "weekly backup",
        "time": "3 hours ago",
        "type": "neutral"
    },
    {
        "user": "Maintenance window",
        "action": "scheduled for Saturday.",
        "target": "",
        "time": "Yesterday, 11:00 PM",
        "type": "neutral"
    }
]
```

### Field Details

| Field  | Type   | Description                                                  |
|--------|--------|--------------------------------------------------------------|
| user   | string | Actor name (user, bot, or system process)                    |
| action | string | Verb describing the action                                   |
| target | string | Object of the action (file name, empty string if none)       |
| time   | string | Human-readable relative timestamp                            |
| type   | string | Event severity: "info", "critical", or "neutral"             |

> The frontend polls this endpoint every 30 seconds for real-time updates.

---

## 6. Notifications Count

**Method**: `GET`  
**URL**: `/api/Notifications/count`  
**Authentication**: Required  
**Required Role**: Any authenticated user

### Response Schema

```json
{
    "count": 3
}
```

### Field Details

| Field | Type   | Description                       |
|-------|--------|-----------------------------------|
| count | number | Unread notification count         |

---

## 7. Export Dashboard Report

**Method**: `GET`  
**URL**: `/api/Dashboard/export`  
**Authentication**: Required  
**Required Role**: Supervisor, IT Manager, EL Manager, Mechanical Manager

### Query Parameters

| Param  | Type   | Required | Description           |
|--------|--------|----------|-----------------------|
| format | string | No       | Export format: "pdf" (default) or "xlsx" |

### Response

Binary file stream with appropriate `Content-Type` and `Content-Disposition` headers:

```
Content-Type: application/pdf
Content-Disposition: attachment; filename="dashboard_report.pdf"
```

---

## Implementation Notes

1. **Authentication**: All endpoints validate the JWT token from `Authorization: Bearer <token>` header. Return `401 Unauthorized` if token is invalid/expired.

2. **Role Authorization**: Dashboard endpoints should only be accessible to Supervisors and Managers. Return `403 Forbidden` for unauthorized roles.

3. **Error Response Format**: Use a consistent error response:
   ```json
   {
       "message": "Error description here",
       "code": "ERROR_CODE"
   }
   ```

4. **Date Filtering**: The `days` parameter on `/api/Dashboard/stats` filters all metrics to the specified time window. E.g., `days=7` returns stats for the last 7 days only.

5. **Year Filtering**: The `year` parameter on `/api/Dashboard/downloads` returns monthly download counts for the specified calendar year.

6. **Sorting**: `/api/Dashboard/documents` should return documents sorted by `downloads` in descending order.

7. **Polling**: The frontend polls `/api/Dashboard/events` every 30 seconds. Keep this endpoint lightweight and fast.

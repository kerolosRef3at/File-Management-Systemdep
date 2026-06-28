# Dashboard API Requirements

This document details the specific API contracts needed to drive the newly updated Analytics Dashboard page.

## Endpoint: `GET /api/Dashboard/metrics`

This endpoint provides all necessary data to populate the four top metrics, the Download Velocity chart, the Resource Mix doughnut chart, High-Impact Documents, and Recent System Events.

### 1. Request Parameters
- **`timeframe`**: (string, optional) Defaults to "last_30_days". Possible values could be "last_30_days", "year_to_date", "all_time", etc. This controls the high-level aggregate numbers.
- **`chartYear`**: (integer, optional) Defaults to the current year (e.g., 2026). Determines which year's month-by-month data is returned in `downloadVelocity`.

### 2. JSON Response Schema

```json
{
  "totalFiles": 14208,
  "storageCapacityUsed": 84, // integer representing percentage
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
  ],
  "resourceMix": {
    "it": 45, // percentage of downloads from IT Department
    "me": 30, // percentage of downloads from ME Department
    "el": 25  // percentage of downloads from EL Department
  },
  "highImpactDocuments": [
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
    }
  ],
  "recentEvents": [
    {
      "user": "Prof. Kamal",
      "action": "uploaded",
      "target": "Course_Intro.pdf",
      "time": "10 minutes ago",
      "type": "info" // can be 'info', 'critical', or 'neutral'
    },
    {
      "user": "Security Bot",
      "action": "isolated",
      "target": "suspicious_login.log",
      "time": "1 hour ago",
      "type": "critical"
    }
  ]
}
```

### 3. Key Notes for Backend Implementation
* **`downloadVelocity`**: Must return an array of exactly 12 items representing the chronological months of the requested `chartYear`. If no data exists for a future month, `count` should be `0`.
* **`resourceMix`**: The values for `it`, `me`, and `el` must sum up to exactly `100` (or close to it, e.g., `99.9` due to rounding) as they are used to paint a 3-part conic gradient doughnut chart.
* **`highImpactDocuments[].type`**: The file extension or general type (e.g., `PDF`, `XLSX`, `ZIP`, `DOCX`). The frontend uses this to pick the correct SVG icon and color.
* **`recentEvents[].type`**: Controls the dot color and text accent color. 
  - `critical` = Red
  - `info` = Dark Blue (primary)
  - `neutral` = Gray

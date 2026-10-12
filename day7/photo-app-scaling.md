# SnapShare Scaling Plan

## 1. Assumptions

SnapShare has 10 million registered users.

Assumptions:
- 10% of registered users are active each day.
- Each active user uploads 1 photo per day.
- Each active user views 50 feed pages per day.
- Each original photo is 2 MB.
- Each photo also gets a 50 KB thumbnail.
- Traffic is spread across 24 hours for average-rate calculations.
- Peak traffic is estimated at 5 times the average rate.

Daily active users:

10,000,000 × 10% = 1,000,000 daily active users.

## 2. Capacity Estimates

### Uploads per second

1,000,000 uploads per day ÷ 86,400 seconds per day

= 11.57 uploads per second

Approximately **12 uploads per second** on average.

Peak upload rate at 5× average:

11.57 × 5 = approximately **58 uploads per second**.

### Feed views per second

1,000,000 active users × 50 feed pages per day

= 50,000,000 feed views per day.

Average feed views per second:

50,000,000 ÷ 86,400 = approximately **579 feed views per second**.

Peak feed views at 5× average:

579 × 5 = approximately **2,895 feed views per second**.

### Photo storage per year

Original photos:

1,000,000 photos/day × 2 MB × 365 days

= **730,000,000 MB**

= approximately **730 TB per year**.

Thumbnails:

1,000,000 photos/day × 50 KB × 365 days

= **18.25 TB per year**.

Total photo storage:

730 TB + 18.25 TB = approximately **748.25 TB per year**.

## 3. Read-Heavy or Write-Heavy?

SnapShare is strongly **read-heavy**.

The system handles approximately 12 uploads per second on average but approximately 579 feed views per second, rising to around 2,895 feed views per second at peak.

This means the architecture should prioritize fast reads by using a CDN, caching frequently requested data, multiple app servers, and a database read replica to reduce pressure on the primary database.

## 4. Photo Storage

Photos should not be stored directly inside the relational database because large binary files would make database storage, indexes, backups, replication, and queries more expensive and difficult to manage.

Instead, original photos and thumbnails should be stored in **object storage**.

The database should store metadata such as the photo ID, user ID, caption, timestamps, and the object-storage locations of the original photo and thumbnail.

Object storage is designed to handle large amounts of files independently from the application database.

## 5. Architecture Diagram

```text
                         ┌───────────────┐
                         │     Users     │
                         └───────┬───────┘
                                 │
                                 ▼
                         ┌───────────────┐
                         │      CDN      │
                         └───────┬───────┘
                                 │
                                 ▼
                         ┌───────────────┐
                         │ Load Balancer │
                         └───────┬───────┘
                                 │
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
              ┌──────────┐ ┌──────────┐ ┌──────────┐
              │ App      │ │ App      │ │ App      │
              │ Server 1 │ │ Server 2 │ │ Server N │
              └────┬─────┘ └────┬─────┘ └────┬─────┘
                   │             │             │
                   └─────────────┼─────────────┘
                                 │
                ┌────────────────┼────────────────┐
                ▼                ▼                ▼
          ┌───────────┐   ┌──────────────┐   ┌─────────────┐
          │   Cache   │   │ DB Primary   │──▶│ Read Replica│
          └───────────┘   └──────┬───────┘   └─────────────┘
                                 │
                                 │ metadata
                                 ▼
                         ┌───────────────┐
                         │ Object Storage│
                         │ photos/files  │
                         └───────────────┘
                                 ▲
                                 │ thumbnails
                                 │
                         ┌───────────────┐
                         │     Queue     │
                         └───────┬───────┘
                                 │
                                 ▼
                         ┌───────────────┐
                         │ Thumbnail     │
                         │ Worker        │
                         └───────────────┘
```

## 6. What Each Component Solves

- CDN: Delivers frequently requested photos and thumbnails from locations close to users, reducing latency and application-server load.
- Load balancer: Distributes incoming requests across multiple app servers so one server does not become a bottleneck.
- App servers: Handle authentication, validation, feed requests, metadata operations, and upload coordination.
- Cache: Stores frequently requested feed data or metadata so repeated reads do not always reach the database.
- Primary database: Stores reliable application metadata such as users, photo records, captions, relationships, and object-storage locations.
- Read replica: Handles read queries separately from the primary database to increase read capacity.
- Object storage: Stores the large original photos and thumbnails without putting large binary files inside the relational database.
- Queue: Holds thumbnail-generation jobs so image processing can happen asynchronously instead of making the upload request wait.
- Thumbnail worker: Takes jobs from the queue, creates smaller thumbnails, and stores them back in object storage.

## 7. Photo Upload Flow

1. The user selects a photo and starts an upload.
2. The upload request reaches the load balancer, which forwards it to an available app server.
3. The app server authenticates the user and validates the uploaded file.
4. The original photo is uploaded to object storage.
5. The app server creates a photo record in the primary database containing the user ID, photo ID, metadata, and object-storage location.
6. The app server places a thumbnail-generation job containing the photo information onto the queue.
7. The app server responds to the user without waiting for thumbnail generation to finish.
8. A thumbnail worker takes the job from the queue and creates the 50 KB thumbnail.
9. The worker stores the thumbnail in object storage and updates the photo record if necessary.
10. The CDN can then deliver the thumbnail efficiently when the user's feed requests it.

Because thumbnail generation is asynchronous, the user does not have to wait for image processing before the upload request completes. The original photo can be recorded first, while the thumbnail becomes available shortly afterward.

## 8. Architectural Trade-Offs

### Read Replica vs Immediate Consistency

Using a read replica increases read capacity and protects the primary database from heavy feed traffic, but replication can introduce a small delay. A user may briefly see slightly older data after an update because the replica may not have received the latest change yet.

### Asynchronous Thumbnails vs Immediate Availability

Generating thumbnails through a queue and worker keeps uploads fast and prevents image processing from blocking the app server. The trade-off is that the thumbnail may not appear immediately after the upload because it is processed in the background.

### CDN and Cache vs Freshness

CDNs and caches greatly reduce latency and database load, especially for the read-heavy feed. However, cached content can become temporarily stale, so the system needs sensible cache expiration or invalidation rules.

### Object Storage vs Database Storage

Object storage is much better suited to the large volume of photo files and keeps the relational database smaller and easier to manage. The trade-off is that the application must coordinate metadata in the database with files stored separately in object storage.
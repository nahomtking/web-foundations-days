# SnapShare Photo App Scaling Plan

## 1. Assumptions

SnapShare has 10 million registered users, with 10% active each day.

This gives:

- Registered users: 10,000,000
- Daily active users: 10,000,000 × 10% = 1,000,000 users
- Each active user uploads 1 photo per day.
- Each active user views 50 feed pages per day.
- Each original photo is approximately 2 MB.
- Each photo also has a 50 KB thumbnail.
- There are 365 days in a year.
- The calculations below use the average load over a 24-hour day.
- Peak feed traffic is estimated at 5 times the average traffic.

## 2. Traffic and Storage Estimates

### Daily active users

10,000,000 × 10% = 1,000,000 daily active users.

### Photo uploads

Each active user uploads 1 photo per day:

1,000,000 × 1 = 1,000,000 uploads per day.

Uploads per second:

1,000,000 ÷ 86,400 ≈ 11.6 uploads per second.

So SnapShare needs to handle approximately 12 photo uploads per second on average.

### Feed views

Each active user views 50 feed pages per day:

1,000,000 × 50 = 50,000,000 feed views per day.

Average feed views per second:

50,000,000 ÷ 86,400 ≈ 579 feed views per second.

Using the required 5× peak factor:

579 × 5 ≈ 2,895 feed views per second at peak.

### Photo storage

Each day, 1,000,000 photos are uploaded.

Original photo storage per year:

1,000,000 × 2 MB × 365 = 730,000,000 MB

This is approximately 730 TB of original photo storage per year.

Thumbnail storage per year:

1,000,000 × 50 KB × 365 = 18,250,000,000 KB

This is approximately 18.25 TB of thumbnail storage per year.

Therefore, the total new photo and thumbnail storage required per year is approximately:

730 TB + 18.25 TB = 748.25 TB per year.

These figures do not include additional storage for backups, replication, metadata, or future growth.

## 3. Read-Heavy or Write-Heavy?

SnapShare is a read-heavy system.

There are approximately 12 photo uploads per second on average, compared with approximately 579 feed views per second on average and about 2,895 feed views per second at peak.

Because users read the feed much more often than they upload photos, the architecture should focus on handling large numbers of read requests efficiently. A CDN and cache can reduce repeated requests reaching the application servers and database, while a database read replica can handle additional read traffic.

## 4. Why Photos Should Not Be Stored in the Database

The actual photo files should not be stored directly inside the database because large binary files would make the database much larger and make backups, replication, and database operations more expensive and difficult to manage.

Instead, the original photos and thumbnails should be stored in object storage. The database should store information about each photo, such as its ID, owner, caption, storage location, and timestamps. This keeps the database focused on structured application data while object storage handles the large files.

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
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
             ┌─────────────┐           ┌─────────────┐
             │ App Server 1 │           │ App Server 2 │
             └──────┬──────┘           └──────┬──────┘
                    │                         │
                    └────────────┬────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
             ┌─────────────┐          ┌───────────────┐
             │    Cache    │          │    Database   │
             └─────────────┘          │    Primary    │
                                      └───────┬───────┘
                                              │
                                              ▼
                                      ┌───────────────┐
                                      │  Read Replica │
                                      └───────────────┘


        Photo Upload
              │
              ▼
       ┌───────────────┐
       │ Object Storage│
       │ Original Photo│
       └───────┬───────┘
               │
               ▼
          ┌─────────┐
          │  Queue  │
          └────┬────┘
               │
               ▼
       ┌───────────────┐
       │    Worker     │
       │  Thumbnail    │
       │   Creation    │
       └───────┬───────┘
               │
               ▼
       ┌───────────────┐
       │ Object Storage│
       │   Thumbnail   │
       └───────────────┘
```

## 6. Components

- CDN: Delivers frequently requested photos and thumbnails from locations closer to users, reducing load on the application servers.
- Load balancer: Distributes incoming requests across multiple application servers so that one server does not become a bottleneck.
- App servers: Run the application logic for uploads, feed requests, authentication, and other user actions.
- Cache: Stores frequently requested data so that repeated feed requests can be served faster without always querying the database.
- Primary database: Stores structured application data such as users, photo metadata, follows, and posts.
- Read replica: Handles database read requests separately from the primary database to increase read capacity.
- Object storage: Stores the large original photo files and thumbnails without putting those files inside the database.
- Queue: Holds thumbnail-generation jobs so that photo uploads do not have to wait for thumbnail processing to finish.
- Thumbnail worker: Processes queued jobs and creates smaller thumbnail versions of uploaded photos.

## 7. Photo Upload Flow

1. The user selects a photo and starts an upload.
2. The request reaches the load balancer, which sends it to an available application server.
3. The application server validates the user and the upload.
4. The original photo is stored in object storage.
5. The application stores the photo metadata and object-storage location in the primary database.
6. The application places a thumbnail-generation job on the queue.
7. The application can respond to the user that the upload has been accepted without waiting for the thumbnail to finish.
8. A thumbnail worker takes the job from the queue.
9. The worker downloads or accesses the original photo from object storage and creates the 50 KB thumbnail.
10. The worker stores the thumbnail in object storage.
11. The thumbnail can then be delivered through the CDN when users view the photo.

## 8. Trade-Offs

### CDN and caching vs freshness

Using a CDN and cache greatly improves performance and reduces load on the application servers, but cached content may not immediately reflect a newly uploaded or changed photo. The system therefore needs cache expiration or cache invalidation rules.

### Read replica vs consistency

A read replica increases the system's ability to handle large numbers of read requests, but there can be a short delay before changes made to the primary database appear on the replica. Some operations may therefore need to read directly from the primary database when the newest data is required.

### Asynchronous thumbnails vs immediate availability

Using a queue and worker makes uploads faster because thumbnail creation happens in the background. However, the thumbnail may not be available immediately after the original photo is uploaded.

### Object storage vs database storage

Object storage is better suited to very large amounts of photo data and can scale independently from the database, but it adds another system that the application must manage and monitor.
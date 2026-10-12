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

1. The user selects a photo in the SnapShare app and starts the upload.
2. The upload request is received by the load balancer and forwarded to an available app server.
3. The app server authenticates the user and validates the uploaded photo.
4. The original photo is uploaded to object storage instead of being stored in the database.
5. The app server creates a photo record in the primary database containing information such as the user, photo ID, and object-storage location.
6. The app server places a thumbnail-generation job containing the photo information onto the queue.
7. The app server responds to the user that the photo has been uploaded successfully without waiting for thumbnail creation to finish.
8. A thumbnail worker takes the job from the queue and creates a smaller thumbnail from the original photo.
9. The worker stores the thumbnail in object storage.
10. The thumbnail becomes available through the CDN for users viewing the photo.

Because thumbnail generation is asynchronous, the user does not have to wait for image processing before the upload request finishes. The original photo can be available first, while the thumbnail may appear a short time later after the worker completes its job.

## 8. Architectural Trade-Offs

### Read Replicas vs. Immediate Consistency

Using a database read replica increases the system's ability to handle the large number of feed reads, but replicas can have a small delay before they receive the latest changes from the primary database. This means a newly created photo or updated information might not immediately appear in every read request. The system can read from the primary database when the newest data is required.

### Asynchronous Thumbnail Generation vs. Immediate Thumbnail Availability

Using a queue and worker keeps the upload request fast because the application does not need to wait for thumbnail processing. The trade-off is that the thumbnail is not guaranteed to be available immediately after the original photo is uploaded. The user may briefly see the original image or a placeholder until the thumbnail worker finishes.

### CDN and Cache vs. Freshness

Using a CDN and cache reduces repeated requests reaching the application servers and database and makes the feed faster. The trade-off is that cached photos or feed information may become temporarily outdated. Cache expiration and invalidation are therefore needed when content changes.

### Dynamic Feed Assembly vs. Pre-Generated Feeds

Dynamically assembling a feed keeps the feed data more current and avoids storing a separate copy of every user's feed, but it requires more database and application work for each feed request. Pre-generating feeds can make reads faster, but it requires additional storage and processing and can make changes harder to propagate immediately.
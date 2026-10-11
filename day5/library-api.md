# Library Books API

This REST API manages books in a library system. The `books` resource supports listing, retrieving, creating, updating, deleting, and filtering books by author.

## Endpoints

### 1. List all books

- **Method:** `GET`
- **Path:** `/books`
- **Description:** Returns a list of all books in the library.
- **Success status:** `200 OK`

### 2. Get one book

- **Method:** `GET`
- **Path:** `/books/{id}`
- **Description:** Returns the details of one book using its ID.
- **Success status:** `200 OK`

### 3. Create a book

- **Method:** `POST`
- **Path:** `/books`
- **Description:** Creates a new book in the library.
- **Request body:**

```json
{
  "title": "Things Fall Apart",
  "author": "Chinua Achebe",
  "year": 1958
}
```

- **Success status:** `201 Created`

### 4. Update a book

- **Method:** `PUT`
- **Path:** `/books/{id}`
- **Description:** Updates an existing book using its ID.
- **Request body:**

```json
{
  "title": "Things Fall Apart",
  "author": "Chinua Achebe",
  "year": 1958
}
```

- **Success status:** `200 OK`

### 5. Delete a book

- **Method:** `DELETE`
- **Path:** `/books/{id}`
- **Description:** Deletes a book using its ID.
- **Success status:** `204 No Content`

### 6. List books by author

- **Method:** `GET`
- **Path:** `/books?author=Chinua%20Achebe`
- **Description:** Returns books written by the specified author using a query parameter.
- **Success status:** `200 OK`

## Error Codes

### 400 Bad Request

Returned when the request contains invalid or missing data.

Example: A request to create a book does not include a required title or author.

### 404 Not Found

Returned when the requested book does not exist.

Example: A request for `GET /books/999` when there is no book with ID `999`.


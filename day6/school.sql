-- DAY 6: SCHOOL DATABASE

-- 1. CREATE TABLES

CREATE TABLE students (
    student_id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
);

CREATE TABLE courses (
    course_id INTEGER PRIMARY KEY,
    course_name TEXT NOT NULL
);

CREATE TABLE enrolments (
    enrolment_id INTEGER PRIMARY KEY,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    grade TEXT,
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (course_id) REFERENCES courses(course_id),
    UNIQUE (student_id, course_id)
);


-- 2. INSERT SAMPLE DATA

INSERT INTO students (student_id, name, email) VALUES
(1, 'Nahom King', 'nahom@example.com'),
(2, 'Daniel Bekele', 'daniel@example.com'),
(3, 'Sara Tesfaye', 'sara@example.com'),
(4, 'Michael Abebe', 'michael@example.com');

INSERT INTO courses (course_id, course_name) VALUES
(1, 'Web Development'),
(2, 'Database Fundamentals'),
(3, 'Python Programming');

INSERT INTO enrolments (enrolment_id, student_id, course_id, grade) VALUES
(1, 1, 1, 'A'),
(2, 1, 2, 'B'),
(3, 2, 1, 'B'),
(4, 2, 3, 'A'),
(5, 3, 2, 'A');


-- 3. REQUIRED QUERIES

-- Query 1: All courses for one student by name
SELECT courses.course_name
FROM courses
JOIN enrolments ON courses.course_id = enrolments.course_id
JOIN students ON enrolments.student_id = students.student_id
WHERE students.name = 'Nahom King';


-- Query 2: All students on one course
SELECT students.name
FROM students
JOIN enrolments ON students.student_id = enrolments.student_id
JOIN courses ON enrolments.course_id = courses.course_id
WHERE courses.course_name = 'Web Development';


-- Query 3: Number of students per course
SELECT courses.course_name, COUNT(enrolments.student_id) AS student_count
FROM courses
LEFT JOIN enrolments ON courses.course_id = enrolments.course_id
GROUP BY courses.course_id, courses.course_name;


-- Query 4: Students who have no enrolments
SELECT students.name
FROM students
LEFT JOIN enrolments ON students.student_id = enrolments.student_id
WHERE enrolments.enrolment_id IS NULL;


-- Query 5: Update one enrolment's grade
UPDATE enrolments
SET grade = 'A+'
WHERE enrolment_id = 1;
# School Database Design

## Tables

### Students

The students table stores information about each student. It contains the student's ID, name, and email address. The student ID is the primary key, and each email address must be unique.

### Courses

The courses table stores information about the courses offered by the school. It contains a course ID and course name. The course ID is the primary key.

### Enrolments

The enrolments table records which students are enrolled in which courses. It contains an enrolment ID, student ID, course ID, and grade. The student ID and course ID are foreign keys that connect the enrolments table to the students and courses tables.

## Relationships

There is a one-to-many relationship between students and enrolments because one student can have many enrolments, while each enrolment belongs to one student.

There is also a one-to-many relationship between courses and enrolments because one course can have many enrolments, while each enrolment belongs to one course.

Students and courses have a many-to-many relationship because one student can take many courses and one course can have many students. The enrolments table is needed as a join table to connect students and courses and to store additional information about the enrolment, such as the student's grade.

## Index

I would add an index on `enrolments.student_id` because queries that find all courses taken by a particular student will frequently use this column. An index can make these searches faster as the number of enrolments grows.

## SQL or NoSQL?

I would choose SQL for this school system because the data has clear relationships between students, courses, and enrolments. SQL databases are well suited to structured data and relationships between tables. Foreign keys and constraints also help keep the data accurate and prevent problems such as duplicate enrolments.
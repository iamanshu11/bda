# Bokaro Defence Academy (BDA) - Full Stack Website Development Prompt

# Project Overview

Build a modern, scalable, production-ready educational platform for **Bokaro Defence Academy (BDA)**.

The homepage UI must closely follow the provided design (PDF attached).

The project should be developed using modern architecture and best coding practices.

---

# Tech Stack

## Frontend

- Next.js 15+
- TypeScript
- App Router
- Tailwind CSS
- Framer Motion
- React Hook Form
- Zod Validation
- Axios
- React Query / TanStack Query
- ShadCN UI
- Lucide Icons
- Swiper JS
- next/image
- next/font

---

## Backend

- Node.js
- Express.js
- TypeScript
- PostgreSQL
-  ORM
- JWT Authentication
- Nodemailer
- Bcrypt
- Helmet
- CORS
- Rate Limiter
- Multer
- Winston Logger
- dotenv

---

# Database

PostgreSQL

Create proper

- migrations
- seeders
- indexes
- relations

Everything should be production ready.

---

# Folder Structure

```
BDA/

│
├── frontend/
│
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   ├── store/
│   ├── utils/
│   ├── lib/
│   ├── types/
│   ├── public/
│   ├── styles/
│   ├── frontend-data/
│   │
│   ├── assets/
│   ├── constants/
│   ├── middleware.ts
│   ├── package.json
│   └── README.md
│
│
├── backend/
│
│   ├── node/
│   │
│   ├── src/
│   │
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── helpers/
│   │   ├── validations/
│   │   ├── interfaces/
│   │   ├── constants/
│   │   ├── emails/
│   │   ├── utils/
│   │   ├── logger/
│   │   ├── uploads/
│   │   ├── app.ts
│   │   └── server.ts
│   │
│   ├── db/
│   │
│   │  
│   │   │
│   │   ├── migrations/
│   │   ├── seeders/
│   │   ├── schema
│   │   └── seed.ts
│   │
│   ├── package.json
│   └── README.md
│
└── README.md

```

---

# Authentication

Implement complete authentication.

Features

- Login
- Signup
- Forgot Password
- Reset Password
- Email Verification
- Change Password
- Logout
- Refresh Token

---

# 2FA

Do NOT use SMS.

Use Email OTP.

Flow

Signup

↓

Generate 6 digit OTP

↓

Send using Nodemailer

↓

Verify OTP

↓

Account Activated

Login

↓

Email + Password

↓

Generate Login OTP

↓

Send Email

↓

Verify OTP

↓

Login Successful

OTP should

- expire in 5 minutes
- resend after 60 seconds
- hashed before storing
- single use only

---

# Roles

Create role-based authentication.

Roles

- Student
- Faculty
- Admin
- Super Admin

JWT should include

- User ID
- Role
- Permissions

---

# Database Tables

Users

Roles

OTP

Courses

Course Categories

Faculty

Gallery

Testimonials

Blogs

Results

Hall of Fame

Study Materials

Downloads

Notifications

Contact Messages

Enrollments

Batches

FAQs

Settings

Social Links

Admins

Refresh Tokens

Audit Logs

---

# Homepage

Follow the provided design exactly.

Sections

1 Hero

2 Statistics

3 About BDA

4 Exam Categories

5 Featured Courses

6 Hall of Fame

7 Study Resources

8 Facilities

9 Testimonials

10 Gallery

11 Contact

12 Footer

Everything should be fully responsive.

---

# Courses

Each course should have

- Banner
- Description
- Curriculum
- Faculty
- Duration
- Fees
- Demo Videos
- FAQs
- Reviews
- Enrollment Button

---

# Student Dashboard

After login

Student can

- View purchased courses
- Track progress
- Watch videos
- Download notes
- View certificates
- Edit profile
- Change password

---

# Admin Dashboard

Admin should manage

Users

Courses

Categories

Faculty

Gallery

Testimonials

Hall of Fame

Results

Study Material

Blogs

FAQs

Contact Messages

Settings

Notifications

Enrollments

Everything should support full CRUD operations.

---

# File Uploads

Support

Images

PDF

Videos

Store using local storage initially.

Keep code ready to switch to AWS S3 later.

---

# APIs

Use REST APIs.

Organize as

/api/v1/auth

/api/v1/users

/api/v1/courses

/api/v1/categories

/api/v1/gallery

/api/v1/faculty

/api/v1/results

/api/v1/students

/api/v1/admin

/api/v1/contact

/api/v1/dashboard

/api/v1/settings

Every endpoint must

- validate request
- validate response
- handle errors
- use middleware
- use logger

---

# Security

Helmet

Rate Limiter

CORS

Input Validation

Password Hashing

JWT

Refresh Tokens

SQL Injection Protection

XSS Protection

CSRF Ready

Environment Variables

---

# Logging

Use Winston.

Separate

error.log

combined.log

request.log

---

# Validation

Use Zod on frontend.

Use express-validator on backend.

---

# Coding Standards

- Modular Architecture
- Repository Pattern
- Service Layer
- Clean Code
- SOLID Principles
- Reusable Components
- No duplicate code
- TypeScript everywhere
- Proper Interfaces
- Generic API Response
- Generic Error Handler

---

# UI

Theme

Modern

Military Inspired

Professional

Minimal

Animations

Smooth Fade

Scroll Reveal

Hover Effects

Counters

Carousels

Lazy Loading

Skeleton Loaders

Dark Mode

Light Mode

---

# SEO

Dynamic Metadata

Open Graph

Twitter Cards

Structured Data

robots.txt

sitemap.xml

Canonical URLs

---

# Performance

Image Optimization

Code Splitting

Dynamic Imports

Caching

Pagination

Infinite Scroll where needed

---

# Email Templates

Beautiful HTML templates for

Signup OTP

Login OTP

Forgot Password

Welcome Email

Enrollment Confirmation

Contact Response

---

# Environment Files

Frontend

.env.local

Backend

.env

Provide sample values.

---

# Documentation

Generate complete README files.

Include

Installation

Folder Structure

Scripts

Deployment

Database Setup


Environment Variables

Development Guide

Production Build

---

# Expected Output

Produce a complete production-ready full-stack project.

- Next.js (Frontend)
- Node.js + Express (Backend)
- PostgreSQL
-  ORM
- Email OTP Authentication
- JWT Authentication
- Role-Based Access Control
- Admin Dashboard
- Student Dashboard
- Clean Folder Structure
- Responsive UI
- Fully documented code
- Scalable architecture
- Maintainable codebase
- Industry-standard best practices

The homepage design must closely match the attached BDA PDF while keeping the code modular, reusable, and optimized for future feature additions.
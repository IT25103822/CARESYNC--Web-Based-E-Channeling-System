# CareSync - E-Channeling Healthcare Management System

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.4-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.4.3-purple.svg)](https://vitejs.dev/)
[![SQL Server](https://img.shields.io/badge/Microsoft%20SQL%20Server-2022%2F2025%20SQLEXPRESS-red.svg)](https://www.microsoft.com/sql-server)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4-38B2AC.svg)](https://tailwindcss.com/)

An enterprise-grade, full-stack Hospital Doctor Channeling, Appointment Booking, Patient Management, and Financial Governance System developed for **SLIIT SE2030 (Software Engineering)** and **IT2140 (Database Design & Development)**.

---

## 📋 System Overview & Subsystem Modules

| Subsystem / Member Module | Key Capabilities |
|---|---|
| **Member 1: Patient & Governance** | Patient Onboarding & Profile Photo upload, System-wide Audit Logs, Security Operations Desk. |
| **Member 2: Doctor Administration** | Consultant Directory, Specialization Filtering, Profile Updates, Clinical Prescriptions issuance. |
| **Member 3: Auth & Feedback** | Role-based Login (6 Roles), Password Recovery with 2-Step Verification, Grievance Support Desk, Star Ratings & Reviews. |
| **Member 4: Appointments** | Atomic Timeslot Booking, 48-Hour Cancellation Window, Rescheduling with automatic slot release, Permanent Cascade Deletion. |
| **Member 5: Schedules & Live Queue** | Roster Creation, Capacity Management, Real-time Doctor Arrival Tracking, Live Token Calling, SMS Broadcast Alerts. |
| **Member 6: Financial Governance** | Payment Gateway integration, Automated Digital Receipts, Custom OPD Invoices, Refund Management with Ledger Reconciliation. |

---

## 💻 Tech Stack

- **Backend**: Java 17/21/25, Spring Boot 3.3.4 (Spring Data JPA, Hibernate ORM, Validation, Jackson)
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React Icons
- **Database**: Microsoft SQL Server (Localhost SQLEXPRESS) with 16 Tables, Views, and 7 Automated Cascading Integrity Triggers
- **Architecture**: Joined Table Inheritance (OOP), RESTful API, Single-Page Application (SPA)

---

## ⚙️ Prerequisites

Before setting up the project, make sure the following software is installed on your computer:

1. **Java Development Kit (JDK)**: JDK 17, 21, or 25 installed and added to `PATH` (or configured via `JAVA_HOME`).
2. **Node.js**: Node.js v18+ and `npm` installed.
3. **Microsoft SQL Server**: SQL Server (SQLEXPRESS or Developer Edition) installed and running locally on port 1433 or standard named instance `localhost\SQLEXPRESS`.
4. **SQL Server Management Studio (SSMS)** or Azure Data Studio (optional, for viewing database tables).

---

## 🚀 Quick Setup & Installation Guide

### Step 1: Database Setup
1. Open SQL Server Management Studio (SSMS), Azure Data Studio, or command line `sqlcmd`.
2. Connect to your local SQL Server instance (`localhost\SQLEXPRESS` or `localhost`).
3. Run the **Schema script** located at:
   ```
   database/schema.sql
   ```
   *(This creates the `EChannelingDB` database, all 16 tables, views, and 7 cascading deletion triggers.)*
4. Run the **Seed data script** located at:
   ```
   database/seed.sql
   ```
   *(This populates realistic test data for all roles, doctors, schedules, appointments, and payments.)*

> **Alternative command-line setup (Windows PowerShell):**
> ```powershell
> sqlcmd -S "localhost\SQLEXPRESS" -E -C -i "database\schema.sql"
> sqlcmd -S "localhost\SQLEXPRESS" -E -C -i "database\seed.sql"
> ```

---

### Step 2: Configure Database Credentials
Open `backend/src/main/resources/application.properties` and verify your database connection settings:

```properties
spring.datasource.url=jdbc:sqlserver://localhost;instanceName=SQLEXPRESS;databaseName=EChannelingDB;encrypt=true;trustServerCertificate=true;
spring.datasource.username=echanneling_user
spring.datasource.password=password123
```
*(If your SQL Server uses Windows Authentication or a different username/password, adjust `username` and `password` accordingly.)*

---

### Step 3: Run the Application

#### Option A: 1-Click Startup (Recommended for Windows)
Simply double-click the included batch file in the root folder:
```
start-all.bat
```
This automatically launches both the Spring Boot Backend and the React Frontend in separate windows!

#### Option B: Manual Command Line Startup

1. **Start Backend**:
   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```
   *(On Windows cmd: `mvnw.cmd spring-boot:run`)*  
   *Backend will start on:* **`http://localhost:8080`**

2. **Start Frontend (for Development with Hot Reloading)**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   *Frontend dev server will start on:* **`http://localhost:5173`**

3. **Access Built Production Web App directly**:  
   The frontend is pre-built and packaged inside the backend. When the backend is running, you can access the full application immediately at:  
   👉 **`http://localhost:8080`**

---

## 🔑 System Login Credentials Directory

All test accounts use the standard password: **`password123`**

| Role | Username | Password | Full Name | Access Scope |
|---|---|---|---|---|
| **Super Admin** | `admin` | `password123` | Ishara Gunasekara | Full IT, Audit, Security & Doctor Approval Access |
| **Secondary Admin** | `admin.sarath` | `password123` | Sarath Kumara | Operations Administrator |
| **Channeling Coordinator 1** | `coordinator` | `password123` | Kasun Fernando | Doctor Rosters & Live Queue Tracker |
| **Channeling Coordinator 2** | `coordinator2` | `password123` | Dinuka Mendis | Outpatient Desk & Token Calling |
| **Finance Officer 1** | `finance` | `password123` | Ruwan Selvaratnam | Invoicing, Billing & Refund Authorizations |
| **Finance Officer 2** | `finance2` | `password123` | Nadeeka Alwis | Invoicing & Financial Audits |
| **Customer Service Executive** | `cse` | `password123` | Malsha Wijeratne | Patient Support & Grievances Desk |
| **Consultant Doctor** | `dr.nuwan` | `password123` | Dr. Nuwan Jayawardena | Cardiology Consultant (Fee: LKR 3,500) |
| **Consultant Doctor** | `dr.priyantha` | `password123` | Dr. Priyantha Silva | General Medicine (Fee: LKR 2,500) |
| **Consultant Doctor** | `dr.amanda` | `password123` | Dr. Amanda Fernando | Pediatrics Consultant (Fee: LKR 3,000) |
| **Consultant Doctor** | `dr.samantha` | `password123` | Dr. Samantha Perera | Dermatology Consultant (Fee: LKR 3,200) |
| **Consultant Doctor** | `dr.kasun` | `password123` | Dr. Kasun Dissanayake | Orthopedic Surgeon (Fee: LKR 3,800) |
| **Registered Patient** | `patient.anjali` | `password123` | Anjali Perera | Blood Group: A+ (NIC: 199855667788) |
| **Registered Patient** | `patient.kasun` | `password123` | Kasun Bandara | Blood Group: O+ (NIC: 200012349988) |
| **Registered Patient** | `patient.nimal` | `password123` | Nimal Jayasinghe | Blood Group: B+ (NIC: 199512345678) |

> **Pro-Tip:** You can log in using either the **Username** OR the user's **National ID (NIC)**.  
> Use the **Eye toggle button** in the password field to view or hide your password while typing.

---

## 🗄️ Database Architecture & Foreign Key Integrity

The system database (`EChannelingDB`) features **Joined Table Inheritance**:
- Base Table: `Users`
- Subtype Tables: `Patients`, `Doctors`, `StaffUsers`

### Automated Cascading Integrity Triggers
To eliminate any Foreign Key Constraint conflicts during manual or automated deletions, the database incorporates 7 dedicated `INSTEAD OF DELETE` triggers:
- `trg_Appointments_Delete`: Purges linked Refunds, Receipts, Payments, Prescriptions, Feedbacks, and Notifications, and automatically restores the associated Timeslot to `AVAILABLE`.
- `trg_Payments_Delete`: Cascades to child Receipts and Refunds.
- `trg_Schedules_Delete`: Cascades to Appointments, Queue Notifications, and Timeslots.
- `trg_Doctors_Delete`: Cascades to Doctor's Schedules, Appointments, Prescriptions, and Feedbacks.
- `trg_Patients_Delete`: Cascades to Patient's Appointments, Complaints, and Feedbacks.
- `trg_Users_Delete`: Safely nullifies audit foreign keys and cascades to subtype entities.

---

## 📁 Project Directory Structure

```
CARESYNC/
├── backend/                             # Spring Boot 3 Java Backend
│   ├── src/main/java/com/sliit/         # 109 Java Entities, Repositories, Services, Controllers
│   ├── src/main/resources/              # application.properties, schema.sql, seed.sql, static/
│   ├── mvnw & mvnw.cmd                  # Maven Wrapper executables
│   └── pom.xml                          # Maven build dependencies
├── frontend/                            # React 18 + Vite Modern Frontend
│   ├── src/components/                  # Portals: Patient, Doctor, Coordinator, Admin, Finance, CSE
│   ├── src/utils/                       # Utility functions & helpers
│   ├── package.json                     # Frontend dependencies
│   ├── vite.config.js                   # Vite configuration
│   └── tailwind.config.js               # Tailwind design system
├── database/                            # Complete Database Scripts
│   ├── schema.sql                       # 16 Tables, Views, Cascading Triggers
│   └── seed.sql                         # Complete Realistic Seed Data
├── run-backend.bat                      # 1-Click Backend Launcher
├── run-frontend.bat                     # 1-Click Frontend Launcher
├── start-all.bat                        # 1-Click Full System Launcher
├── TEAM_GUIDE.md                        # Academic submission & Viva review guide
└── README.md                            # Comprehensive Setup & Usage Guide
```

---

## 👥 Academic Attribution

**SLIIT Computing Faculty**  
- **Module 1**: SE2030 - Software Engineering  
- **Module 2**: IT2140 - Database Design and Development  
- **Project Group**: 2026-Y2-S1-KU-50  
- **System**: CareSync Hospital Channeling Core  

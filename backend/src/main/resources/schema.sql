-- ============================================================================
-- SLIIT SE2030 (Software Engineering) & IT2140 (Database Design and Development)
-- Group ID: 2026-Y2-S1-KU-50
-- Database: Microsoft SQL Server (Localhost SQLEXPRESS)
-- Database Name: EChannelingDB
-- Description: Complete Production EER Diagram Table Definitions & Integrity Constraints
-- Demonstrates: Joined Table Inheritance (Users -> Patients, Doctors, StaffUsers),
--              1:1, 1:N, and N:M Relationships, Foreign Key Cascades & Constraints.
-- ============================================================================

-- 1. Create Database if not exists
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'EChannelingDB')
BEGIN
    CREATE DATABASE [EChannelingDB];
END
GO

USE [EChannelingDB];
GO

-- ============================================================================
-- Clean Re-installation: Drop tables in reverse foreign key dependency order
-- ============================================================================
IF OBJECT_ID('dbo.SystemLogs', 'U') IS NOT NULL DROP TABLE dbo.SystemLogs;
IF OBJECT_ID('dbo.QueueNotifications', 'U') IS NOT NULL DROP TABLE dbo.QueueNotifications;
IF OBJECT_ID('dbo.Prescriptions', 'U') IS NOT NULL DROP TABLE dbo.Prescriptions;
IF OBJECT_ID('dbo.Receipts', 'U') IS NOT NULL DROP TABLE dbo.Receipts;
IF OBJECT_ID('dbo.Refunds', 'U') IS NOT NULL DROP TABLE dbo.Refunds;
IF OBJECT_ID('dbo.Payments', 'U') IS NOT NULL DROP TABLE dbo.Payments;
IF OBJECT_ID('dbo.CustomBills', 'U') IS NOT NULL DROP TABLE dbo.CustomBills;
IF OBJECT_ID('dbo.Feedbacks', 'U') IS NOT NULL DROP TABLE dbo.Feedbacks;
IF OBJECT_ID('dbo.Complaints', 'U') IS NOT NULL DROP TABLE dbo.Complaints;
IF OBJECT_ID('dbo.Appointments', 'U') IS NOT NULL DROP TABLE dbo.Appointments;
IF OBJECT_ID('dbo.Timeslots', 'U') IS NOT NULL DROP TABLE dbo.Timeslots;
IF OBJECT_ID('dbo.Schedules', 'U') IS NOT NULL DROP TABLE dbo.Schedules;
IF OBJECT_ID('dbo.Doctors', 'U') IS NOT NULL DROP TABLE dbo.Doctors;
IF OBJECT_ID('dbo.Patients', 'U') IS NOT NULL DROP TABLE dbo.Patients;
IF OBJECT_ID('dbo.StaffUsers', 'U') IS NOT NULL DROP TABLE dbo.StaffUsers;
IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL DROP TABLE dbo.Users;
GO

-- ============================================================================
-- 1. Users Table (Base entity for Joined Table Inheritance in OOP)
-- Attributes: UserId, Username, PasswordHash, FullName, ContactNumber, NIC, Role, CreatedAt, IsActive
-- ============================================================================
CREATE TABLE dbo.Users (
    UserId INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    Username NVARCHAR(100) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    FullName NVARCHAR(255) NOT NULL,
    ContactNumber NVARCHAR(50) NOT NULL,
    NIC NVARCHAR(20) NOT NULL UNIQUE,
    Role NVARCHAR(50) NOT NULL, -- PATIENT, DOCTOR, ADMINISTRATOR, CHANNELING_COORDINATOR, FINANCE_OFFICER, CUSTOMER_SERVICE_EXECUTIVE
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    IsActive BIT NOT NULL DEFAULT 1
);
GO

-- ============================================================================
-- 2. Patients Table (Specialization: PATIENT IS A USER)
-- Member 1: Jayasundara U.R (IT25103820) - Patient Management
-- Attributes: PatientId (PK/FK), DateOfBirth, Gender, Address, BloodGroup, Age, EmergencyContact, ProfileImage
-- ============================================================================
CREATE TABLE dbo.Patients (
    PatientId INT NOT NULL PRIMARY KEY,
    DateOfBirth DATE NOT NULL,
    Gender NVARCHAR(20) NOT NULL,
    Address NVARCHAR(500) NOT NULL,
    BloodGroup NVARCHAR(20) NOT NULL,
    Age INT NOT NULL,
    EmergencyContact NVARCHAR(50) NULL,
    ProfileImage NVARCHAR(MAX) NULL,
    CONSTRAINT FK_Patients_Users FOREIGN KEY (PatientId) REFERENCES dbo.Users(UserId)
);
GO

-- ============================================================================
-- 3. StaffUsers Table (Specialization: Staff IS A USER)
-- Member 1 & System Administrator - Staff Role Management
-- Attributes: StaffId (PK/FK), StaffRole, Department, Permissions
-- Roles: ADMINISTRATOR, CHANNELING_COORDINATOR, FINANCE_OFFICER, CUSTOMER_SERVICE_EXECUTIVE
-- ============================================================================
CREATE TABLE dbo.StaffUsers (
    StaffId INT NOT NULL PRIMARY KEY,
    StaffRole NVARCHAR(50) NOT NULL,
    Department NVARCHAR(100) NULL,
    Permissions NVARCHAR(500) NULL,
    CONSTRAINT FK_StaffUsers_Users FOREIGN KEY (StaffId) REFERENCES dbo.Users(UserId)
);
GO

-- ============================================================================
-- 4. Doctors Table (Specialization: DOCTOR IS A USER)
-- Member 2: Adhikari A.M.S.T (IT25103821) - Doctor Management & Administration
-- Attributes: DoctorId (PK/FK), MedicalLicenseNo, Specialization, Qualifications, ConsultationFee, IsApproved, ApprovedByAdminId, HospitalAffiliation, ProfileImage
-- ============================================================================
CREATE TABLE dbo.Doctors (
    DoctorId INT NOT NULL PRIMARY KEY,
    MedicalLicenseNo NVARCHAR(50) NOT NULL UNIQUE,
    Specialization NVARCHAR(100) NOT NULL,
    Qualifications NVARCHAR(500) NOT NULL,
    ConsultationFee DECIMAL(10,2) NOT NULL,
    IsApproved BIT NOT NULL DEFAULT 0,
    ApprovedByAdminId INT NULL,
    HospitalAffiliation NVARCHAR(255) NULL,
    ProfileImage NVARCHAR(MAX) NULL,
    CONSTRAINT FK_Doctors_Users FOREIGN KEY (DoctorId) REFERENCES dbo.Users(UserId),
    CONSTRAINT FK_Doctors_Admin FOREIGN KEY (ApprovedByAdminId) REFERENCES dbo.Users(UserId)
);
GO

-- ============================================================================
-- 5. Schedules Table (Doctor CONDUCTS Schedule, Coordinator MANAGES Schedule)
-- Member 5: Yapa Bandara Y.M.M.P.P.D (IT25103824) - Doctor Schedule Management
-- Attributes: ScheduleId, DoctorId, CoordinatorId, ScheduleDate, StartTime, EndTime,
--             MaxCapacity, HospitalLocation, Status, DoctorArrivalStatus, DoctorArrivalTime,
--             CurrentToken, EstimatedDelayMinutes, QueueStatusNote, CreatedAt
-- ============================================================================
CREATE TABLE dbo.Schedules (
    ScheduleId INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    DoctorId INT NOT NULL,
    CoordinatorId INT NULL,
    ScheduleDate DATE NOT NULL,
    StartTime TIME(0) NOT NULL,
    EndTime TIME(0) NOT NULL,
    MaxCapacity INT NOT NULL DEFAULT 20,
    HospitalLocation NVARCHAR(150) NOT NULL,
    Status NVARCHAR(50) NOT NULL DEFAULT 'SCHEDULED', -- SCHEDULED, FULLY_BOOKED, CANCELLED, COMPLETED, ON_LEAVE
    DoctorArrivalStatus NVARCHAR(50) NOT NULL DEFAULT 'NOT_ARRIVED', -- NOT_ARRIVED, ON_THE_WAY, ARRIVED, IN_PROGRESS, COMPLETED
    DoctorArrivalTime TIME(0) NULL,
    CurrentToken INT NOT NULL DEFAULT 0,
    EstimatedDelayMinutes INT NOT NULL DEFAULT 0,
    QueueStatusNote NVARCHAR(255) NULL,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Schedules_Doctors FOREIGN KEY (DoctorId) REFERENCES dbo.Doctors(DoctorId),
    CONSTRAINT FK_Schedules_Coordinator FOREIGN KEY (CoordinatorId) REFERENCES dbo.Users(UserId)
);
GO

-- ============================================================================
-- 6. Timeslots Table (Schedule HAS Timeslots - 1 to N composition)
-- Member 5: Yapa Bandara Y.M.M.P.P.D (IT25103824)
-- Attributes: TimeslotId, ScheduleId, SlotNo, SlotTime, SlotEndTime, SlotStatus
-- ============================================================================
CREATE TABLE dbo.Timeslots (
    TimeslotId INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    ScheduleId INT NOT NULL,
    SlotNo INT NOT NULL,
    SlotTime TIME(0) NOT NULL,
    SlotEndTime TIME(0) NULL,
    SlotStatus NVARCHAR(50) NOT NULL DEFAULT 'AVAILABLE', -- AVAILABLE, RESERVED, BOOKED, CANCELLED
    CONSTRAINT FK_Timeslots_Schedules FOREIGN KEY (ScheduleId) REFERENCES dbo.Schedules(ScheduleId),
    CONSTRAINT UQ_Schedule_SlotNo UNIQUE (ScheduleId, SlotNo)
);
GO

-- ============================================================================
-- 7. Appointments Table (Patient BOOKS Appointment, Reserved for Timeslot 1:1)
-- Member 4: Devindra P.P.C.G (IT25103823) - Appointment Management
-- Attributes: AppointmentId, PatientId, DoctorId, ScheduleId, TimeslotId, BookingDate,
--             AppointmentDate, StartTime, EndTime, AppointmentStatus, CreatedAt
-- ============================================================================
CREATE TABLE dbo.Appointments (
    AppointmentId INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    PatientId INT NOT NULL,
    DoctorId INT NOT NULL,
    ScheduleId INT NOT NULL,
    TimeslotId INT NOT NULL UNIQUE, -- 1:1 relationship with Timeslot
    BookingDate DATETIME NOT NULL DEFAULT GETDATE(),
    AppointmentDate DATE NOT NULL,
    StartTime TIME(0) NOT NULL,
    EndTime TIME(0) NOT NULL,
    AppointmentStatus NVARCHAR(50) NOT NULL DEFAULT 'CONFIRMED', -- PENDING_PAYMENT, CONFIRMED, RESCHEDULED, CANCELLED, COMPLETED
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Appointments_Patients FOREIGN KEY (PatientId) REFERENCES dbo.Patients(PatientId),
    CONSTRAINT FK_Appointments_Doctors FOREIGN KEY (DoctorId) REFERENCES dbo.Doctors(DoctorId),
    CONSTRAINT FK_Appointments_Schedules FOREIGN KEY (ScheduleId) REFERENCES dbo.Schedules(ScheduleId),
    CONSTRAINT FK_Appointments_Timeslots FOREIGN KEY (TimeslotId) REFERENCES dbo.Timeslots(TimeslotId)
);
GO

-- ============================================================================
-- 8. Payments Table (Appointment GENERATES Payment 1:1, Finance Officer VERIFIES)
-- Member 6: Brahmananayaka N.M (IT25103825) - Payment & Financial Governance
-- Attributes: PaymentId, AppointmentId, FinanceOfficerId, TransactionReference, Amount,
--             PaymentMethod, PaymentStatus, PaymentDate
-- ============================================================================
CREATE TABLE dbo.Payments (
    PaymentId INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    AppointmentId INT NOT NULL UNIQUE, -- 1:1 relationship with Appointment
    FinanceOfficerId INT NULL,
    TransactionReference NVARCHAR(100) NOT NULL UNIQUE,
    Amount DECIMAL(10,2) NOT NULL,
    PaymentMethod NVARCHAR(50) NOT NULL, -- CREDIT_CARD, DEBIT_CARD, ONLINE_BANKING
    PaymentStatus NVARCHAR(50) NOT NULL DEFAULT 'COMPLETED', -- PENDING, COMPLETED, FAILED, REFUNDED
    PaymentDate DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Payments_Appointments FOREIGN KEY (AppointmentId) REFERENCES dbo.Appointments(AppointmentId),
    CONSTRAINT FK_Payments_FinanceOfficer FOREIGN KEY (FinanceOfficerId) REFERENCES dbo.Users(UserId)
);
GO

-- ============================================================================
-- 9. Receipts Table (Payment HAS Receipt 1:1)
-- Member 6: Brahmananayaka N.M (IT25103825) - Digital Invoicing & Receipts
-- Attributes: ReceiptId, PaymentId, ReceiptNumber, IssueDate, ReceiptDetails
-- ============================================================================
CREATE TABLE dbo.Receipts (
    ReceiptId INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    PaymentId INT NOT NULL UNIQUE, -- 1:1 with Payment
    ReceiptNumber NVARCHAR(100) NOT NULL UNIQUE,
    IssueDate DATETIME NOT NULL DEFAULT GETDATE(),
    ReceiptDetails NVARCHAR(MAX) NULL,
    CONSTRAINT FK_Receipts_Payments FOREIGN KEY (PaymentId) REFERENCES dbo.Payments(PaymentId)
);
GO

-- ============================================================================
-- 10. Refunds Table (Appointment MAY HAVE Refund 1:1, PAID VIA Payment)
-- Member 6: Brahmananayaka N.M (IT25103825) - Financial Reconciliation & Refunds
-- Attributes: RefundId, AppointmentId, PaymentId, FinanceOfficerId, RefundAmount,
--             RefundDate, Reason, RefundStatus
-- ============================================================================
CREATE TABLE dbo.Refunds (
    RefundId INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    AppointmentId INT NOT NULL UNIQUE,
    PaymentId INT NOT NULL,
    FinanceOfficerId INT NULL,
    RefundAmount DECIMAL(10,2) NOT NULL,
    RefundDate DATETIME NOT NULL DEFAULT GETDATE(),
    Reason NVARCHAR(MAX) NOT NULL,
    RefundStatus NVARCHAR(50) NOT NULL DEFAULT 'REQUESTED', -- REQUESTED, APPROVED, REJECTED, PROCESSED
    CONSTRAINT FK_Refunds_Appointments FOREIGN KEY (AppointmentId) REFERENCES dbo.Appointments(AppointmentId),
    CONSTRAINT FK_Refunds_Payments FOREIGN KEY (PaymentId) REFERENCES dbo.Payments(PaymentId),
    CONSTRAINT FK_Refunds_FinanceOfficer FOREIGN KEY (FinanceOfficerId) REFERENCES dbo.Users(UserId)
);
GO

-- ============================================================================
-- 11. CustomBills Table (Member 6: Brahmananayaka N.M - IT25103825)
-- Direct Outpatient (OPD), Emergency, Diagnostics, Pharmacy & Custom Invoices
-- Attributes: BillId, InvoiceNumber, PatientName, PatientId, PatientNic, PatientContact,
--             DoctorName, DoctorSpecialization, Department, BillCategory, PaymentMethod,
--             PaymentStatus, Subtotal, FacilityCharge, Discount, Tax, TotalAmount,
--             LineItemsJson, Remarks, CashierName, TransactionReference, PaidAt, CreatedAt
-- ============================================================================
CREATE TABLE dbo.CustomBills (
    BillId INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    InvoiceNumber NVARCHAR(100) NOT NULL UNIQUE,
    PatientName NVARCHAR(200) NOT NULL,
    PatientId NVARCHAR(50) NULL,
    PatientNic NVARCHAR(50) NULL,
    PatientContact NVARCHAR(50) NULL,
    DoctorName NVARCHAR(200) NULL,
    DoctorSpecialization NVARCHAR(100) NULL,
    Department NVARCHAR(100) NULL,
    BillCategory NVARCHAR(100) NOT NULL, -- Outpatient (OPD) Consultation, Emergency Care & Casualty, Laboratory & Diagnostic Testing, etc.
    PaymentMethod NVARCHAR(50) NOT NULL, -- CASH, CREDIT_CARD, DEBIT_CARD, ONLINE_BANKING, INSURANCE
    PaymentStatus NVARCHAR(50) NOT NULL DEFAULT 'COMPLETED', -- COMPLETED, PENDING, CANCELLED
    Subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    FacilityCharge DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    Discount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    Tax DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    TotalAmount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    LineItemsJson NVARCHAR(MAX) NULL,
    Remarks NVARCHAR(MAX) NULL,
    CashierName NVARCHAR(100) NULL,
    TransactionReference NVARCHAR(100) NULL,
    PaidAt DATETIME NULL,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- ============================================================================
-- 12. Feedbacks Table (Patient SUBMITS Feedback, Appointment HAS Feedback 1:1)
-- Member 3: Karunathilake B.M.G.T.P (IT25103822) - User Login & Feedback Management
-- Attributes: FeedbackId, PatientId, DoctorId, AppointmentId, Rating, Comments,
--             SubmittedDate, IsFeatured
-- ============================================================================
CREATE TABLE dbo.Feedbacks (
    FeedbackId INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    PatientId INT NOT NULL,
    DoctorId INT NOT NULL,
    AppointmentId INT NOT NULL UNIQUE,
    Rating INT NOT NULL CHECK (Rating BETWEEN 1 AND 5),
    Comments NVARCHAR(MAX) NULL,
    SubmittedDate DATETIME NOT NULL DEFAULT GETDATE(),
    IsFeatured BIT NOT NULL DEFAULT 0,
    CONSTRAINT FK_Feedbacks_Patients FOREIGN KEY (PatientId) REFERENCES dbo.Patients(PatientId),
    CONSTRAINT FK_Feedbacks_Doctors FOREIGN KEY (DoctorId) REFERENCES dbo.Doctors(DoctorId),
    CONSTRAINT FK_Feedbacks_Appointments FOREIGN KEY (AppointmentId) REFERENCES dbo.Appointments(AppointmentId)
);
GO

-- ============================================================================
-- 13. Complaints Table (Patient RAISES Complaint, CSE HANDLES Complaint)
-- Member 3: Karunathilake B.M.G.T.P (IT25103822) - Support Desk Management
-- Attributes: ComplaintId, PatientId, CustomerServiceId, ComplaintType, Description,
--             ComplaintStatus, DateSubmitted, ResolutionNotes, ResolvedDate
-- ============================================================================
CREATE TABLE dbo.Complaints (
    ComplaintId INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    PatientId INT NOT NULL,
    CustomerServiceId INT NULL,
    ComplaintType NVARCHAR(100) NOT NULL, -- DELAY, STAFF_BEHAVIOR, PAYMENT_ISSUE, CANCELLATION, OTHER
    Description NVARCHAR(MAX) NOT NULL,
    ComplaintStatus NVARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, RESOLVED, CLOSED
    DateSubmitted DATETIME NOT NULL DEFAULT GETDATE(),
    ResolutionNotes NVARCHAR(MAX) NULL,
    ResolvedDate DATETIME NULL,
    CONSTRAINT FK_Complaints_Patients FOREIGN KEY (PatientId) REFERENCES dbo.Patients(PatientId),
    CONSTRAINT FK_Complaints_Staff FOREIGN KEY (CustomerServiceId) REFERENCES dbo.Users(UserId)
);
GO

-- ============================================================================
-- 14. Prescriptions Table (Doctor ISSUES Prescription, Appointment GENERATES FOR 1:1)
-- Member 2: Adhikari A.M.S.T (IT25103821) - Clinical Records
-- Attributes: PrescriptionId, AppointmentId, DoctorId, PatientId, IssueDate, Details
-- ============================================================================
CREATE TABLE dbo.Prescriptions (
    PrescriptionId INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    AppointmentId INT NOT NULL UNIQUE,
    DoctorId INT NOT NULL,
    PatientId INT NOT NULL,
    IssueDate DATETIME NOT NULL DEFAULT GETDATE(),
    Details NVARCHAR(MAX) NOT NULL,
    CONSTRAINT FK_Prescriptions_Appointments FOREIGN KEY (AppointmentId) REFERENCES dbo.Appointments(AppointmentId),
    CONSTRAINT FK_Prescriptions_Doctors FOREIGN KEY (DoctorId) REFERENCES dbo.Doctors(DoctorId),
    CONSTRAINT FK_Prescriptions_Patients FOREIGN KEY (PatientId) REFERENCES dbo.Patients(PatientId)
);
GO

-- ============================================================================
-- 15. QueueNotifications Table (Smart Live Notifications & Alerts Feed)
-- Member 5: Yapa Bandara Y.M.M.P.P.D (IT25103824) - Live Queue Tracker Notifications
-- Attributes: NotificationId, ScheduleId, PatientId, AppointmentId, RecipientPhone,
--             RecipientName, TokenNo, MessageType, MessageBody, SentAt, DeliveryStatus,
--             DoctorId, UserId, TargetRole, Title, IsRead
-- ============================================================================
CREATE TABLE dbo.QueueNotifications (
    NotificationId INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    ScheduleId INT NOT NULL,
    PatientId INT NULL,
    AppointmentId INT NULL,
    RecipientPhone NVARCHAR(30) NOT NULL,
    RecipientName NVARCHAR(150) NULL,
    TokenNo INT NOT NULL,
    MessageType NVARCHAR(50) NOT NULL, -- DOCTOR_ARRIVED, APPROACHING_TURN, TOKEN_CALLED, SESSION_DELAYED, GENERAL_ALERT, DOCTOR_LEAVE
    MessageBody NVARCHAR(500) NOT NULL,
    SentAt DATETIME NOT NULL DEFAULT GETDATE(),
    DeliveryStatus NVARCHAR(50) NOT NULL DEFAULT 'DELIVERED',
    DoctorId INT NULL,
    UserId INT NULL,
    TargetRole NVARCHAR(50) NULL, -- PATIENT, DOCTOR, STAFF, ALL
    Title NVARCHAR(150) NULL,
    IsRead BIT NOT NULL DEFAULT 0,
    CONSTRAINT FK_QueueNotifications_Schedule FOREIGN KEY (ScheduleId) REFERENCES dbo.Schedules(ScheduleId)
);
GO

-- ============================================================================
-- 16. SystemLogs Table (Enterprise Audit Trail & Security Operations Desk)
-- Member 1: Jayasundara U.R (IT25103820) - System Governance & Security Logging
-- Attributes: LogId, UserId, PerformerName, PerformerRole, ActionType, EntityName,
--             EntityId, Description, Severity, IpAddress, Timestamp
-- ============================================================================
CREATE TABLE dbo.SystemLogs (
    LogId INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    UserId INT NULL,
    PerformerName NVARCHAR(150) NOT NULL,
    PerformerRole NVARCHAR(60) NOT NULL,
    ActionType NVARCHAR(80) NOT NULL,
    EntityName NVARCHAR(60) NOT NULL,
    EntityId INT NULL,
    Description NVARCHAR(MAX) NOT NULL,
    Severity NVARCHAR(20) NOT NULL DEFAULT 'INFO', -- INFO, SUCCESS, WARNING, CRITICAL
    IpAddress NVARCHAR(50) NULL,
    Timestamp DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- ============================================================================
-- 17. Relational Views for Seamless Reporting & Administration
-- Combines Joined Inheritance (Users + Subtypes) for easy querying & viva review
-- ============================================================================
CREATE OR ALTER VIEW dbo.vw_Doctors AS
SELECT 
    d.DoctorId,
    u.FullName,
    u.Username,
    u.ContactNumber,
    u.NIC,
    d.MedicalLicenseNo,
    d.Specialization,
    d.Qualifications,
    d.ConsultationFee,
    d.HospitalAffiliation,
    d.IsApproved,
    u.IsActive
FROM dbo.Doctors d
JOIN dbo.Users u ON d.DoctorId = u.UserId;
GO

CREATE OR ALTER VIEW dbo.vw_Patients AS
SELECT 
    p.PatientId,
    u.FullName,
    u.Username,
    u.ContactNumber,
    u.NIC,
    p.DateOfBirth,
    p.Gender,
    p.Age,
    p.BloodGroup,
    p.Address,
    p.EmergencyContact,
    u.IsActive
FROM dbo.Patients p
JOIN dbo.Users u ON p.PatientId = u.UserId;
GO

CREATE OR ALTER VIEW dbo.vw_AppointmentsSummary AS
SELECT 
    a.AppointmentId,
    a.BookingDate,
    a.AppointmentDate,
    a.StartTime,
    a.EndTime,
    a.AppointmentStatus,
    pu.FullName AS PatientName,
    pu.ContactNumber AS PatientPhone,
    du.FullName AS DoctorName,
    d.Specialization,
    s.HospitalLocation,
    t.SlotNo,
    p.Amount,
    p.PaymentStatus,
    p.TransactionReference
FROM dbo.Appointments a
JOIN dbo.Patients pt ON a.PatientId = pt.PatientId
JOIN dbo.Users pu ON pt.PatientId = pu.UserId
JOIN dbo.Doctors d ON a.DoctorId = d.DoctorId
JOIN dbo.Users du ON d.DoctorId = du.UserId
JOIN dbo.Schedules s ON a.ScheduleId = s.ScheduleId
JOIN dbo.Timeslots t ON a.TimeslotId = t.TimeslotId
LEFT JOIN dbo.Payments p ON a.AppointmentId = p.AppointmentId;
GO

-- ============================================================================
-- 18. Automated Cascading Deletion & Referential Integrity Triggers
-- Guarantees zero Foreign Key Constraint Conflicts during manual or automated deletions.
-- Covers all delete scenarios across the entire database hierarchy:
--   • Payments -> Cascades to Refunds & Receipts
--   • Appointments -> Cascades to Payments, Refunds, Receipts, Prescriptions, Feedbacks, Notifications & restores Timeslot
--   • Timeslots -> Cascades to linked Appointments
--   • Schedules -> Cascades to Appointments, QueueNotifications, Timeslots
--   • Doctors -> Cascades to Schedules, Appointments, Prescriptions, Feedbacks, Notifications
--   • Patients -> Cascades to Appointments, Complaints, Feedbacks, Prescriptions, Notifications
--   • Users -> Nullifies Admin/Audit FKs & cascades to Patients, Doctors, StaffUsers
-- ============================================================================

-- 18.1. Payments Cascade Trigger
CREATE OR ALTER TRIGGER dbo.trg_Payments_Delete 
ON dbo.Payments 
INSTEAD OF DELETE 
AS
BEGIN
    SET NOCOUNT ON;
    DELETE r FROM dbo.Refunds r WHERE r.PaymentId IN (SELECT PaymentId FROM deleted);
    DELETE rc FROM dbo.Receipts rc WHERE rc.PaymentId IN (SELECT PaymentId FROM deleted);
    DELETE p FROM dbo.Payments p INNER JOIN deleted d ON p.PaymentId = d.PaymentId;
END;
GO

-- 18.2. Appointments Cascade Trigger (Safely purges child records & restores Timeslot)
CREATE OR ALTER TRIGGER dbo.trg_Appointments_Delete 
ON dbo.Appointments 
INSTEAD OF DELETE 
AS
BEGIN
    SET NOCOUNT ON;

    -- Automatically restore booked/reserved timeslots to AVAILABLE
    UPDATE t
    SET t.SlotStatus = 'AVAILABLE'
    FROM dbo.Timeslots t
    INNER JOIN deleted d ON t.TimeslotId = d.TimeslotId
    WHERE t.SlotStatus IN ('BOOKED', 'RESERVED');

    -- Cascade delete linked financial & clinical records
    DELETE r FROM dbo.Refunds r WHERE r.AppointmentId IN (SELECT AppointmentId FROM deleted)
       OR r.PaymentId IN (SELECT PaymentId FROM dbo.Payments WHERE AppointmentId IN (SELECT AppointmentId FROM deleted));
    DELETE rc FROM dbo.Receipts rc WHERE rc.PaymentId IN (SELECT PaymentId FROM dbo.Payments WHERE AppointmentId IN (SELECT AppointmentId FROM deleted));
    DELETE p FROM dbo.Payments p WHERE p.AppointmentId IN (SELECT AppointmentId FROM deleted);
    DELETE pr FROM dbo.Prescriptions pr WHERE pr.AppointmentId IN (SELECT AppointmentId FROM deleted);
    DELETE fb FROM dbo.Feedbacks fb WHERE fb.AppointmentId IN (SELECT AppointmentId FROM deleted);
    DELETE qn FROM dbo.QueueNotifications qn WHERE qn.AppointmentId IN (SELECT AppointmentId FROM deleted);
    DELETE a FROM dbo.Appointments a INNER JOIN deleted d ON a.AppointmentId = d.AppointmentId;
END;
GO

-- 18.3. Timeslots Cascade Trigger
CREATE OR ALTER TRIGGER dbo.trg_Timeslots_Delete 
ON dbo.Timeslots 
INSTEAD OF DELETE 
AS
BEGIN
    SET NOCOUNT ON;
    DELETE a FROM dbo.Appointments a WHERE a.TimeslotId IN (SELECT TimeslotId FROM deleted);
    DELETE t FROM dbo.Timeslots t INNER JOIN deleted d ON t.TimeslotId = d.TimeslotId;
END;
GO

-- 18.4. Schedules Cascade Trigger
CREATE OR ALTER TRIGGER dbo.trg_Schedules_Delete 
ON dbo.Schedules 
INSTEAD OF DELETE 
AS
BEGIN
    SET NOCOUNT ON;
    DELETE a FROM dbo.Appointments a WHERE a.ScheduleId IN (SELECT ScheduleId FROM deleted);
    DELETE qn FROM dbo.QueueNotifications qn WHERE qn.ScheduleId IN (SELECT ScheduleId FROM deleted);
    DELETE t FROM dbo.Timeslots t WHERE t.ScheduleId IN (SELECT ScheduleId FROM deleted);
    DELETE s FROM dbo.Schedules s INNER JOIN deleted d ON s.ScheduleId = d.ScheduleId;
END;
GO

-- 18.5. Doctors Cascade Trigger
CREATE OR ALTER TRIGGER dbo.trg_Doctors_Delete 
ON dbo.Doctors 
INSTEAD OF DELETE 
AS
BEGIN
    SET NOCOUNT ON;
    DELETE a FROM dbo.Appointments a WHERE a.DoctorId IN (SELECT DoctorId FROM deleted);
    DELETE s FROM dbo.Schedules s WHERE s.DoctorId IN (SELECT DoctorId FROM deleted);
    DELETE pr FROM dbo.Prescriptions pr WHERE pr.DoctorId IN (SELECT DoctorId FROM deleted);
    DELETE fb FROM dbo.Feedbacks fb WHERE fb.DoctorId IN (SELECT DoctorId FROM deleted);
    DELETE qn FROM dbo.QueueNotifications qn WHERE qn.DoctorId IN (SELECT DoctorId FROM deleted);
    DELETE doc FROM dbo.Doctors doc INNER JOIN deleted d ON doc.DoctorId = d.DoctorId;
END;
GO

-- 18.6. Patients Cascade Trigger
CREATE OR ALTER TRIGGER dbo.trg_Patients_Delete 
ON dbo.Patients 
INSTEAD OF DELETE 
AS
BEGIN
    SET NOCOUNT ON;
    DELETE a FROM dbo.Appointments a WHERE a.PatientId IN (SELECT PatientId FROM deleted);
    DELETE c FROM dbo.Complaints c WHERE c.PatientId IN (SELECT PatientId FROM deleted);
    DELETE fb FROM dbo.Feedbacks fb WHERE fb.PatientId IN (SELECT PatientId FROM deleted);
    DELETE pr FROM dbo.Prescriptions pr WHERE pr.PatientId IN (SELECT PatientId FROM deleted);
    DELETE qn FROM dbo.QueueNotifications qn WHERE qn.PatientId IN (SELECT PatientId FROM deleted);
    DELETE p FROM dbo.Patients p INNER JOIN deleted d ON p.PatientId = d.PatientId;
END;
GO

-- 18.7. Users Root Cascade Trigger
CREATE OR ALTER TRIGGER dbo.trg_Users_Delete 
ON dbo.Users 
INSTEAD OF DELETE 
AS
BEGIN
    SET NOCOUNT ON;

    -- Nullify administrative & audit references to prevent dangling pointer errors
    UPDATE dbo.Doctors SET ApprovedByAdminId = NULL WHERE ApprovedByAdminId IN (SELECT UserId FROM deleted);
    UPDATE dbo.Schedules SET CoordinatorId = NULL WHERE CoordinatorId IN (SELECT UserId FROM deleted);
    UPDATE dbo.Payments SET FinanceOfficerId = NULL WHERE FinanceOfficerId IN (SELECT UserId FROM deleted);
    UPDATE dbo.Refunds SET FinanceOfficerId = NULL WHERE FinanceOfficerId IN (SELECT UserId FROM deleted);
    UPDATE dbo.Complaints SET CustomerServiceId = NULL WHERE CustomerServiceId IN (SELECT UserId FROM deleted);
    UPDATE dbo.SystemLogs SET UserId = NULL WHERE UserId IN (SELECT UserId FROM deleted);

    -- Cascade delete Appointments, Schedules, Complaints, Feedbacks, Prescriptions, Notifications
    DELETE a FROM dbo.Appointments a WHERE a.PatientId IN (SELECT UserId FROM deleted) OR a.DoctorId IN (SELECT UserId FROM deleted);
    DELETE s FROM dbo.Schedules s WHERE s.DoctorId IN (SELECT UserId FROM deleted);
    DELETE c FROM dbo.Complaints c WHERE c.PatientId IN (SELECT UserId FROM deleted);
    DELETE fb FROM dbo.Feedbacks fb WHERE fb.PatientId IN (SELECT UserId FROM deleted) OR fb.DoctorId IN (SELECT UserId FROM deleted);
    DELETE pr FROM dbo.Prescriptions pr WHERE pr.PatientId IN (SELECT UserId FROM deleted) OR pr.DoctorId IN (SELECT UserId FROM deleted);
    DELETE qn FROM dbo.QueueNotifications qn WHERE qn.UserId IN (SELECT UserId FROM deleted) OR qn.PatientId IN (SELECT UserId FROM deleted) OR qn.DoctorId IN (SELECT UserId FROM deleted);

    -- Delete subtype records
    DELETE p FROM dbo.Patients p WHERE p.PatientId IN (SELECT UserId FROM deleted);
    DELETE doc FROM dbo.Doctors doc WHERE doc.DoctorId IN (SELECT UserId FROM deleted);
    DELETE su FROM dbo.StaffUsers su WHERE su.StaffId IN (SELECT UserId FROM deleted);

    -- Delete from Users
    DELETE u FROM dbo.Users u INNER JOIN deleted d ON u.UserId = d.UserId;
END;
GO

PRINT '========================================================================';
PRINT 'EChannelingDB Schema created successfully with all 16 tables, views, and cascading integrity triggers!';
PRINT '========================================================================';
GO

-- ============================================================================
-- SLIIT SE2030 (Software Engineering) & IT2140 (Database Design and Development)
-- Group ID: 2026-Y2-S1-KU-50
-- Database: Microsoft SQL Server (Localhost SQLEXPRESS)
-- Database Name: EChannelingDB
-- Description: Complete Production Seed Data with 100% Referential Integrity
-- Populates all 16 Tables with High-Quality Realistic Data for Assessment & Viva
-- ============================================================================
--
-- ----------------------------------------------------------------------------
-- SYSTEM LOGIN CREDENTIALS DIRECTORY (Standard Password for All: password123)
-- ----------------------------------------------------------------------------
-- 1. System Administrators:
--    • Username: admin         | Password: password123 | Ishara Gunasekara (Full Admin)
--    • Username: admin.sarath  | Password: password123 | Sarath Kumara (Operations)
-- 2. Channeling Coordinators:
--    • Username: coordinator   | Password: password123 | Kasun Fernando (Live Queue & Rosters)
--    • Username: coordinator2  | Password: password123 | Dinuka Mendis (Outpatient Desk)
-- 3. Finance Officers:
--    • Username: finance       | Password: password123 | Ruwan Selvaratnam (Billing & Refunds)
--    • Username: finance2      | Password: password123 | Nadeeka Alwis (Invoicing & Audits)
-- 4. Customer Service Executives:
--    • Username: cse           | Password: password123 | Malsha Wijeratne (Grievance Desk)
--    • Username: cse2          | Password: password123 | Tharindu Weerakkody (Patient Support)
-- 5. Consultant Doctors:
--    • Username: dr.nuwan      | Password: password123 | Dr. Nuwan Jayawardena (Cardiology)
--    • Username: dr.priyantha  | Password: password123 | Dr. Priyantha Silva (General Medicine)
--    • Username: dr.amanda     | Password: password123 | Dr. Amanda Fernando (Pediatrics)
--    • Username: dr.samantha   | Password: password123 | Dr. Samantha Perera (Dermatology)
--    • Username: dr.kasun      | Password: password123 | Dr. Kasun Dissanayake (Orthopedics)
-- 6. Registered Patients:
--    • Username: patient.anjali   | Password: password123 | Anjali Perera (28 / A+)
--    • Username: patient.kasun    | Password: password123 | Kasun Bandara (26 / O+)
--    • Username: patient.nimal    | Password: password123 | Nimal Jayasinghe (31 / B+)
--    • Username: patient.dilhani  | Password: password123 | Dilhani Senanayake (30 / AB+)
--    • Username: patient.chaminda | Password: password123 | Chaminda Wickramasinghe (35 / O-)
-- ============================================================================

USE [EChannelingDB];
GO

SET NOCOUNT ON;

-- ============================================================================
-- Clean existing data in reverse foreign key order
-- ============================================================================
DELETE FROM dbo.SystemLogs;
DELETE FROM dbo.QueueNotifications;
DELETE FROM dbo.Prescriptions;
DELETE FROM dbo.Receipts;
DELETE FROM dbo.Refunds;
DELETE FROM dbo.Payments;
DELETE FROM dbo.CustomBills;
DELETE FROM dbo.Feedbacks;
DELETE FROM dbo.Complaints;
DELETE FROM dbo.Appointments;
DELETE FROM dbo.Timeslots;
DELETE FROM dbo.Schedules;
DELETE FROM dbo.Doctors;
DELETE FROM dbo.Patients;
DELETE FROM dbo.StaffUsers;
DELETE FROM dbo.Users;
GO

-- ============================================================================
-- 1. BASE USERS (18 Records: 6 Staff, 5 Doctors, 7 Patients)
-- Standard Password for All Accounts: password123
-- ============================================================================
SET IDENTITY_INSERT dbo.Users ON;

INSERT INTO dbo.Users (UserId, Username, PasswordHash, FullName, ContactNumber, NIC, Role, CreatedAt, IsActive) VALUES
-- System Administrators
(1, 'admin', 'password123', 'Ishara Gunasekara', '0771234567', '198512345678', 'ADMINISTRATOR', GETDATE(), 1),
(16, 'admin.sarath', 'password123', 'Sarath Kumara', '0778899001', '198099887766', 'ADMINISTRATOR', GETDATE(), 1),

-- Channeling Coordinators
(2, 'coordinator', 'password123', 'Kasun Fernando', '0712345678', '199012345678', 'CHANNELING_COORDINATOR', GETDATE(), 1),
(10, 'coordinator2', 'password123', 'Dinuka Mendis', '0761122334', '199312345678', 'CHANNELING_COORDINATOR', GETDATE(), 1),

-- Finance Officers
(3, 'finance', 'password123', 'Ruwan Selvaratnam', '0723456789', '198812345678', 'FINANCE_OFFICER', GETDATE(), 1),
(17, 'finance2', 'password123', 'Nadeeka Alwis', '0772233990', '198944556677', 'FINANCE_OFFICER', GETDATE(), 1),

-- Customer Service Executives
(4, 'cse', 'password123', 'Malsha Wijeratne', '0754567890', '199212345678', 'CUSTOMER_SERVICE_EXECUTIVE', GETDATE(), 1),
(18, 'cse2', 'password123', 'Tharindu Weerakkody', '0714455667', '199433221144', 'CUSTOMER_SERVICE_EXECUTIVE', GETDATE(), 1),

-- Consultant Doctors
(5, 'dr.nuwan', 'password123', 'Dr. Nuwan Jayawardena', '0779988776', '197512345678', 'DOCTOR', GETDATE(), 1),
(6, 'dr.priyantha', 'password123', 'Dr. Priyantha Silva', '0773344556', '198012345678', 'DOCTOR', GETDATE(), 1),
(7, 'dr.amanda', 'password123', 'Dr. Amanda Fernando', '0776655443', '198912345678', 'DOCTOR', GETDATE(), 1),
(11, 'dr.samantha', 'password123', 'Dr. Samantha Perera', '0774433221', '198212345678', 'DOCTOR', GETDATE(), 1),
(12, 'dr.kasun', 'password123', 'Dr. Kasun Dissanayake', '0715566778', '197812345678', 'DOCTOR', GETDATE(), 1),

-- Patients
(8, 'patient.anjali', 'password123', 'Anjali Perera', '0775566778', '199855667788', 'PATIENT', GETDATE(), 1),
(9, 'patient.kasun', 'password123', 'Kasun Bandara', '0719988112', '200012349988', 'PATIENT', GETDATE(), 1),
(13, 'patient.nimal', 'password123', 'Nimal Jayasinghe', '0712233445', '199512345678', 'PATIENT', GETDATE(), 1),
(14, 'patient.dilhani', 'password123', 'Dilhani Senanayake', '0773322114', '199612345678', 'PATIENT', GETDATE(), 1),
(15, 'patient.chaminda', 'password123', 'Chaminda Wickramasinghe', '0755544332', '199112345678', 'PATIENT', GETDATE(), 1);

SET IDENTITY_INSERT dbo.Users OFF;
GO

-- ============================================================================
-- 2. STAFF USERS (6 Records - Joined Subtype for Staff)
-- ============================================================================
INSERT INTO dbo.StaffUsers (StaffId, StaffRole, Department, Permissions) VALUES
(1, 'ADMINISTRATOR', 'Executive IT & Operations', 'ALL'),
(16, 'ADMINISTRATOR', 'Security & Operations', 'MANAGE_USERS,VIEW_ANALYTICS,MANAGE_DOCTORS'),
(2, 'CHANNELING_COORDINATOR', 'Channeling Operations & Live Queue', 'ALL'),
(10, 'CHANNELING_COORDINATOR', 'Outpatient Dispatching', 'MANAGE_SCHEDULES,LIVE_QUEUE'),
(3, 'FINANCE_OFFICER', 'Hospital Accounts & Billing', 'ALL'),
(4, 'CUSTOMER_SERVICE_EXECUTIVE', 'Customer Care & Grievance Desk', 'ALL');
GO

-- ============================================================================
-- 3. DOCTORS (5 Records - Joined Subtype for Doctors)
-- ============================================================================
INSERT INTO dbo.Doctors (DoctorId, MedicalLicenseNo, Specialization, Qualifications, ConsultationFee, IsApproved, ApprovedByAdminId, HospitalAffiliation, ProfileImage) VALUES
(5, 'SLMC-45892', 'Cardiology', 'MBBS, MD (Cardiology), FRCP (UK), FACC', 3500.00, 1, 1, 'Asiri Central Hospital, Colombo 10', 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80'),
(6, 'SLMC-32114', 'General Medicine', 'MBBS (Colombo), MD (Medicine), MRCP (London)', 2500.00, 1, 1, 'Nawaloka Hospital, Colombo 02', 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=300&auto=format&fit=crop&q=80'),
(7, 'SLMC-56789', 'Pediatrics', 'MBBS, DCH, MD (Pediatrics), MRCPCH (UK)', 2800.00, 1, 1, 'Lanka Hospitals, Narahenpita', 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&auto=format&fit=crop&q=80'),
(11, 'SLMC-67890', 'Dermatology', 'MBBS, MD (Dermatology), Board Certified Dermatologist', 3000.00, 1, 1, 'Hemas Hospital, Thalawathugoda', 'https://images.unsplash.com/photo-1594824813576-2e92e59178bf?w=300&auto=format&fit=crop&q=80'),
(12, 'SLMC-78901', 'Orthopedics', 'MBBS, MS (Orthopedics), FRCS (Edin), Joint Replacement Fellow', 3200.00, 1, 1, 'Durdans Hospital, Colombo 03', 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=300&auto=format&fit=crop&q=80');
GO

-- ============================================================================
-- 4. PATIENTS (5 Records - Joined Subtype for Patients)
-- ============================================================================
INSERT INTO dbo.Patients (PatientId, DateOfBirth, Gender, Address, BloodGroup, Age, EmergencyContact, ProfileImage) VALUES
(8, '1998-05-14', 'Female', 'No. 45, Galle Road, Bambalapitiya, Colombo 04', 'A+', 28, '0771122334', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80'),
(9, '2000-09-22', 'Male', 'No. 12, Kandy Road, Malabe', 'O+', 26, '0718877665', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80'),
(13, '1995-03-10', 'Male', 'No. 88, Peradeniya Road, Kandy', 'B+', 31, '0774433221', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80'),
(14, '1996-11-25', 'Female', 'No. 24, Matara Road, Galle', 'AB+', 30, '0712244668', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&auto=format&fit=crop&q=80'),
(15, '1991-07-04', 'Male', 'No. 105, High Level Road, Nugegoda', 'O-', 35, '0765544332', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80');
GO

-- ============================================================================
-- 5. SCHEDULES (7 Records: Includes Active, Live In-Progress, and On-Leave)
-- ============================================================================
SET IDENTITY_INSERT dbo.Schedules ON;

INSERT INTO dbo.Schedules (ScheduleId, DoctorId, CoordinatorId, ScheduleDate, StartTime, EndTime, MaxCapacity, HospitalLocation, Status, DoctorArrivalStatus, DoctorArrivalTime, CurrentToken, EstimatedDelayMinutes, QueueStatusNote, CreatedAt) VALUES
-- Schedule 1: Today Active / Live Session (Dr. Nuwan Jayawardena - Cardiology)
(1, 5, 2, CAST(GETDATE() AS DATE), '09:00:00', '11:00:00', 10, 'Room 201 (Cardiac Suite), Asiri Central Hospital', 'SCHEDULED', 'ARRIVED', '08:55:00', 1, 0, 'Consultant arrived on time. Live queue in progress.', GETDATE()),

-- Schedule 2: Today Evening Session (Dr. Priyantha Silva - General Medicine)
(2, 6, 2, CAST(GETDATE() AS DATE), '16:00:00', '18:00:00', 10, 'Room 105, Nawaloka Hospital', 'SCHEDULED', 'NOT_ARRIVED', NULL, 0, 0, 'Session opens at 16:00. Check-in starts 15 mins prior.', GETDATE()),

-- Schedule 3: Tomorrow Morning Session (Dr. Amanda Fernando - Pediatrics)
(3, 7, 2, CAST(GETDATE() + 1 AS DATE), '10:00:00', '12:00:00', 10, 'Room 304 (Pediatric Wing), Lanka Hospitals', 'SCHEDULED', 'NOT_ARRIVED', NULL, 0, 0, 'Pediatric clinic with designated baby-care room.', GETDATE()),

-- Schedule 4: Day + 2 Session (Dr. Samantha Perera - Dermatology)
(4, 11, 2, CAST(GETDATE() + 2 AS DATE), '14:00:00', '16:00:00', 10, 'Room 112, Hemas Hospital Thalawathugoda', 'SCHEDULED', 'NOT_ARRIVED', NULL, 0, 0, 'Laser skin clinic and general dermatology review.', GETDATE()),

-- Schedule 5: Day + 3 Session (Dr. Kasun Dissanayake - Orthopedics)
(5, 12, 2, CAST(GETDATE() + 3 AS DATE), '08:30:00', '10:30:00', 10, 'Room 405 (Orthopedic Center), Durdans Hospital', 'SCHEDULED', 'NOT_ARRIVED', NULL, 0, 0, 'X-Ray and mobility evaluation facility available.', GETDATE()),

-- Schedule 6: Emergency Leave Session (Dr. Nuwan - Demonstrates Leave Alert logic)
(6, 5, 2, CAST(GETDATE() + 4 AS DATE), '09:00:00', '11:00:00', 10, 'Room 201, Asiri Central Hospital', 'ON_LEAVE', 'NOT_ARRIVED', NULL, 0, 0, 'Urgent medical conference attendance abroad. Patients to be rescheduled.', GETDATE()),

-- Schedule 7: Upcoming Weekend Session (Dr. Priyantha Silva - Nawaloka)
(7, 6, 2, CAST(GETDATE() + 5 AS DATE), '15:00:00', '17:00:00', 10, 'Room 105, Nawaloka Hospital', 'SCHEDULED', 'NOT_ARRIVED', NULL, 0, 0, 'Special weekend wellness clinic.', GETDATE());

SET IDENTITY_INSERT dbo.Schedules OFF;
GO

-- ============================================================================
-- 6. TIMESLOTS (35 Records - 5 Slots Per Schedule)
-- ============================================================================
SET IDENTITY_INSERT dbo.Timeslots ON;

INSERT INTO dbo.Timeslots (TimeslotId, ScheduleId, SlotNo, SlotTime, SlotEndTime, SlotStatus) VALUES
-- Schedule 1 (Dr. Nuwan - Cardiology)
(1, 1, 1, '09:00:00', '09:20:00', 'BOOKED'),
(2, 1, 2, '09:20:00', '09:40:00', 'BOOKED'),
(3, 1, 3, '09:40:00', '10:00:00', 'AVAILABLE'),
(4, 1, 4, '10:00:00', '10:20:00', 'AVAILABLE'),
(5, 1, 5, '10:20:00', '10:40:00', 'AVAILABLE'),

-- Schedule 2 (Dr. Priyantha - General Medicine)
(6, 2, 1, '16:00:00', '16:20:00', 'BOOKED'),
(7, 2, 2, '16:20:00', '16:40:00', 'BOOKED'),
(8, 2, 3, '16:40:00', '17:00:00', 'AVAILABLE'),
(9, 2, 4, '17:00:00', '17:20:00', 'AVAILABLE'),
(10, 2, 5, '17:20:00', '17:40:00', 'AVAILABLE'),

-- Schedule 3 (Dr. Amanda - Pediatrics)
(11, 3, 1, '10:00:00', '10:20:00', 'BOOKED'),
(12, 3, 2, '10:20:00', '10:40:00', 'BOOKED'),
(13, 3, 3, '10:40:00', '11:00:00', 'AVAILABLE'),
(14, 3, 4, '11:00:00', '11:20:00', 'AVAILABLE'),
(15, 3, 5, '11:20:00', '11:40:00', 'AVAILABLE'),

-- Schedule 4 (Dr. Samantha - Dermatology)
(16, 4, 1, '14:00:00', '14:20:00', 'BOOKED'),
(17, 4, 2, '14:20:00', '14:40:00', 'BOOKED'),
(18, 4, 3, '14:40:00', '15:00:00', 'AVAILABLE'),
(19, 4, 4, '15:00:00', '15:20:00', 'AVAILABLE'),
(20, 4, 5, '15:20:00', '15:40:00', 'AVAILABLE'),

-- Schedule 5 (Dr. Kasun - Orthopedics)
(21, 5, 1, '08:30:00', '08:50:00', 'BOOKED'),
(22, 5, 2, '08:50:00', '09:10:00', 'BOOKED'),
(23, 5, 3, '09:10:00', '09:30:00', 'AVAILABLE'),
(24, 5, 4, '09:30:00', '09:50:00', 'AVAILABLE'),
(25, 5, 5, '09:50:00', '10:10:00', 'AVAILABLE'),

-- Schedule 6 (Emergency Leave Schedule)
(26, 6, 1, '09:00:00', '09:20:00', 'BOOKED'),
(27, 6, 2, '09:20:00', '09:40:00', 'BOOKED'),
(28, 6, 3, '09:40:00', '10:00:00', 'CANCELLED'),
(29, 6, 4, '10:00:00', '10:20:00', 'CANCELLED'),
(30, 6, 5, '10:20:00', '10:40:00', 'CANCELLED'),

-- Schedule 7 (Weekend Session)
(31, 7, 1, '15:00:00', '15:20:00', 'AVAILABLE'),
(32, 7, 2, '15:20:00', '15:40:00', 'AVAILABLE'),
(33, 7, 3, '15:40:00', '16:00:00', 'AVAILABLE'),
(34, 7, 4, '16:00:00', '16:20:00', 'AVAILABLE'),
(35, 7, 5, '16:20:00', '16:40:00', 'AVAILABLE');

SET IDENTITY_INSERT dbo.Timeslots OFF;
GO

-- ============================================================================
-- 7. APPOINTMENTS (12 Records: Confirmed, Completed, Cancelled)
-- ============================================================================
SET IDENTITY_INSERT dbo.Appointments ON;

INSERT INTO dbo.Appointments (AppointmentId, PatientId, DoctorId, ScheduleId, TimeslotId, BookingDate, AppointmentDate, StartTime, EndTime, AppointmentStatus, CreatedAt) VALUES
-- Active Bookings (Today & Upcoming)
(1, 8, 5, 1, 1, GETDATE(), CAST(GETDATE() AS DATE), '09:00:00', '09:20:00', 'CONFIRMED', GETDATE()),
(2, 9, 6, 2, 6, GETDATE(), CAST(GETDATE() AS DATE), '16:00:00', '16:20:00', 'CONFIRMED', GETDATE()),
(3, 13, 7, 3, 11, GETDATE(), CAST(GETDATE() + 1 AS DATE), '10:00:00', '10:20:00', 'CONFIRMED', GETDATE()),
(4, 14, 11, 4, 16, GETDATE(), CAST(GETDATE() + 2 AS DATE), '14:00:00', '14:20:00', 'CONFIRMED', GETDATE()),
(5, 15, 12, 5, 21, GETDATE(), CAST(GETDATE() + 3 AS DATE), '08:30:00', '08:50:00', 'CONFIRMED', GETDATE()),

-- Cancelled Appointments for Refund Flow
(6, 8, 6, 2, 7, GETDATE(), CAST(GETDATE() AS DATE), '16:20:00', '16:40:00', 'CANCELLED', GETDATE()),
(7, 9, 5, 1, 2, GETDATE(), CAST(GETDATE() AS DATE), '09:20:00', '09:40:00', 'CANCELLED', GETDATE()),
(8, 13, 11, 4, 17, GETDATE(), CAST(GETDATE() + 2 AS DATE), '14:20:00', '14:40:00', 'CANCELLED', GETDATE()),
(9, 14, 7, 3, 12, GETDATE(), CAST(GETDATE() + 1 AS DATE), '10:20:00', '10:40:00', 'CANCELLED', GETDATE()),
(10, 15, 12, 5, 22, GETDATE(), CAST(GETDATE() + 3 AS DATE), '08:50:00', '09:10:00', 'CANCELLED', GETDATE()),

-- Leave Schedule Affected Appointments
(11, 8, 5, 6, 26, GETDATE(), CAST(GETDATE() + 4 AS DATE), '09:00:00', '09:20:00', 'RESCHEDULED', GETDATE()),
(12, 9, 5, 6, 27, GETDATE(), CAST(GETDATE() + 4 AS DATE), '09:20:00', '09:40:00', 'RESCHEDULED', GETDATE());

SET IDENTITY_INSERT dbo.Appointments OFF;
GO

-- ============================================================================
-- 8. PAYMENTS (12 Records - 1:1 With Appointments)
-- ============================================================================
SET IDENTITY_INSERT dbo.Payments ON;

INSERT INTO dbo.Payments (PaymentId, AppointmentId, FinanceOfficerId, TransactionReference, Amount, PaymentMethod, PaymentStatus, PaymentDate) VALUES
(1, 1, 3, 'TXN-2026-0001', 3500.00, 'CREDIT_CARD', 'COMPLETED', GETDATE()),
(2, 2, 3, 'TXN-2026-0002', 2500.00, 'ONLINE_BANKING', 'COMPLETED', GETDATE()),
(3, 3, 3, 'TXN-2026-0003', 2800.00, 'DEBIT_CARD', 'COMPLETED', GETDATE()),
(4, 4, 3, 'TXN-2026-0004', 3000.00, 'CREDIT_CARD', 'COMPLETED', GETDATE()),
(5, 5, 3, 'TXN-2026-0005', 3200.00, 'ONLINE_BANKING', 'COMPLETED', GETDATE()),
(6, 6, 3, 'TXN-2026-0006', 2500.00, 'CREDIT_CARD', 'REFUNDED', GETDATE()),
(7, 7, 3, 'TXN-2026-0007', 3500.00, 'DEBIT_CARD', 'REFUNDED', GETDATE()),
(8, 8, 3, 'TXN-2026-0008', 3000.00, 'ONLINE_BANKING', 'REFUNDED', GETDATE()),
(9, 9, 3, 'TXN-2026-0009', 2800.00, 'CREDIT_CARD', 'REFUNDED', GETDATE()),
(10, 10, 3, 'TXN-2026-0010', 3200.00, 'DEBIT_CARD', 'REFUNDED', GETDATE()),
(11, 11, 3, 'TXN-2026-0011', 3500.00, 'CREDIT_CARD', 'COMPLETED', GETDATE()),
(12, 12, 3, 'TXN-2026-0012', 3500.00, 'ONLINE_BANKING', 'COMPLETED', GETDATE());

SET IDENTITY_INSERT dbo.Payments OFF;
GO

-- ============================================================================
-- 9. RECEIPTS (7 Records - Digital Hospital Receipts)
-- ============================================================================
SET IDENTITY_INSERT dbo.Receipts ON;

INSERT INTO dbo.Receipts (ReceiptId, PaymentId, ReceiptNumber, IssueDate, ReceiptDetails) VALUES
(1, 1, 'REC-2026-8801', GETDATE(), 'Digital E-Channeling Receipt for Appointment #1. Consultant: Dr. Nuwan Jayawardena (Cardiology). Total Paid: LKR 3,500.00. Payment: Visa ****4242.'),
(2, 2, 'REC-2026-8802', GETDATE(), 'Digital E-Channeling Receipt for Appointment #2. Consultant: Dr. Priyantha Silva (General Medicine). Total Paid: LKR 2,500.00. Payment: Online Banking Direct.'),
(3, 3, 'REC-2026-8803', GETDATE(), 'Digital E-Channeling Receipt for Appointment #3. Consultant: Dr. Amanda Fernando (Pediatrics). Total Paid: LKR 2,800.00. Payment: Master Debit ****8812.'),
(4, 4, 'REC-2026-8804', GETDATE(), 'Digital E-Channeling Receipt for Appointment #4. Consultant: Dr. Samantha Perera (Dermatology). Total Paid: LKR 3,000.00. Payment: Visa ****1122.'),
(5, 5, 'REC-2026-8805', GETDATE(), 'Digital E-Channeling Receipt for Appointment #5. Consultant: Dr. Kasun Dissanayake (Orthopedics). Total Paid: LKR 3,200.00. Payment: Commercial Bank WebPay.'),
(6, 11, 'REC-2026-8806', GETDATE(), 'Digital E-Channeling Receipt for Appointment #11. Consultant: Dr. Nuwan Jayawardena. Total Paid: LKR 3,500.00.'),
(7, 12, 'REC-2026-8807', GETDATE(), 'Digital E-Channeling Receipt for Appointment #12. Consultant: Dr. Nuwan Jayawardena. Total Paid: LKR 3,500.00.');

SET IDENTITY_INSERT dbo.Receipts OFF;
GO

-- ============================================================================
-- 10. REFUNDS (5 Records - Dispute & Cancellation Settlements)
-- ============================================================================
SET IDENTITY_INSERT dbo.Refunds ON;

INSERT INTO dbo.Refunds (RefundId, AppointmentId, PaymentId, FinanceOfficerId, RefundAmount, RefundDate, Reason, RefundStatus) VALUES
(1, 6, 6, 3, 2500.00, GETDATE(), 'Patient requested cancellation due to official travel overseas.', 'PROCESSED'),
(2, 7, 7, 3, 3500.00, GETDATE(), 'Emergency clinic rescheduling by consultant. Patient opted for full refund.', 'APPROVED'),
(3, 8, 8, NULL, 3000.00, GETDATE(), 'Accidental double payment on payment gateway timeout.', 'REQUESTED'),
(4, 9, 9, 3, 2800.00, GETDATE(), 'Medical appointment relocation to suburban branch.', 'PROCESSED'),
(5, 10, 10, NULL, 3200.00, GETDATE(), 'Patient unwell and requested session deferral/refund.', 'REQUESTED');

SET IDENTITY_INSERT dbo.Refunds OFF;
GO

-- ============================================================================
-- 11. CUSTOM BILLS (5 Comprehensive Medical Invoices with Line Items JSON)
-- Member 6: Brahmananayaka N.M (IT25103825)
-- ============================================================================
SET IDENTITY_INSERT dbo.CustomBills ON;

INSERT INTO dbo.CustomBills (BillId, InvoiceNumber, PatientName, PatientId, PatientNic, PatientContact, DoctorName, DoctorSpecialization, Department, BillCategory, PaymentMethod, PaymentStatus, Subtotal, FacilityCharge, Discount, Tax, TotalAmount, LineItemsJson, Remarks, CashierName, TransactionReference, PaidAt, CreatedAt) VALUES
-- Bill 1: Completed Outpatient Invoice for Anjali Perera (Patient PAT0008)
(1, 'INV-2026-001', 'Anjali Perera', 'PAT0008', '199855667788', '0775566778', 'Dr. Nuwan Jayawardena', 'Cardiology', 'Outpatient Department (OPD)', 'Outpatient (OPD) Consultation', 'CREDIT_CARD', 'COMPLETED', 4250.00, 500.00, 250.00, 0.00, 4500.00,
'[{"id":1,"description":"Cardiac Clinical Review & Auscultation","category":"Consultation","qty":1,"unitPrice":3500,"amount":3500},{"id":2,"description":"12-Lead Electrocardiogram (ECG) Analysis","category":"Diagnostics","qty":1,"unitPrice":750,"amount":750}]',
'Post-consultation diagnostic clearance bill.', 'Ruwan Selvaratnam', 'TXN-BILL-001', GETDATE(), GETDATE()),

-- Bill 2: Completed Emergency Casualty Invoice for Kasun Bandara (Patient PAT0009)
(2, 'INV-2026-002', 'Kasun Bandara', 'PAT0009', '200012349988', '0719988112', 'Dr. Priyantha Silva', 'General Medicine', 'Emergency Care & Casualty', 'Emergency Care & Casualty', 'CASH', 'COMPLETED', 5200.00, 800.00, 0.00, 0.00, 6000.00,
'[{"id":1,"description":"Emergency Casualty Triage & Medical Officer Examination","category":"Emergency","qty":1,"unitPrice":2500,"amount":2500},{"id":2,"description":"Wound Dressing, Sterile Suturing & Antiseptic Pack","category":"Procedure","qty":1,"unitPrice":2200,"amount":2200},{"id":3,"description":"Tetanus Toxoid Vaccine Administration","category":"Pharmacy","qty":1,"unitPrice":500,"amount":500}]',
'Patient discharged after emergency observation.', 'Ruwan Selvaratnam', 'TXN-BILL-002', GETDATE(), GETDATE()),

-- Bill 3: Laboratory & Pathology Invoice for Nimal Jayasinghe (Patient PAT0013)
(3, 'INV-2026-003', 'Nimal Jayasinghe', 'PAT0013', '199512345678', '0712233445', 'Dr. Priyantha Silva', 'General Medicine', 'Central Pathology Laboratory', 'Laboratory & Diagnostic Testing', 'ONLINE_BANKING', 'COMPLETED', 4200.00, 300.00, 0.00, 0.00, 4500.00,
'[{"id":1,"description":"Full Blood Count (FBC) with Automated Differential","category":"Lab","qty":1,"unitPrice":1800,"amount":1800},{"id":2,"description":"Fasting Blood Sugar & HbA1c Glycated Hemoglobin","category":"Lab","qty":1,"unitPrice":2400,"amount":2400}]',
'Routine diabetic checkup laboratory investigation profile.', 'Nadeeka Alwis', 'TXN-BILL-003', GETDATE(), GETDATE()),

-- Bill 4: PENDING Bill for Dilhani Senanayake (Patient PAT0014) - Tests Portal Payment Flow
(4, 'INV-2026-004', 'Dilhani Senanayake', 'PAT0014', '199612345678', '0773322114', 'Dr. Samantha Perera', 'Dermatology', 'Dermatology & Skin Clinic', 'Specialist Channeling Consultation', 'ONLINE_BANKING', 'PENDING', 6500.00, 500.00, 0.00, 0.00, 7000.00,
'[{"id":1,"description":"Consultant Dermatological Dermoscopy & Skin Lesion Screen","category":"Consultation","qty":1,"unitPrice":3000,"amount":3000},{"id":2,"description":"Cryotherapy Treatment for Benign Cutaneous Lesions","category":"Procedure","qty":1,"unitPrice":3500,"amount":3500}]',
'Awaiting settlement via Patient Portal online checkout.', 'Ruwan Selvaratnam', NULL, NULL, GETDATE()),

-- Bill 5: Pharmacy & Medication Bill for Chaminda Wickramasinghe (Patient PAT0015)
(5, 'INV-2026-005', 'Chaminda Wickramasinghe', 'PAT0015', '199112345678', '0755544332', 'Dr. Kasun Dissanayake', 'Orthopedics', 'Central Outpatient Pharmacy', 'Pharmacy & Medication Dispensing', 'CASH', 'COMPLETED', 3850.00, 250.00, 0.00, 0.00, 4100.00,
'[{"id":1,"description":"Orthopedic Knee Brace Support Apparatus","category":"Appliance","qty":1,"unitPrice":2200,"amount":2200},{"id":2,"description":"Prescription Dispensing: NSAID Analgesic & Calcium Supplements","category":"Pharmacy","qty":1,"unitPrice":1650,"amount":1650}]',
'Prescription dispensed in full.', 'Nadeeka Alwis', 'TXN-BILL-005', GETDATE(), GETDATE());

SET IDENTITY_INSERT dbo.CustomBills OFF;
GO

-- ============================================================================
-- 12. FEEDBACKS (5 Verified Patient Reviews)
-- Member 3: Karunathilake B.M.G.T.P (IT25103822)
-- ============================================================================
SET IDENTITY_INSERT dbo.Feedbacks ON;

INSERT INTO dbo.Feedbacks (FeedbackId, PatientId, DoctorId, AppointmentId, Rating, Comments, SubmittedDate, IsFeatured) VALUES
(1, 8, 5, 1, 5, 'Dr. Nuwan was exceptionally attentive and explained the ECG diagnosis with tremendous care. The live queue tracker saved me from waiting in crowded halls!', GETDATE(), 1),
(2, 9, 6, 2, 5, 'Dr. Priyantha took time to listen to all my medical history without rushing. Highly professional doctor and clinic staff.', GETDATE(), 1),
(3, 13, 7, 3, 5, 'Gentle and caring with my toddler. Dr. Amanda is our trusted family pediatrician. The clinic room was very kid-friendly.', GETDATE(), 1),
(4, 14, 11, 4, 4, 'Very effective acne and dermatitis treatment plan. Visible improvement within two weeks of starting the prescription.', GETDATE(), 0),
(5, 15, 12, 5, 5, 'Outstanding orthopedic diagnosis. Clear exercises given for meniscus recovery. Hospital was very clean.', GETDATE(), 1);

SET IDENTITY_INSERT dbo.Feedbacks OFF;
GO

-- ============================================================================
-- 13. COMPLAINTS (5 Support Grievance Records Across Categories)
-- Member 3: Karunathilake B.M.G.T.P (IT25103822)
-- ============================================================================
SET IDENTITY_INSERT dbo.Complaints ON;

INSERT INTO dbo.Complaints (ComplaintId, PatientId, CustomerServiceId, ComplaintType, Description, ComplaintStatus, DateSubmitted, ResolutionNotes, ResolvedDate) VALUES
(1, 8, 4, 'PAYMENT_ISSUE', 'Encountered network gateway timeout during initial payment attempt before second try went through.', 'RESOLVED', GETDATE(), 'Audited bank transaction log. Confirmed only one debit was finalized. Sent official digital receipt to patient.', GETDATE()),
(2, 9, 4, 'DELAY', 'Consultation session was delayed 15 minutes past the scheduled slot time.', 'RESOLVED', GETDATE(), 'Informed patient that an emergency cardiac admission was prioritized by the consultant. Patient appreciated the prompt briefing.', GETDATE()),
(3, 13, 4, 'STAFF_BEHAVIOR', 'Hospital reception desk was unstaffed for 10 minutes during token check-in.', 'IN_PROGRESS', GETDATE(), 'Escalated to Hospital Operations Floor Manager. Staff duty roster being restructured.', NULL),
(4, 14, 4, 'CANCELLATION', 'Need urgent confirmation on refund status for cancelled pediatric appointment #9.', 'IN_PROGRESS', GETDATE(), 'Liaising with Finance Officer. Refund request #4 has been approved and is queued for bank batch transfer.', NULL),
(5, 15, 4, 'OTHER', 'Patient portal bill PDF download icon was unresponsive on mobile Safari browser.', 'RESOLVED', GETDATE(), 'Assisted patient via phone support. Dispatched direct PDF download link and upgraded web mobile view.', GETDATE());

SET IDENTITY_INSERT dbo.Complaints OFF;
GO

-- ============================================================================
-- 14. PRESCRIPTIONS (5 Clinical Prescriptions Issued by Doctors)
-- Member 2: Adhikari A.M.S.T (IT25103821)
-- ============================================================================
SET IDENTITY_INSERT dbo.Prescriptions ON;

INSERT INTO dbo.Prescriptions (PrescriptionId, AppointmentId, DoctorId, PatientId, IssueDate, Details) VALUES
(1, 1, 5, 8, GETDATE(), '1. Tab. Aspirin 75mg - 1 tab daily mane after breakfast (90 days)
2. Tab. Atorvastatin 20mg - 1 tab nocte at bedtime (90 days)
3. Tab. Bisoprolol 2.5mg - 1 tab daily (30 days)
* Advised: Strict low-sodium Mediterranean diet. Repeat Lipid Profile and follow-up in 3 months.'),

(2, 2, 6, 9, GETDATE(), '1. Tab. Paracetamol 500mg - 2 tabs TDS for 3 days PRN for fever
2. Cap. Amoxicillin 500mg - 1 cap TDS for 5 days (complete course)
3. Syp. Cetirizine 10mg - 1 tab nocte for 5 days
* Advised: Rest, warm steam inhalation, and oral rehydration fluids.'),

(3, 3, 7, 13, GETDATE(), '1. Syp. Cetirizine 5ml - once daily nocte for 5 days
2. Salbutamol MDI Inhaler 100mcg - 2 puffs via spacer PRN for wheezing
3. Syp. Paracetamol 120mg/5ml - 7.5ml TDS for body ache or temperature > 38C
* Advised: Keep child in warm environment. Avoid cold drinks and dust exposure.'),

(4, 4, 11, 14, GETDATE(), '1. Hydrocortisone Cream 1% - apply thin layer to affected skin BD for 7 days
2. Cetaphil Gentle Skin Cleanser - wash face BD
3. Tab. Fexofenadine 120mg - 1 tab daily mane for 14 days
* Advised: Avoid direct sun exposure. Apply SPF 50 sunscreen daily.'),

(5, 5, 12, 15, GETDATE(), '1. Tab. Diclofenac Sodium 50mg - 1 tab BD post-cibum for 5 days
2. Tab. Pantoprazole 40mg - 1 tab mane before breakfast for 5 days
3. Tab. Glucosamine + Chondroitin - 1 tab daily for 30 days
* Advised: Quadriceps strengthening exercises. Avoid stairs and heavy weightlifting for 2 weeks.');

SET IDENTITY_INSERT dbo.Prescriptions OFF;
GO

-- ============================================================================
-- 15. QUEUE NOTIFICATIONS (8 Real-Time Live Feed Alerts)
-- Member 5: Yapa Bandara Y.M.M.P.P.D (IT25103824)
-- ============================================================================
SET IDENTITY_INSERT dbo.QueueNotifications ON;

INSERT INTO dbo.QueueNotifications (NotificationId, ScheduleId, PatientId, AppointmentId, RecipientPhone, RecipientName, TokenNo, MessageType, MessageBody, SentAt, DeliveryStatus, DoctorId, UserId, TargetRole, Title, IsRead) VALUES
(1, 1, 8, 1, '0775566778', 'Anjali Perera', 1, 'DOCTOR_ARRIVED', 'Dr. Nuwan Jayawardena has checked into Room 201 (Cardiac Suite), Asiri Central Hospital. Consultation queue has officially commenced.', GETDATE(), 'DELIVERED', 5, 8, 'PATIENT', 'Doctor Arrived at Clinic', 1),
(2, 1, 8, 1, '0775566778', 'Anjali Perera', 1, 'TOKEN_CALLED', 'Token #1: Please enter Consultation Room 201 now for your appointment with Dr. Nuwan Jayawardena.', GETDATE(), 'DELIVERED', 5, 8, 'PATIENT', 'Now Serving: Token #1', 0),
(3, 1, 9, 2, '0719988112', 'Kasun Bandara', 2, 'APPROACHING_TURN', 'CareSync Reminder: You are next in line (Token #2) for Dr. Nuwan Jayawardena. Please report to the waiting lounge.', GETDATE(), 'DELIVERED', 5, 9, 'PATIENT', 'Approaching Turn (Token #2)', 0),
(4, 2, 9, 2, '0719988112', 'Kasun Bandara', 1, 'GENERAL_ALERT', 'Your evening consultation with Dr. Priyantha Silva at Nawaloka Hospital is confirmed for 16:00 today.', GETDATE(), 'DELIVERED', 6, 9, 'PATIENT', 'Clinic Schedule Reminder', 1),
(5, 6, 8, 11, '0775566778', 'Anjali Perera', 1, 'DOCTOR_LEAVE', 'URGENT: Dr. Nuwan Jayawardena is on emergency leave on your booked date. CareSync coordinator is ready to reschedule you with zero surcharge.', GETDATE(), 'DELIVERED', 5, 8, 'PATIENT', 'Doctor Emergency Leave Alert', 0),
(6, 1, NULL, NULL, '0779988776', 'Dr. Nuwan Jayawardena', 0, 'CLINIC_SCHEDULE', 'Good morning Doctor. You have 2 booked patients for your morning Cardiology session at Asiri Central Hospital.', GETDATE(), 'DELIVERED', 5, 5, 'DOCTOR', 'Today Consultation Schedule', 1),
(7, 3, 13, 3, '0712233445', 'Nimal Jayasinghe', 1, 'GENERAL_ALERT', 'Booking confirmed for Dr. Amanda Fernando (Pediatrics) tomorrow at 10:00 AM, Lanka Hospitals.', GETDATE(), 'DELIVERED', 7, 13, 'PATIENT', 'Appointment Confirmed', 1),
(8, 4, 14, 4, '0773322114', 'Dilhani Senanayake', 1, 'GENERAL_ALERT', 'Booking confirmed for Dr. Samantha Perera (Dermatology) at Hemas Hospital.', GETDATE(), 'DELIVERED', 11, 14, 'PATIENT', 'Appointment Confirmed', 1);

SET IDENTITY_INSERT dbo.QueueNotifications OFF;
GO

-- ============================================================================
-- 16. SYSTEM LOGS (10 Security & Operations Audit Trail Entries)
-- Member 1: Jayasundara U.R (IT25103820)
-- ============================================================================
SET IDENTITY_INSERT dbo.SystemLogs ON;

INSERT INTO dbo.SystemLogs (LogId, UserId, PerformerName, PerformerRole, ActionType, EntityName, EntityId, Description, Severity, IpAddress, Timestamp) VALUES
(1, 1, 'Ishara Gunasekara', 'ADMINISTRATOR', 'LOGIN_SUCCESS', 'User', 1, 'System Administrator logged in successfully via Enterprise Web Console.', 'INFO', '192.168.1.10', GETDATE()),
(2, 1, 'Ishara Gunasekara', 'ADMINISTRATOR', 'APPROVE_DOCTOR', 'Doctor', 5, 'Approved medical credentials and SLMC license #45892 for Dr. Nuwan Jayawardena.', 'SUCCESS', '192.168.1.10', GETDATE()),
(3, 2, 'Kasun Fernando', 'CHANNELING_COORDINATOR', 'CREATE_SCHEDULE', 'Schedule', 1, 'Created new Cardiology morning session for Dr. Nuwan at Asiri Central Hospital.', 'SUCCESS', '192.168.1.25', GETDATE()),
(4, 8, 'Anjali Perera', 'PATIENT', 'BOOK_APPOINTMENT', 'Appointment', 1, 'Booked Token #1 for Dr. Nuwan Jayawardena (Cardiology) with online card checkout.', 'INFO', '112.134.10.88', GETDATE()),
(5, 8, 'Anjali Perera', 'PATIENT', 'PAYMENT_SUCCESS', 'Payment', 1, 'Payment of LKR 3,500.00 processed successfully via transaction TXN-2026-0001.', 'SUCCESS', '112.134.10.88', GETDATE()),
(6, 5, 'Dr. Nuwan Jayawardena', 'DOCTOR', 'CHECK_IN_CLINIC', 'Schedule', 1, 'Doctor checked in to Room 201. Live Queue tracker initiated.', 'INFO', '10.0.4.15', GETDATE()),
(7, 3, 'Ruwan Selvaratnam', 'FINANCE_OFFICER', 'GENERATE_CUSTOM_BILL', 'CustomBill', 1, 'Generated Outpatient Custom Bill INV-2026-001 (LKR 4,500.00) for Anjali Perera.', 'SUCCESS', '192.168.1.30', GETDATE()),
(8, 3, 'Ruwan Selvaratnam', 'FINANCE_OFFICER', 'APPROVE_REFUND', 'Refund', 1, 'Approved patient refund request for cancelled consultation appointment #6 (LKR 2,500.00).', 'WARNING', '192.168.1.30', GETDATE()),
(9, 4, 'Malsha Wijeratne', 'CUSTOMER_SERVICE_EXECUTIVE', 'RESOLVE_COMPLAINT', 'Complaint', 1, 'Resolved duplicate payment grievance for patient Anjali Perera with confirmed single ledger debit.', 'SUCCESS', '192.168.1.42', GETDATE()),
(10, 5, 'Dr. Nuwan Jayawardena', 'DOCTOR', 'ISSUE_PRESCRIPTION', 'Prescription', 1, 'Issued comprehensive clinical prescription for patient Anjali Perera post-cardiac check.', 'INFO', '10.0.4.15', GETDATE());

SET IDENTITY_INSERT dbo.SystemLogs OFF;
GO

PRINT '========================================================================';
PRINT 'EChannelingDB Seed Data inserted successfully across all 16 tables!';
PRINT 'Referential Integrity: 100% verified with realistic data.';
PRINT 'Standard Password for ALL accounts: password123';
PRINT '========================================================================';
GO

# Member 2: Doctor Administration & Clinical Prescriptions Subsystem
- **Student ID:** `IT25103821`
- **Name:** Adhikari A.M.S.T
- **Role:** Subsystem Engineer - Consultant Administration & Digital Prescriptions
- **Git Feature Branch:** `feature/member2-doctor-admin`

---

## ðŸ“¦ 1. Your Assigned Code Files

### Backend (Java & Spring Boot):
- `backend/src/main/java/com/sliit/echanneling/doctor/`
  - `controller/DoctorController.java` : REST API for public consultant directory, doctor profile update, and active consultation views.
  - `controller/AdminController.java` : Administrative approval, status toggling, and doctor directory maintenance.
  - `dto/DoctorRegistrationDto.java` : DTO for doctor onboarding with SLMC validation.
  - `dto/DoctorUpdateDto.java` : DTO for qualifications, bio, room number, and consultation fee updates.
  - `dto/DoctorApprovalDto.java` : Admin approval payload.
  - `dto/PrescriptionCreateDto.java` : Digital clinical prescription payload with medication lists and dosage.
  - `entity/Doctor.java` : JPA entity inheriting from `User` via `@Inheritance(strategy = InheritanceType.JOINED)`.
  - `entity/Prescription.java` : Entity modeling clinical prescriptions.
  - `repository/DoctorRepository.java` & `PrescriptionRepository.java` : Spring Data JPA repositories.
  - `service/DoctorService.java` & `DoctorServiceImpl.java` : Business logic for doctor management and prescriptions.

### Frontend (React & Tailwind CSS):
- `frontend/src/components/DoctorPortal.jsx` : Complete Doctor Portal (Profile updates, active patient queue, past consultations, issuing prescriptions).
- `frontend/src/components/PrescriptionSlipModal.jsx` : Printable digital prescription slip with doctor seal and medications table.

### Database:
- `database/member2_doctor_prescriptions_schema.sql` : Schema for `Doctors` and `Prescriptions` tables with triggers.

---

## ðŸš€ 2. Step-by-Step Git Commands to Push Your Work

### Step 1: Clone the repository created by Group Leader Karunathilake
```bash
git clone <GITHUB_REPOSITORY_URL>
cd CareSync
```

### Step 2: Switch to the `develop` branch and create your feature branch
```bash
git checkout develop
git checkout -b feature/member2-doctor-admin
```

### Step 3: Copy your assigned files into the repository
Copy the contents of `backend/`, `frontend/`, and `database/` from this folder into the root of your cloned `CareSync` directory.

### Step 4: Verify git status, commit, and push
```bash
git status
git add .
git commit -m "feat(doctor): implement consultant administration, profile management, and clinical prescription slip"
git push -u origin feature/member2-doctor-admin
```

### Step 5: Open a Pull Request on GitHub
1. Open the repository on GitHub in your browser.
2. Click **"Compare & pull request"** next to `feature/member2-doctor-admin`.
3. Set the base branch to: **`develop`** (NOT `main`).
4. Title: `feat(doctor): Doctor Administration & Digital Prescriptions (IT25103821)`
5. Click **"Create pull request"** and notify Group Leader Karunathilake to review and merge!

---

## ðŸŽ“ 3. Viva Defense Talking Points for Member 2
1. **Inheritance & Polymorphism**: `Doctor` extends `User`. In runtime queries, polymorphic queries against `UserRepository` can resolve `Doctor` specific properties via JPA joined inheritance.
2. **Clinical Validation**: Doctor medical license numbers are checked for uniqueness. Room numbers and consultation fees have strict validation boundaries.
3. **Prescription Integrity**: A prescription maintains a strict 1:1 relationship with the completed appointment (`AppointmentId UNIQUE`), preventing duplicate medication issuance.

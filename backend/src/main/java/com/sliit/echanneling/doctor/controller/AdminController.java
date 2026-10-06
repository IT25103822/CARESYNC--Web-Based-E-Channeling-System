package com.sliit.echanneling.doctor.controller;

import com.sliit.echanneling.appointment.repository.AppointmentRepository;
import com.sliit.echanneling.auth.dto.StaffRegistrationDto;
import com.sliit.echanneling.auth.dto.StaffUpdateDto;
import com.sliit.echanneling.auth.entity.StaffUser;
import com.sliit.echanneling.auth.entity.User;
import com.sliit.echanneling.auth.repository.StaffUserRepository;
import com.sliit.echanneling.auth.repository.UserRepository;
import com.sliit.echanneling.common.ApiResponse;
import com.sliit.echanneling.common.BadRequestException;
import com.sliit.echanneling.common.ResourceNotFoundException;
import com.sliit.echanneling.doctor.dto.DoctorApprovalDto;
import com.sliit.echanneling.doctor.dto.DoctorUpdateDto;
import com.sliit.echanneling.doctor.entity.Doctor;
import com.sliit.echanneling.doctor.service.DoctorService;
import com.sliit.echanneling.patient.dto.PatientUpdateDto;
import com.sliit.echanneling.patient.entity.Patient;
import com.sliit.echanneling.patient.repository.PatientRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.sliit.echanneling.appointment.entity.Appointment;
import com.sliit.echanneling.doctor.entity.Prescription;
import com.sliit.echanneling.doctor.repository.PrescriptionRepository;
import com.sliit.echanneling.feedback.entity.Complaint;
import com.sliit.echanneling.feedback.entity.Feedback;
import com.sliit.echanneling.feedback.repository.ComplaintRepository;
import com.sliit.echanneling.feedback.repository.FeedbackRepository;
import com.sliit.echanneling.payment.entity.Payment;
import com.sliit.echanneling.payment.entity.Refund;
import com.sliit.echanneling.payment.repository.PaymentRepository;
import com.sliit.echanneling.payment.repository.RefundRepository;
import org.springframework.data.domain.Sort;
import org.springframework.transaction.annotation.Transactional;

/**
 * Member 2: Adhikari A.M.S.T (IT25103821) - Administration REST Controller
 */
@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    private final DoctorService doctorService;
    private final com.sliit.echanneling.patient.service.PatientService patientService;
    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;
    private final StaffUserRepository staffUserRepository;
    private final UserRepository userRepository;
    private final ComplaintRepository complaintRepository;
    private final FeedbackRepository feedbackRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final PaymentRepository paymentRepository;
    private final RefundRepository refundRepository;
    private final com.sliit.echanneling.audit.service.AuditLogService auditLogService;

    @Autowired
    public AdminController(DoctorService doctorService,
                           com.sliit.echanneling.patient.service.PatientService patientService,
                           PatientRepository patientRepository,
                           AppointmentRepository appointmentRepository,
                           StaffUserRepository staffUserRepository,
                           UserRepository userRepository,
                           ComplaintRepository complaintRepository,
                           FeedbackRepository feedbackRepository,
                           PrescriptionRepository prescriptionRepository,
                           PaymentRepository paymentRepository,
                           RefundRepository refundRepository,
                           com.sliit.echanneling.audit.service.AuditLogService auditLogService) {
        this.doctorService = doctorService;
        this.patientService = patientService;
        this.patientRepository = patientRepository;
        this.appointmentRepository = appointmentRepository;
        this.staffUserRepository = staffUserRepository;
        this.userRepository = userRepository;
        this.complaintRepository = complaintRepository;
        this.feedbackRepository = feedbackRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.paymentRepository = paymentRepository;
        this.refundRepository = refundRepository;
        this.auditLogService = auditLogService;
    }

    @GetMapping("/doctors/all")
    public ResponseEntity<ApiResponse<List<Doctor>>> getAllDoctors() {
        List<Doctor> doctors = doctorService.getAllDoctors();
        return ResponseEntity.ok(ApiResponse.ok("All registered doctors fetched", doctors));
    }

    @GetMapping("/prescriptions")
    public ResponseEntity<ApiResponse<List<Prescription>>> getAllPrescriptions() {
        List<Prescription> list = prescriptionRepository.findAll(
            Sort.by(Sort.Direction.DESC, "issueDate")
        );
        return ResponseEntity.ok(ApiResponse.ok("All issued hospital prescriptions fetched", list));
    }

    @GetMapping("/doctors/pending")
    public ResponseEntity<ApiResponse<List<Doctor>>> getPendingDoctors() {
        List<Doctor> pending = doctorService.getPendingDoctors();
        return ResponseEntity.ok(ApiResponse.ok("Doctors pending verification fetched", pending));
    }

    @PutMapping("/doctors/{id}/approve")
    public ResponseEntity<ApiResponse<Doctor>> approveOrRejectDoctor(@PathVariable Integer id, @Valid @RequestBody DoctorApprovalDto dto) {
        Doctor updated = doctorService.approveOrRejectDoctor(id, dto);
        String action = dto.getApproved() ? "approved" : "rejected";
        auditLogService.log(1, "Ishara Gunasekara", "ADMINISTRATOR", 
                dto.getApproved() ? "DOCTOR_APPROVED" : "DOCTOR_REJECTED", 
                "Doctor", id,
                "Doctor " + updated.getFullName() + " (License: " + updated.getMedicalLicenseNo() + ") account " + action + " by Administrator",
                dto.getApproved() ? "SUCCESS" : "WARNING", "127.0.0.1");
        return ResponseEntity.ok(ApiResponse.ok("Doctor account " + action + " successfully", updated));
    }

    @PutMapping("/doctors/{id}/status")
    public ResponseEntity<ApiResponse<Doctor>> toggleDoctorStatus(@PathVariable Integer id, @RequestParam Boolean isActive) {
        Doctor doctor = doctorService.toggleDoctorStatus(id, isActive);
        String statusStr = Boolean.TRUE.equals(isActive) ? "activated" : "deactivated";
        auditLogService.log(1, "Ishara Gunasekara", "ADMINISTRATOR", "DOCTOR_STATUS_TOGGLED", "Doctor", id,
                "Doctor account " + doctor.getFullName() + " " + statusStr + " by Administrator",
                "INFO", "127.0.0.1");
        return ResponseEntity.ok(ApiResponse.ok("Doctor account " + statusStr + " successfully", doctor));
    }

    @PutMapping("/doctors/{id}")
    public ResponseEntity<ApiResponse<Doctor>> updateDoctorProfile(@PathVariable Integer id, @RequestBody DoctorUpdateDto dto) {
        Doctor updated = doctorService.updateDoctorProfile(id, dto);
        return ResponseEntity.ok(ApiResponse.ok("Doctor profile updated successfully", updated));
    }

    @PutMapping("/patients/{id}/status")
    public ResponseEntity<ApiResponse<com.sliit.echanneling.patient.entity.Patient>> togglePatientStatus(@PathVariable Integer id, @RequestParam Boolean isActive) {
        com.sliit.echanneling.patient.entity.Patient patient = patientService.togglePatientStatus(id, isActive);
        String statusStr = Boolean.TRUE.equals(isActive) ? "activated" : "deactivated";
        return ResponseEntity.ok(ApiResponse.ok("Patient account " + statusStr + " successfully", patient));
    }

    @PutMapping("/patients/{id}")
    public ResponseEntity<ApiResponse<Patient>> updatePatientProfile(@PathVariable Integer id, @RequestBody PatientUpdateDto dto) {
        Patient updated = patientService.updatePatientProfile(id, dto);
        return ResponseEntity.ok(ApiResponse.ok("Patient profile updated successfully", updated));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSystemStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalPatients", patientRepository.count());
        stats.put("totalDoctors", doctorService.getAllDoctors().size());
        stats.put("approvedDoctors", doctorService.getApprovedDoctors().size());
        stats.put("pendingDoctors", doctorService.getPendingDoctors().size());
        stats.put("totalStaff", staffUserRepository.count());
        stats.put("totalAppointments", appointmentRepository.count());
        return ResponseEntity.ok(ApiResponse.ok("System statistics fetched", stats));
    }

    // =========================================================================
    // STAFF & ROLE-BASED USER MANAGEMENT (ADMINISTRATOR)
    // =========================================================================

    @GetMapping("/staff")
    public ResponseEntity<ApiResponse<List<StaffUser>>> getAllStaffUsers() {
        List<StaffUser> staffList = staffUserRepository.findAll();
        return ResponseEntity.ok(ApiResponse.ok("All staff and role-based users fetched", staffList));
    }

    @PostMapping("/staff")
    public ResponseEntity<ApiResponse<StaffUser>> createStaffUser(@Valid @RequestBody StaffRegistrationDto dto) {
        if (userRepository.existsByUsername(dto.getUsername())) {
            throw new BadRequestException("Username '" + dto.getUsername() + "' is already taken.");
        }
        if (userRepository.findByNic(dto.getNic()).isPresent()) {
            throw new BadRequestException("NIC '" + dto.getNic() + "' is already registered to another user.");
        }

        String role = dto.getRole();
        if (role == null || role.trim().isEmpty()) {
            role = "CHANNELING_COORDINATOR";
        }
        String dept = dto.getDepartment();
        if (dept == null || dept.trim().isEmpty()) {
            switch (role) {
                case "FINANCE_OFFICER": dept = "Accounts & Finance"; break;
                case "CUSTOMER_SERVICE_EXECUTIVE": dept = "Customer Support"; break;
                case "ADMINISTRATOR": dept = "Administration & IT"; break;
                default: dept = "Channeling Operations"; break;
            }
        }

        StaffUser staff = new StaffUser(
                dto.getUsername(),
                dto.getPassword(),
                dto.getFullName(),
                dto.getContactNumber(),
                dto.getNic(),
                role,
                role,
                dept
        );

        if ("ADMINISTRATOR".equalsIgnoreCase(role)) {
            staff.setPermissions(dto.getPermissions() != null && !dto.getPermissions().trim().isEmpty()
                    ? dto.getPermissions()
                    : "MANAGE_USERS,MANAGE_DOCTORS,MANAGE_PATIENTS,VIEW_ANALYTICS,DELETE_RECORDS");
        } else {
            staff.setPermissions(dto.getPermissions());
        }

        StaffUser saved = staffUserRepository.save(staff);
        auditLogService.log(1, "Ishara Gunasekara", "ADMINISTRATOR", "STAFF_CREATED", "StaffUser", saved.getUserId(),
                "Registered new staff member '" + saved.getFullName() + "' (@" + saved.getUsername() + ") with role " + saved.getRole() + " in department '" + saved.getDepartment() + "'",
                "SUCCESS", "127.0.0.1");
        return ResponseEntity.ok(ApiResponse.ok("Staff member (" + role + ") registered successfully", saved));
    }

    @PutMapping("/staff/{id}/status")
    public ResponseEntity<ApiResponse<StaffUser>> toggleStaffStatus(@PathVariable Integer id, @RequestParam Boolean isActive) {
        StaffUser staff = staffUserRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Staff user not found with ID: " + id));
        if ((id == 1 || "admin".equalsIgnoreCase(staff.getUsername())) && Boolean.FALSE.equals(isActive)) {
            throw new BadRequestException("The primary system administrator account cannot be deactivated.");
        }
        staff.setIsActive(isActive);
        StaffUser updated = staffUserRepository.save(staff);
        String statusStr = Boolean.TRUE.equals(isActive) ? "activated" : "deactivated";
        auditLogService.log(1, "Ishara Gunasekara", "ADMINISTRATOR", "STAFF_STATUS_TOGGLED", "StaffUser", id,
                "Staff account @" + staff.getUsername() + " (" + staff.getFullName() + ") " + statusStr + " by Administrator",
                "INFO", "127.0.0.1");
        return ResponseEntity.ok(ApiResponse.ok("Staff account " + statusStr + " successfully", updated));
    }

    @PutMapping("/staff/{id}")
    public ResponseEntity<ApiResponse<StaffUser>> updateStaffUser(@PathVariable Integer id, @RequestBody StaffUpdateDto dto) {
        StaffUser staff = staffUserRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Staff user not found with ID: " + id));

        if (id == 1 || "admin".equalsIgnoreCase(staff.getUsername())) {
            if (dto.getIsActive() != null && Boolean.FALSE.equals(dto.getIsActive())) {
                throw new BadRequestException("The primary system administrator account cannot be deactivated.");
            }
            if (dto.getRole() != null && !"ADMINISTRATOR".equalsIgnoreCase(dto.getRole())) {
                throw new BadRequestException("The primary system administrator role cannot be altered.");
            }
        }

        if (dto.getFullName() != null && !dto.getFullName().trim().isEmpty()) {
            staff.setFullName(dto.getFullName());
        }
        if (dto.getContactNumber() != null && !dto.getContactNumber().trim().isEmpty()) {
            staff.setContactNumber(dto.getContactNumber());
        }
        if (dto.getDepartment() != null && !dto.getDepartment().trim().isEmpty()) {
            staff.setDepartment(dto.getDepartment());
        }
        if (dto.getRole() != null && !dto.getRole().trim().isEmpty() && id != 1) {
            staff.setRole(dto.getRole());
            staff.setStaffRole(dto.getRole());
        }
        if (dto.getIsActive() != null && id != 1) {
            staff.setIsActive(dto.getIsActive());
        }
        if (dto.getPermissions() != null) {
            if (id == 1 || "admin".equalsIgnoreCase(staff.getUsername())) {
                staff.setPermissions("ALL,MANAGE_USERS,MANAGE_DOCTORS,MANAGE_PATIENTS,VIEW_ANALYTICS,DELETE_RECORDS");
            } else {
                staff.setPermissions(dto.getPermissions());
            }
        }

        StaffUser updated = staffUserRepository.save(staff);
        auditLogService.log(1, "Ishara Gunasekara", "ADMINISTRATOR", "STAFF_UPDATED", "StaffUser", id,
                "Updated details for staff member @" + updated.getUsername() + " (" + updated.getFullName() + ") - Department: " + updated.getDepartment() + ", Role: " + updated.getRole(),
                "INFO", "127.0.0.1");
        return ResponseEntity.ok(ApiResponse.ok("Staff user updated successfully", updated));
    }

    @PutMapping("/staff/{id}/permissions")
    @Transactional
    public ResponseEntity<ApiResponse<StaffUser>> updateStaffPermissions(@PathVariable Integer id, @RequestParam String permissions) {
        StaffUser staff = staffUserRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Staff user not found with ID: " + id));
        if (id == 1 || "admin".equalsIgnoreCase(staff.getUsername())) {
            throw new BadRequestException("The primary system administrator account has permanent full permissions.");
        }
        staff.setPermissions(permissions);
        StaffUser updated = staffUserRepository.save(staff);
        auditLogService.log(1, "Ishara Gunasekara", "ADMINISTRATOR", "STAFF_PERMISSIONS_CHANGED", "StaffUser", id,
                "Modified security permissions for @" + staff.getUsername() + " (" + staff.getFullName() + ") -> [" + permissions + "]",
                "WARNING", "127.0.0.1");
        return ResponseEntity.ok(ApiResponse.ok("Permissions updated successfully for " + staff.getFullName(), updated));
    }

    @GetMapping("/users/all")
    public ResponseEntity<ApiResponse<List<User>>> getAllSystemUsers() {
        List<User> allUsers = userRepository.findAll();
        return ResponseEntity.ok(ApiResponse.ok("All system users fetched", allUsers));
    }

    @DeleteMapping("/doctors/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDoctor(@PathVariable Integer id) {
        Doctor doc = doctorService.getDoctorById(id);
        String docName = (doc != null && doc.getFullName() != null) ? doc.getFullName() : "DOC" + id;
        doctorService.deleteDoctor(id);
        auditLogService.log(1, "Ishara Gunasekara", "ADMINISTRATOR", "DOCTOR_DELETED", "Doctor", id,
                "Permanently deleted doctor profile and records for " + docName + " (DOC" + String.format("%04d", id) + ")",
                "CRITICAL", "127.0.0.1");
        return ResponseEntity.ok(ApiResponse.ok("Doctor account (DOC" + String.format("%04d", id) + ") and all associated records deleted successfully", null));
    }

    @DeleteMapping("/staff/{id}")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> deleteStaffUser(@PathVariable Integer id) {
        StaffUser staff = staffUserRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Staff user not found with ID: " + id));
        if (id == 1 || "admin".equalsIgnoreCase(staff.getUsername())) {
            throw new BadRequestException("The primary system administrator account (admin) is protected and cannot be deleted.");
        }
        String staffInfo = "@" + staff.getUsername() + " (" + staff.getFullName() + ", " + staff.getRole() + ")";
        staffUserRepository.delete(staff);
        auditLogService.log(1, "Ishara Gunasekara", "ADMINISTRATOR", "STAFF_DELETED", "StaffUser", id,
                "Permanently deleted staff user " + staffInfo,
                "CRITICAL", "127.0.0.1");
        return ResponseEntity.ok(ApiResponse.ok("Staff user account (STAFF" + String.format("%04d", id) + ") deleted successfully", null));
    }

    @DeleteMapping("/patients/{id}")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> deletePatient(@PathVariable Integer id) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + id));

        String patName = patient.getFullName();

        // 1. Delete patient complaints
        List<Complaint> complaints = complaintRepository.findByPatient_UserIdOrderByDateSubmittedDesc(id);
        if (complaints != null && !complaints.isEmpty()) {
            complaintRepository.deleteAll(complaints);
        }

        // 2. Delete patient feedbacks
        List<Feedback> feedbacks = feedbackRepository.findByPatient_UserIdOrderBySubmittedDateDesc(id);
        if (feedbacks != null && !feedbacks.isEmpty()) {
            feedbackRepository.deleteAll(feedbacks);
        }

        // 3. Delete patient prescriptions
        List<Prescription> prescriptions = prescriptionRepository.findByPatient_UserId(id);
        if (prescriptions != null && !prescriptions.isEmpty()) {
            prescriptionRepository.deleteAll(prescriptions);
        }

        // 4. Delete patient appointments, payments, refunds
        List<Appointment> appointments = appointmentRepository.findByPatient_UserIdOrderByAppointmentDateDescStartTimeDesc(id);
        if (appointments != null && !appointments.isEmpty()) {
            for (Appointment appt : appointments) {
                refundRepository.findByAppointment_AppointmentId(appt.getAppointmentId())
                        .ifPresent(refundRepository::delete);
                paymentRepository.findByAppointment_AppointmentId(appt.getAppointmentId())
                        .ifPresent(paymentRepository::delete);
                appointmentRepository.delete(appt);
            }
        }

        patientRepository.delete(patient);
        auditLogService.log(1, "Ishara Gunasekara", "ADMINISTRATOR", "PATIENT_DELETED", "Patient", id,
                "Permanently removed patient record for " + patName + " (PAT" + String.format("%04d", id) + ") and all linked consultations/records",
                "CRITICAL", "127.0.0.1");
        return ResponseEntity.ok(ApiResponse.ok("Patient account (PAT" + String.format("%04d", id) + ") deleted successfully", null));
    }

    @DeleteMapping("/users/{id}")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Integer id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + id));

        if (id == 1 || "admin".equalsIgnoreCase(user.getUsername())) {
            throw new BadRequestException("The primary system administrator account (admin) is protected and cannot be deleted.");
        }

        if ("DOCTOR".equalsIgnoreCase(user.getRole())) {
            return deleteDoctor(id);
        } else if ("PATIENT".equalsIgnoreCase(user.getRole())) {
            return deletePatient(id);
        } else if (staffUserRepository.existsById(id)) {
            return deleteStaffUser(id);
        } else {
            String uName = user.getUsername();
            userRepository.delete(user);
            auditLogService.log(1, "Ishara Gunasekara", "ADMINISTRATOR", "USER_DELETED", "User", id,
                    "Deleted user account @" + uName, "CRITICAL", "127.0.0.1");
            return ResponseEntity.ok(ApiResponse.ok("User account deleted successfully", null));
        }
    }

    @PutMapping("/users/{id}/role")
    @Transactional
    public ResponseEntity<ApiResponse<User>> updateUserRole(@PathVariable Integer id, @RequestParam String newRole) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + id));

        if (id == 1 || "admin".equalsIgnoreCase(user.getUsername())) {
            throw new BadRequestException("The primary system administrator role is permanent and cannot be modified or revoked.");
        }

        String oldRole = user.getRole();
        user.setRole(newRole);
        if (staffUserRepository.existsById(id)) {
            StaffUser staff = staffUserRepository.findById(id).get();
            staff.setRole(newRole);
            staff.setStaffRole(newRole);
            staffUserRepository.save(staff);
        }
        User updated = userRepository.save(user);
        auditLogService.log(1, "Ishara Gunasekara", "ADMINISTRATOR", "USER_ROLE_CHANGED", "User", id,
                "Updated user @" + user.getUsername() + " (" + user.getFullName() + ") role from " + oldRole + " to " + newRole,
                "WARNING", "127.0.0.1");
        return ResponseEntity.ok(ApiResponse.ok("User role updated successfully to " + newRole, updated));
    }

    @PutMapping("/users/{id}/status")
    @Transactional
    public ResponseEntity<ApiResponse<User>> toggleUserStatus(@PathVariable Integer id, @RequestParam Boolean isActive) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + id));

        if ((id == 1 || "admin".equalsIgnoreCase(user.getUsername())) && Boolean.FALSE.equals(isActive)) {
            throw new BadRequestException("The primary system administrator account cannot be deactivated.");
        }

        user.setIsActive(isActive);
        User updated = userRepository.save(user);
        String statusStr = Boolean.TRUE.equals(isActive) ? "activated" : "deactivated";
        auditLogService.log(1, "Ishara Gunasekara", "ADMINISTRATOR", "USER_STATUS_TOGGLED", "User", id,
                "User account @" + user.getUsername() + " (" + user.getFullName() + ") " + statusStr + " by Administrator",
                "INFO", "127.0.0.1");
        return ResponseEntity.ok(ApiResponse.ok("User account " + statusStr + " successfully", updated));
    }
}

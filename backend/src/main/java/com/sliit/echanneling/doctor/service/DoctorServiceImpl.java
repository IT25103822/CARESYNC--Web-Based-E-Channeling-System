package com.sliit.echanneling.doctor.service;

import com.sliit.echanneling.appointment.entity.Appointment;
import com.sliit.echanneling.appointment.repository.AppointmentRepository;
import com.sliit.echanneling.common.BadRequestException;
import com.sliit.echanneling.common.ResourceNotFoundException;
import com.sliit.echanneling.doctor.dto.*;
import com.sliit.echanneling.doctor.entity.Doctor;
import com.sliit.echanneling.doctor.entity.Prescription;
import com.sliit.echanneling.doctor.repository.DoctorRepository;
import com.sliit.echanneling.doctor.repository.PrescriptionRepository;
import com.sliit.echanneling.feedback.entity.Feedback;
import com.sliit.echanneling.feedback.repository.FeedbackRepository;
import com.sliit.echanneling.patient.entity.Patient;
import com.sliit.echanneling.patient.repository.PatientRepository;
import com.sliit.echanneling.payment.entity.Payment;
import com.sliit.echanneling.payment.entity.Refund;
import com.sliit.echanneling.payment.repository.PaymentRepository;
import com.sliit.echanneling.payment.repository.RefundRepository;
import com.sliit.echanneling.schedule.entity.Schedule;
import com.sliit.echanneling.schedule.repository.ScheduleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Member 2: Adhikari A.M.S.T (IT25103821) - Doctor Management & Administration Implementation
 */
@Service
@Transactional
public class DoctorServiceImpl implements DoctorService {

    private final DoctorRepository doctorRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final FeedbackRepository feedbackRepository;
    private final ScheduleRepository scheduleRepository;
    private final PaymentRepository paymentRepository;
    private final RefundRepository refundRepository;

    @Autowired
    public DoctorServiceImpl(DoctorRepository doctorRepository,
                             PrescriptionRepository prescriptionRepository,
                             AppointmentRepository appointmentRepository,
                             PatientRepository patientRepository,
                             FeedbackRepository feedbackRepository,
                             ScheduleRepository scheduleRepository,
                             PaymentRepository paymentRepository,
                             RefundRepository refundRepository) {
        this.doctorRepository = doctorRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.appointmentRepository = appointmentRepository;
        this.patientRepository = patientRepository;
        this.feedbackRepository = feedbackRepository;
        this.scheduleRepository = scheduleRepository;
        this.paymentRepository = paymentRepository;
        this.refundRepository = refundRepository;
    }

    @Override
    public Doctor registerDoctor(DoctorRegistrationDto dto) {
        if (doctorRepository.existsByUsername(dto.getUsername())) {
            throw new BadRequestException("Username '" + dto.getUsername() + "' is already taken.");
        }
        if (doctorRepository.existsByMedicalLicenseNo(dto.getMedicalLicenseNo())) {
            throw new BadRequestException("Medical License '" + dto.getMedicalLicenseNo() + "' is already registered.");
        }
        if (doctorRepository.existsByNic(dto.getNic())) {
            throw new BadRequestException("NIC '" + dto.getNic() + "' is already registered.");
        }

        Doctor doctor = new Doctor(
                dto.getUsername(),
                dto.getPassword(),
                dto.getFullName(),
                dto.getContactNumber(),
                dto.getNic(),
                dto.getMedicalLicenseNo(),
                dto.getSpecialization(),
                dto.getQualifications(),
                dto.getConsultationFee(),
                false, // pending approval by admin
                null,
                dto.getHospitalAffiliation(),
                dto.getProfileImage()
        );

        return doctorRepository.save(doctor);
    }

    @Override
    @Transactional(readOnly = true)
    public Doctor getDoctorById(Integer doctorId) {
        return doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with ID: " + doctorId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Doctor> getAllDoctors() {
        return doctorRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Doctor> getApprovedDoctors() {
        return doctorRepository.findByIsApprovedTrue();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Doctor> getPendingDoctors() {
        return doctorRepository.findAll().stream()
                .filter(d -> Boolean.FALSE.equals(d.getIsApproved()) && d.getApprovedByAdminId() == null)
                .toList();
    }



    // ── Patient-facing methods (isApproved=true AND isActive=true) ──────────

    @Override
    @Transactional(readOnly = true)
    public List<Doctor> getActiveDoctors() {
        return doctorRepository.findByIsApprovedTrueAndIsActiveTrue();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Doctor> searchActiveDoctorsBySpecialization(String specialization) {
        return doctorRepository.findBySpecializationContainingIgnoreCaseAndIsApprovedTrueAndIsActiveTrue(specialization);
    }

    /**
     * Returns a doctor by ID only if they are both approved AND active.
     * Patient-facing endpoints should call this instead of getDoctorById().
     *
     * @throws ResourceNotFoundException if the doctor does not exist or is deactivated/unapproved.
     */
    @Override
    @Transactional(readOnly = true)
    public Doctor getActiveDoctorById(Integer doctorId) {
        Doctor doctor = getDoctorById(doctorId);
        if (Boolean.FALSE.equals(doctor.getIsActive()) || Boolean.FALSE.equals(doctor.getIsApproved())) {
            throw new ResourceNotFoundException("Doctor not available with ID: " + doctorId);
        }
        return doctor;
    }

    @Override
    public Doctor updateDoctorProfile(Integer doctorId, DoctorUpdateDto dto) {
        Doctor doctor = getDoctorById(doctorId);

        if (dto.getFullName() != null && !dto.getFullName().isBlank()) doctor.setFullName(dto.getFullName());
        if (dto.getContactNumber() != null && !dto.getContactNumber().isBlank()) doctor.setContactNumber(dto.getContactNumber());
        if (dto.getSpecialization() != null && !dto.getSpecialization().isBlank()) doctor.setSpecialization(dto.getSpecialization());
        if (dto.getQualifications() != null && !dto.getQualifications().isBlank()) doctor.setQualifications(dto.getQualifications());
        if (dto.getConsultationFee() != null) doctor.setConsultationFee(dto.getConsultationFee());
        if (dto.getHospitalAffiliation() != null) doctor.setHospitalAffiliation(dto.getHospitalAffiliation());
        if (dto.getMedicalLicenseNo() != null && !dto.getMedicalLicenseNo().isBlank()) doctor.setMedicalLicenseNo(dto.getMedicalLicenseNo());
        if (dto.getProfileImage() != null) doctor.setProfileImage(dto.getProfileImage());
        if (dto.getIsActive() != null) doctor.setIsActive(dto.getIsActive());
        if (dto.getIsApproved() != null) doctor.setIsApproved(dto.getIsApproved());

        return doctorRepository.saveAndFlush(doctor);
    }

    @Override
    public Doctor approveOrRejectDoctor(Integer doctorId, DoctorApprovalDto dto) {
        Doctor doctor = getDoctorById(doctorId);
        doctor.setIsApproved(dto.getApproved());
        doctor.setApprovedByAdminId(dto.getAdminId());
        if (Boolean.FALSE.equals(dto.getApproved())) {
            doctor.setIsActive(false);
        } else {
            doctor.setIsActive(true);
        }
        return doctorRepository.saveAndFlush(doctor);
    }

    @Override
    public Doctor toggleDoctorStatus(Integer doctorId, Boolean isActive) {
        Doctor doctor = getDoctorById(doctorId);
        doctor.setIsActive(isActive);
        return doctorRepository.saveAndFlush(doctor);
    }

    @Override
    public Prescription issuePrescription(PrescriptionCreateDto dto) {
        Appointment appointment = appointmentRepository.findById(dto.getAppointmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with ID: " + dto.getAppointmentId()));
        Doctor doctor = getDoctorById(dto.getDoctorId());
        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + dto.getPatientId()));

        Prescription prescription = new Prescription(appointment, doctor, patient, dto.getDetails());
        appointment.setAppointmentStatus("COMPLETED");
        appointmentRepository.save(appointment);

        return prescriptionRepository.save(prescription);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Prescription> getPrescriptionsByPatient(Integer patientId) {
        return prescriptionRepository.findByPatient_UserId(patientId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Prescription> getPrescriptionsByDoctor(Integer doctorId) {
        return prescriptionRepository.findByDoctor_UserId(doctorId);
    }

    @Override
    @Transactional
    public void deleteDoctor(Integer doctorId) {
        Doctor doctor = getDoctorById(doctorId);

        // 1. Delete all feedback for doctor
        List<Feedback> feedbacks = feedbackRepository.findByDoctor_UserIdOrderBySubmittedDateDesc(doctorId);
        if (feedbacks != null && !feedbacks.isEmpty()) {
            feedbackRepository.deleteAll(feedbacks);
        }

        // 2. Delete all prescriptions issued by doctor
        List<Prescription> prescriptions = prescriptionRepository.findByDoctor_UserId(doctorId);
        if (prescriptions != null && !prescriptions.isEmpty()) {
            prescriptionRepository.deleteAll(prescriptions);
        }

        // 3. For all appointments of this doctor: delete related refunds and payments, then appointments
        List<Appointment> appointments = appointmentRepository.findByDoctor_UserIdOrderByAppointmentDateDescStartTimeDesc(doctorId);
        if (appointments != null && !appointments.isEmpty()) {
            for (Appointment appt : appointments) {
                Optional<Refund> refundOpt = refundRepository.findByAppointment_AppointmentId(appt.getAppointmentId());
                refundOpt.ifPresent(refundRepository::delete);

                Optional<Payment> paymentOpt = paymentRepository.findByAppointment_AppointmentId(appt.getAppointmentId());
                paymentOpt.ifPresent(paymentRepository::delete);

                appointmentRepository.delete(appt);
            }
        }

        // 4. Delete doctor schedules (and their cascaded timeslots)
        List<Schedule> schedules = scheduleRepository.findByDoctor_UserIdOrderByScheduleDateAscStartTimeAsc(doctorId);
        if (schedules != null && !schedules.isEmpty()) {
            scheduleRepository.deleteAll(schedules);
        }

        // 5. Delete doctor entity (removes from Doctors and Users joined table)
        doctorRepository.delete(doctor);
    }
}

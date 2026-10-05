package com.sliit.echanneling.appointment.service;

import com.sliit.echanneling.appointment.dto.BookAppointmentDto;
import com.sliit.echanneling.appointment.dto.RescheduleAppointmentDto;
import com.sliit.echanneling.appointment.entity.Appointment;
import com.sliit.echanneling.appointment.repository.AppointmentRepository;
import com.sliit.echanneling.common.BadRequestException;
import com.sliit.echanneling.common.ResourceNotFoundException;
import com.sliit.echanneling.doctor.entity.Doctor;
import com.sliit.echanneling.doctor.repository.DoctorRepository;
import com.sliit.echanneling.patient.entity.Patient;
import com.sliit.echanneling.patient.repository.PatientRepository;
import com.sliit.echanneling.schedule.entity.Schedule;
import com.sliit.echanneling.schedule.entity.Timeslot;
import com.sliit.echanneling.schedule.repository.ScheduleRepository;
import com.sliit.echanneling.schedule.repository.TimeslotRepository;
import com.sliit.echanneling.schedule.service.RealtimeTimeExpirationService;
import com.sliit.echanneling.payment.repository.PaymentRepository;
import com.sliit.echanneling.payment.repository.ReceiptRepository;
import com.sliit.echanneling.payment.repository.RefundRepository;
import com.sliit.echanneling.doctor.repository.PrescriptionRepository;
import com.sliit.echanneling.feedback.repository.FeedbackRepository;
import com.sliit.echanneling.schedule.repository.QueueNotificationRepository;
import com.sliit.echanneling.schedule.entity.QueueNotification;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/**
 * Member 4: Devindra P.P.C.G (IT25103823) - Appointment Management Implementation
 */
@Service
@Transactional
public class AppointmentServiceImpl implements AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final ScheduleRepository scheduleRepository;
    private final TimeslotRepository timeslotRepository;
    private final RealtimeTimeExpirationService expirationService;
    private final com.sliit.echanneling.audit.service.AuditLogService auditLogService;
    private final PaymentRepository paymentRepository;
    private final ReceiptRepository receiptRepository;
    private final RefundRepository refundRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final FeedbackRepository feedbackRepository;
    private final QueueNotificationRepository queueNotificationRepository;

    @Autowired
    public AppointmentServiceImpl(AppointmentRepository appointmentRepository,
                                  PatientRepository patientRepository,
                                  DoctorRepository doctorRepository,
                                  ScheduleRepository scheduleRepository,
                                  TimeslotRepository timeslotRepository,
                                  RealtimeTimeExpirationService expirationService,
                                  com.sliit.echanneling.audit.service.AuditLogService auditLogService,
                                  PaymentRepository paymentRepository,
                                  ReceiptRepository receiptRepository,
                                  RefundRepository refundRepository,
                                  PrescriptionRepository prescriptionRepository,
                                  FeedbackRepository feedbackRepository,
                                  QueueNotificationRepository queueNotificationRepository) {
        this.appointmentRepository = appointmentRepository;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
        this.scheduleRepository = scheduleRepository;
        this.timeslotRepository = timeslotRepository;
        this.expirationService = expirationService;
        this.auditLogService = auditLogService;
        this.paymentRepository = paymentRepository;
        this.receiptRepository = receiptRepository;
        this.refundRepository = refundRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.feedbackRepository = feedbackRepository;
        this.queueNotificationRepository = queueNotificationRepository;
    }

    @Override
    public Appointment bookAppointment(BookAppointmentDto dto) {
        expirationService.syncAllExpiredRecords();

        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + dto.getPatientId()));
        Doctor doctor = doctorRepository.findById(dto.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with ID: " + dto.getDoctorId()));
        Schedule schedule = scheduleRepository.findById(dto.getScheduleId())
                .orElseThrow(() -> new ResourceNotFoundException("Schedule not found with ID: " + dto.getScheduleId()));
        Timeslot timeslot = timeslotRepository.findById(dto.getTimeslotId())
                .orElseThrow(() -> new ResourceNotFoundException("Timeslot not found with ID: " + dto.getTimeslotId()));

        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        // Enforce Real-time Expiration: Cannot book a slot whose time has already passed
        if (dto.getAppointmentDate().isBefore(today) ||
            (dto.getAppointmentDate().isEqual(today) && timeslot.getSlotTime().isBefore(now))) {
            timeslot.setSlotStatus("EXPIRED");
            timeslotRepository.save(timeslot);
            throw new BadRequestException("Selected timeslot (Slot #" + timeslot.getSlotNo() + " at " + timeslot.getSlotTime() + ") has already expired.");
        }

        if (!"AVAILABLE".equalsIgnoreCase(timeslot.getSlotStatus())) {
            throw new BadRequestException("Selected timeslot (Slot #" + timeslot.getSlotNo() + ") is no longer available.");
        }

        // Atomically mark timeslot as BOOKED
        timeslot.setSlotStatus("BOOKED");
        timeslotRepository.save(timeslot);

        Appointment appointment = new Appointment(
                patient,
                doctor,
                schedule,
                timeslot,
                dto.getAppointmentDate(),
                dto.getStartTime(),
                dto.getEndTime(),
                "CONFIRMED"
        );

        Appointment savedAppt = appointmentRepository.save(appointment);
        auditLogService.log(patient.getUserId(), patient.getFullName(), "PATIENT", "APPOINTMENT_BOOKED", "Appointment", savedAppt.getAppointmentId(),
                "Patient " + patient.getFullName() + " booked Slot #" + timeslot.getSlotNo() + " with Dr. " + doctor.getFullName() + 
                " (" + doctor.getSpecialization() + ") for " + dto.getAppointmentDate() + " (" + dto.getStartTime() + " - " + dto.getEndTime() + ")",
                "SUCCESS", "127.0.0.1");
        return savedAppt;
    }

    @Override
    @Transactional
    public Appointment getAppointmentById(Integer appointmentId) {
        expirationService.syncAllExpiredRecords();
        return appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with ID: " + appointmentId));
    }

    @Override
    @Transactional
    public List<Appointment> getAppointmentsByPatient(Integer patientId) {
        expirationService.syncAllExpiredRecords();
        return appointmentRepository.findByPatient_UserIdOrderByAppointmentDateDescStartTimeDesc(patientId);
    }

    @Override
    @Transactional
    public List<Appointment> getAppointmentsByDoctor(Integer doctorId) {
        expirationService.syncAllExpiredRecords();
        return appointmentRepository.findByDoctor_UserIdOrderByAppointmentDateDescStartTimeDesc(doctorId);
    }

    @Override
    @Transactional
    public List<Appointment> getAllAppointments() {
        expirationService.syncAllExpiredRecords();
        return appointmentRepository.findAll();
    }

    @Override
    public Appointment rescheduleAppointment(Integer appointmentId, RescheduleAppointmentDto dto) {
        expirationService.syncAllExpiredRecords();
        Appointment appointment = getAppointmentById(appointmentId);

        if ("CANCELLED".equalsIgnoreCase(appointment.getAppointmentStatus())) {
            throw new BadRequestException("Cannot reschedule a cancelled appointment.");
        }

        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        // Cannot reschedule an appointment that has already elapsed
        LocalTime pastCheckTime = appointment.getEndTime() != null ? appointment.getEndTime() : appointment.getStartTime();
        if (appointment.getAppointmentDate().isBefore(today) ||
            (appointment.getAppointmentDate().isEqual(today) && pastCheckTime.isBefore(now))) {
            throw new BadRequestException("Cannot reschedule an appointment that has already taken place.");
        }

        // Check target slot
        Schedule newSchedule = scheduleRepository.findById(dto.getNewScheduleId())
                .orElseThrow(() -> new ResourceNotFoundException("New Schedule not found with ID: " + dto.getNewScheduleId()));
        Timeslot newSlot = timeslotRepository.findById(dto.getNewTimeslotId())
                .orElseThrow(() -> new ResourceNotFoundException("New Timeslot not found with ID: " + dto.getNewTimeslotId()));

        if (dto.getNewAppointmentDate().isBefore(today) ||
            (dto.getNewAppointmentDate().isEqual(today) && newSlot.getSlotTime().isBefore(now))) {
            newSlot.setSlotStatus("EXPIRED");
            timeslotRepository.save(newSlot);
            throw new BadRequestException("Target timeslot has expired. Please select an upcoming timeslot.");
        }

        if (!"AVAILABLE".equalsIgnoreCase(newSlot.getSlotStatus())) {
            throw new BadRequestException("The target timeslot is already booked. Please pick another slot.");
        }

        // Release current timeslot back to AVAILABLE
        Timeslot oldSlot = appointment.getTimeslot();
        if (oldSlot != null) {
            oldSlot.setSlotStatus("AVAILABLE");
            timeslotRepository.save(oldSlot);
        }

        newSlot.setSlotStatus("BOOKED");
        timeslotRepository.save(newSlot);

        appointment.setSchedule(newSchedule);
        appointment.setTimeslot(newSlot);
        appointment.setAppointmentDate(dto.getNewAppointmentDate());
        appointment.setStartTime(dto.getNewStartTime());
        appointment.setEndTime(dto.getNewEndTime());
        appointment.setAppointmentStatus("RESCHEDULED");

        return appointmentRepository.save(appointment);
    }

    @Override
    public Appointment cancelAppointment(Integer appointmentId) {
        expirationService.syncAllExpiredRecords();
        Appointment appointment = getAppointmentById(appointmentId);

        if ("CANCELLED".equalsIgnoreCase(appointment.getAppointmentStatus())) {
            return appointment; // already cancelled
        }

        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        LocalTime pastCheckTime = appointment.getEndTime() != null ? appointment.getEndTime() : appointment.getStartTime();
        if (appointment.getAppointmentDate().isBefore(today) ||
            (appointment.getAppointmentDate().isEqual(today) && pastCheckTime.isBefore(now))) {
            throw new BadRequestException("Cannot cancel an appointment that has already taken place.");
        }

        // 2-Day (48-Hour) Cancellation Window Enforcement
        LocalDateTime bookedAt = appointment.getBookingDate() != null ? appointment.getBookingDate() : appointment.getCreatedAt();
        if (bookedAt != null) {
            long minutesSinceBooking = Duration.between(bookedAt, LocalDateTime.now()).toMinutes();
            if (minutesSinceBooking > 48 * 60) {
                long hoursSinceBooking = minutesSinceBooking / 60;
                long remainingMins = minutesSinceBooking % 60;
                long daysSinceBooking = hoursSinceBooking / 24;
                throw new BadRequestException("Cancellation window expired: Appointments can only be cancelled within 2 days (48 hours) of booking. This appointment was booked " 
                        + (daysSinceBooking > 0 ? daysSinceBooking + "d " : "") + (hoursSinceBooking % 24) + "h " + remainingMins + "m ago. Cancellation is no longer permitted.");
            }
        }

        // Release timeslot
        Timeslot slot = appointment.getTimeslot();
        if (slot != null) {
            slot.setSlotStatus("AVAILABLE");
            timeslotRepository.save(slot);
        }

        appointment.setAppointmentStatus("CANCELLED");
        Appointment saved = appointmentRepository.save(appointment);

        String patientName = (appointment.getPatient() != null && appointment.getPatient().getFullName() != null) ? appointment.getPatient().getFullName() : "Patient";
        Integer patientId = appointment.getPatient() != null ? appointment.getPatient().getUserId() : null;
        String doctorName = (appointment.getDoctor() != null && appointment.getDoctor().getFullName() != null) ? appointment.getDoctor().getFullName() : "Doctor";

        auditLogService.log(patientId, patientName, "PATIENT", "APPOINTMENT_CANCELLED", "Appointment", appointmentId,
                "Patient " + patientName + " cancelled Appointment #" + appointmentId + " with Dr. " + doctorName + " scheduled for " + appointment.getAppointmentDate(),
                "WARNING", "127.0.0.1");

        return saved;
    }

    @Override
    @Transactional
    public void deleteAppointment(Integer appointmentId) {
        Appointment appointment = getAppointmentById(appointmentId);

        // 1. Delete associated Refund if exists
        refundRepository.findByAppointment_AppointmentId(appointmentId)
                .ifPresent(refundRepository::delete);

        // 2. Delete associated Receipt if exists
        receiptRepository.findByPayment_Appointment_AppointmentId(appointmentId)
                .ifPresent(receiptRepository::delete);

        // 3. Delete associated Payment if exists
        paymentRepository.findByAppointment_AppointmentId(appointmentId)
                .ifPresent(paymentRepository::delete);

        // 4. Delete associated Prescription if exists
        prescriptionRepository.findByAppointment_AppointmentId(appointmentId)
                .ifPresent(prescriptionRepository::delete);

        // 5. Delete associated Feedback if exists
        feedbackRepository.findByAppointment_AppointmentId(appointmentId)
                .ifPresent(feedbackRepository::delete);

        // 6. Delete associated QueueNotifications if any
        if (appointment.getSchedule() != null) {
            List<QueueNotification> notifications = queueNotificationRepository.findByScheduleIdOrderBySentAtDesc(appointment.getSchedule().getScheduleId());
            for (QueueNotification qn : notifications) {
                if (appointmentId.equals(qn.getAppointmentId())) {
                    queueNotificationRepository.delete(qn);
                }
            }
        }

        // 7. If timeslot was associated, restore it to AVAILABLE (or EXPIRED if past)
        Timeslot slot = appointment.getTimeslot();
        if (slot != null) {
            LocalDate today = LocalDate.now();
            LocalTime now = LocalTime.now();
            LocalDate appDate = appointment.getAppointmentDate();
            boolean isExpired = (appDate != null && (appDate.isBefore(today) || (appDate.isEqual(today) && slot.getSlotTime() != null && slot.getSlotTime().isBefore(now))));
            slot.setSlotStatus(isExpired ? "EXPIRED" : "AVAILABLE");
            timeslotRepository.save(slot);
        }

        // 8. Delete the Appointment
        appointmentRepository.delete(appointment);

        // 9. Audit log
        String patientName = (appointment.getPatient() != null && appointment.getPatient().getFullName() != null) ? appointment.getPatient().getFullName() : "Patient";
        auditLogService.log(null, "System Administrator / Coordinator", "STAFF", "APPOINTMENT_DELETED", "Appointment", appointmentId,
                "Permanently deleted Appointment #" + appointmentId + " for patient " + patientName,
                "WARNING", "127.0.0.1");
    }
}

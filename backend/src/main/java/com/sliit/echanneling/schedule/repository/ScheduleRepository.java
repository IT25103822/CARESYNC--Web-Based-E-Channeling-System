package com.sliit.echanneling.schedule.repository;

import com.sliit.echanneling.schedule.entity.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

/**
 * Member 5: Yapa Bandara Y.M.M.P.P.D (IT25103824) - Doctor Schedule Management
 */
@Repository
public interface ScheduleRepository extends JpaRepository<Schedule, Integer> {
    List<Schedule> findByDoctor_UserIdOrderByScheduleDateAscStartTimeAsc(Integer doctorId);
    List<Schedule> findByScheduleDateGreaterThanEqualAndStatusNotOrderByScheduleDateAsc(LocalDate date, String status);
    List<Schedule> findByDoctor_UserIdAndScheduleDateGreaterThanEqualAndStatusNotOrderByScheduleDateAsc(Integer doctorId, LocalDate date, String status);
    List<Schedule> findByDoctor_UserIdAndScheduleDate(Integer doctorId, LocalDate scheduleDate);
}

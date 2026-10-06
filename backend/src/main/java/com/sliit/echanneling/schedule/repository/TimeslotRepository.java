package com.sliit.echanneling.schedule.repository;

import com.sliit.echanneling.schedule.entity.Timeslot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Member 5: Yapa Bandara Y.M.M.P.P.D (IT25103824) - Timeslot Repository
 */
@Repository
public interface TimeslotRepository extends JpaRepository<Timeslot, Integer> {
    List<Timeslot> findBySchedule_ScheduleIdOrderBySlotNoAsc(Integer scheduleId);
    List<Timeslot> findBySchedule_ScheduleIdAndSlotStatus(Integer scheduleId, String slotStatus);

    @Query("SELECT t FROM Timeslot t JOIN FETCH t.schedule WHERE t.slotStatus = 'AVAILABLE'")
    List<Timeslot> findAvailableWithSchedule();
}

import Attendance from '../models/Attendance.js';
import { normalizeToMidnightUTC } from '../models/Leave.js';

/**
 * Syncs an approved leave to the daily Attendance records
 * Ensures an employee is marked as ON_LEAVE without overwriting active punches
 */
export const syncApprovedLeaveToAttendance = async (leave) => {
  try {
    const start = normalizeToMidnightUTC(leave.startDate);
    const end = normalizeToMidnightUTC(leave.endDate);

    const cur = new Date(start);
    while (cur <= end) {
      const dayDate = normalizeToMidnightUTC(cur);

      // Check if an attendance record exists for this employee on this date
      const existing = await Attendance.findOne({
        employee: leave.employee,
        date: dayDate,
      });

      if (!existing) {
        // Create new ON_LEAVE attendance record
        await Attendance.create({
          employee: leave.employee,
          date: dayDate,
          status: 'ON_LEAVE',
          remarks: `Approved Leave (${leave.leaveType})`,
        });
      } else {
        // If an existing record is ABSENT or has no punch-in/out, update it to ON_LEAVE
        if (
          existing.status === 'ABSENT' ||
          (!existing.checkIn && existing.status !== 'PRESENT' && existing.status !== 'HALF_DAY')
        ) {
          existing.status = 'ON_LEAVE';
          existing.remarks = `Approved Leave (${leave.leaveType})`;
          await existing.save();
        }
      }

      cur.setUTCDate(cur.getUTCDate() + 1);
    }
  } catch (error) {
    console.error('Error syncing approved leave to attendance:', error.message);
  }
};

/**
 * Reverts auto-generated ON_LEAVE attendance records when an approved leave is cancelled
 */
export const revertApprovedLeaveFromAttendance = async (leave) => {
  try {
    const start = normalizeToMidnightUTC(leave.startDate);
    const end = normalizeToMidnightUTC(leave.endDate);

    const cur = new Date(start);
    while (cur <= end) {
      const dayDate = normalizeToMidnightUTC(cur);

      const existing = await Attendance.findOne({
        employee: leave.employee,
        date: dayDate,
        status: 'ON_LEAVE',
      });

      // Remove only if there are no real punches attached
      if (existing && !existing.checkIn && !existing.checkOut) {
        await Attendance.deleteOne({ _id: existing._id });
      }

      cur.setUTCDate(cur.getUTCDate() + 1);
    }
  } catch (error) {
    console.error('Error reverting leave from attendance:', error.message);
  }
};

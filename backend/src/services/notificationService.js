import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import { logger } from '../utils/logger.js';

/**
 * Resolves a User ID whether passed a User ID, User doc, Employee ID, or Employee doc
 */
const resolveUserId = async (recipient) => {
  if (!recipient) return null;
  if (recipient._id && recipient.email && recipient.role) {
    return recipient._id; // User document
  }
  if (recipient.userId) {
    return recipient.userId; // Employee document with linked userId
  }

  const id = recipient._id || recipient;

  // Check if this ID is a User
  const isUser = await User.exists({ _id: id });
  if (isUser) return id;

  // Check if this ID is an Employee
  const employee = await Employee.findById(id).select('userId');
  if (employee && employee.userId) return employee.userId;

  return null;
};

/**
 * Creates a single notification with deduplication safeguard
 */
export const createNotification = async ({
  recipient,
  type,
  title,
  message,
  relatedEntityType = null,
  relatedEntityId = null,
}) => {
  try {
    const userId = await resolveUserId(recipient);
    if (!userId) {
      logger.warn(`Could not resolve recipient user for notification: ${title}`);
      return null;
    }

    // Deduplication check: prevent duplicate notifications within a 5-second window
    const recentDuplicate = await Notification.findOne({
      recipient: userId,
      type,
      relatedEntityId,
      createdAt: { $gte: new Date(Date.now() - 5000) },
    });

    if (recentDuplicate) {
      return recentDuplicate;
    }

    const notification = await Notification.create({
      recipient: userId,
      type,
      title: title.trim(),
      message: message.trim(),
      relatedEntityType,
      relatedEntityId,
      isRead: false,
    });
    
    try {
      const { getIO } = await import('../socket.js');
      const io = getIO();
      if (io) {
        io.to(userId.toString()).emit('notification:new', notification);
      }
    } catch (err) {
      logger.warn(`Failed to emit socket notification: ${err.message}`);
    }

    return notification;
  } catch (error) {
    logger.error(`Failed to create notification: ${error.message}`);
    return null;
  }
};

/**
 * Notify multiple recipients in bulk
 */
export const notifyUsers = async (recipients, notificationData) => {
  if (!Array.isArray(recipients) || recipients.length === 0) return [];
  const results = [];
  for (const recipient of recipients) {
    const res = await createNotification({ ...notificationData, recipient });
    if (res) results.push(res);
  }
  return results;
};

/**
 * Helper: Notify HR and/or Reporting Manager when an employee applies for leave
 */
export const notifyLeaveApplied = async (leave, employee) => {
  try {
    const notifications = [];

    // 1. Notify direct reporting manager if configured
    if (employee.reportingManagerId) {
      const managerEmpId = employee.reportingManagerId?._id || employee.reportingManagerId;
      const managerEmp = await Employee.findById(managerEmpId).select('userId');
      if (managerEmp?.userId) {
        const notif = await createNotification({
          recipient: managerEmp.userId,
          type: 'LEAVE_APPLIED',
          title: 'New Leave Request Submitted',
          message: `${employee.firstName} ${employee.lastName} requested ${leave.numberOfDays} day(s) of ${leave.leaveType} leave.`,
          relatedEntityType: 'LEAVE',
          relatedEntityId: leave._id,
        });
        if (notif) notifications.push(notif);
      }
    }

    // 2. Notify HR users
    const hrUsers = await User.find({ role: 'HR', isActive: true }).select('_id');
    for (const hr of hrUsers) {
      const notif = await createNotification({
        recipient: hr._id,
        type: 'LEAVE_APPLIED',
        title: 'New Leave Request Received',
        message: `${employee.firstName} ${employee.lastName} (${employee.employeeCode}) submitted a ${leave.leaveType} leave application.`,
        relatedEntityType: 'LEAVE',
        relatedEntityId: leave._id,
      });
      if (notif) notifications.push(notif);
    }

    return notifications;
  } catch (error) {
    logger.error(`Error notifying on leave apply: ${error.message}`);
    return [];
  }
};

/**
 * Helper: Notify employee when leave is approved
 */
export const notifyLeaveApproved = async (leave, reviewerName = 'Reviewer') => {
  try {
    let userId = leave.employee?.userId;
    if (!userId) {
      const emp = await Employee.findById(leave.employee?._id || leave.employee).select('userId');
      userId = emp?.userId;
    }
    if (!userId) return null;

    return await createNotification({
      recipient: userId,
      type: 'LEAVE_APPROVED',
      title: 'Leave Request Approved',
      message: `Your ${leave.leaveType} leave request for ${leave.numberOfDays} day(s) has been approved by ${reviewerName}.`,
      relatedEntityType: 'LEAVE',
      relatedEntityId: leave._id,
    });
  } catch (error) {
    logger.error(`Error notifying leave approval: ${error.message}`);
    return null;
  }
};

/**
 * Helper: Notify employee when leave is rejected
 */
export const notifyLeaveRejected = async (leave, reviewerName = 'Reviewer', comment = '') => {
  try {
    let userId = leave.employee?.userId;
    if (!userId) {
      const emp = await Employee.findById(leave.employee?._id || leave.employee).select('userId');
      userId = emp?.userId;
    }
    if (!userId) return null;

    const commentMsg = comment ? ` Reason: "${comment}".` : '';
    return await createNotification({
      recipient: userId,
      type: 'LEAVE_REJECTED',
      title: 'Leave Request Rejected',
      message: `Your ${leave.leaveType} leave request has been rejected by ${reviewerName}.${commentMsg}`,
      relatedEntityType: 'LEAVE',
      relatedEntityId: leave._id,
    });
  } catch (error) {
    logger.error(`Error notifying leave rejection: ${error.message}`);
    return null;
  }
};

/**
 * Helper: Notify reviewer when an approved leave is cancelled
 */
export const notifyLeaveCancelled = async (leave, employeeName = 'Employee') => {
  try {
    if (!leave.reviewedBy) return null;
    let reviewerUserId = leave.reviewedBy?.userId;
    if (!reviewerUserId) {
      const reviewerEmp = await Employee.findById(leave.reviewedBy?._id || leave.reviewedBy).select('userId');
      reviewerUserId = reviewerEmp?.userId;
    }
    if (!reviewerUserId) return null;

    return await createNotification({
      recipient: reviewerUserId,
      type: 'LEAVE_CANCELLED',
      title: 'Approved Leave Request Cancelled',
      message: `${employeeName} has cancelled their approved ${leave.leaveType} leave (${leave.numberOfDays} days).`,
      relatedEntityType: 'LEAVE',
      relatedEntityId: leave._id,
    });
  } catch (error) {
    logger.error(`Error notifying leave cancellation: ${error.message}`);
    return null;
  }
};

/**
 * Helper: Notify assigned employee when a task is assigned or reassigned
 */
export const notifyTaskAssigned = async (task, assignerName = 'Manager') => {
  try {
    let userId = task.assignedTo?.userId;
    if (!userId) {
      const emp = await Employee.findById(task.assignedTo?._id || task.assignedTo).select('userId');
      userId = emp?.userId;
    }
    if (!userId) return null;

    return await createNotification({
      recipient: userId,
      type: 'TASK_ASSIGNED',
      title: 'New Task Assigned',
      message: `You were assigned task "${task.title}" by ${assignerName}. Priority: ${task.priority}.`,
      relatedEntityType: 'TASK',
      relatedEntityId: task._id,
    });
  } catch (error) {
    logger.error(`Error notifying task assignment: ${error.message}`);
    return null;
  }
};

/**
 * Helper: Notify task assigner when task status changes or completes
 */
export const notifyTaskStatusChanged = async (task, updaterName = 'Assignee', newStatus) => {
  try {
    const assignerUserId = task.assignedBy?._id || task.assignedBy;
    if (!assignerUserId) return null;

    const isCompleted = newStatus === 'COMPLETED';
    const type = isCompleted ? 'TASK_COMPLETED' : 'TASK_STATUS_CHANGED';
    const title = isCompleted ? 'Task Marked Completed' : 'Task Status Updated';

    return await createNotification({
      recipient: assignerUserId,
      type,
      title,
      message: `Task "${task.title}" was moved to status ${newStatus} by ${updaterName}.`,
      relatedEntityType: 'TASK',
      relatedEntityId: task._id,
    });
  } catch (error) {
    logger.error(`Error notifying task status update: ${error.message}`);
    return null;
  }
};

export default {
  createNotification,
  notifyUsers,
  notifyLeaveApplied,
  notifyLeaveApproved,
  notifyLeaveRejected,
  notifyLeaveCancelled,
  notifyTaskAssigned,
  notifyTaskStatusChanged,
};

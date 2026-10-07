import Employee from '../models/Employee.js';
import Department from '../models/Department.js';
import Attendance from '../models/Attendance.js';
import Leave from '../models/Leave.js';
import Task from '../models/Task.js';
import Notification from '../models/Notification.js';
import ActivityLog from '../models/ActivityLog.js';

export const getOverview = async (req, res) => {
  try {
    const role = req.user.role;
    const employeeId = req.user.employeeId;

    let employeeMatch = {};
    let attendanceMatch = {};
    let leaveMatch = {};
    let taskMatch = {};
    let notifMatch = { recipient: req.user._id }; 
    let activityMatch = {};

    if (role === 'EMPLOYEE') {
      if (!employeeId) throw new Error("Employee profile missing");
      employeeMatch = { _id: employeeId };
      attendanceMatch = { employee: employeeId };
      leaveMatch = { employee: employeeId };
      taskMatch = { assignedTo: employeeId };
      activityMatch = { entityId: employeeId }; 
    } else if (role === 'MANAGER') {
      if (!employeeId) throw new Error("Employee profile missing for Manager");
      const teamEmployees = await Employee.find({ reportingManagerId: employeeId }).select('_id');
      const teamIds = teamEmployees.map(e => e._id);
      teamIds.push(employeeId); 

      employeeMatch = { _id: { $in: teamIds } };
      attendanceMatch = { employee: { $in: teamIds } };
      leaveMatch = { employee: { $in: teamIds } };
      taskMatch = { assignedTo: { $in: teamIds } };
    } 

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalEmployees = await Employee.countDocuments(employeeMatch);
    const activeEmployees = await Employee.countDocuments({ ...employeeMatch, status: 'ACTIVE' });
    const departmentCount = await Department.countDocuments(); 

    const todayAttendance = await Attendance.aggregate([
      { $match: { ...attendanceMatch, date: { $gte: today } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const presentCount = todayAttendance.find(a => a._id === 'PRESENT')?.count || 0;
    const absentCount = todayAttendance.find(a => a._id === 'ABSENT')?.count || 0;
    const onLeaveCount = todayAttendance.find(a => a._id === 'ON_LEAVE')?.count || 0;

    const leaveStats = await Leave.aggregate([
      { $match: leaveMatch },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    const pendingLeaves = leaveStats.find(l => l._id === 'PENDING')?.count || 0;
    const approvedLeaves = leaveStats.find(l => l._id === 'APPROVED')?.count || 0;
    const rejectedLeaves = leaveStats.find(l => l._id === 'REJECTED')?.count || 0;

    const taskStats = await Task.aggregate([
      { $match: taskMatch },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    const todoTasks = taskStats.find(t => t._id === 'TODO')?.count || 0;
    const inProgressTasks = taskStats.find(t => t._id === 'IN_PROGRESS')?.count || 0;
    const reviewTasks = taskStats.find(t => t._id === 'REVIEW')?.count || 0;
    const completedTasks = taskStats.find(t => t._id === 'COMPLETED')?.count || 0;

    const overdueTasks = await Task.countDocuments({
      ...taskMatch,
      status: { $nin: ['COMPLETED', 'CANCELLED'] },
      dueDate: { $lt: new Date() }
    });

    const activeTasks = todoTasks + inProgressTasks + reviewTasks;

    const unreadNotifications = await Notification.countDocuments({ ...notifMatch, isRead: false });
    const recentActivity = await ActivityLog.find(activityMatch).sort({ createdAt: -1 }).limit(5);
    
    let personalBalances = null;
    let personalTodayHours = 0;
    if (role === 'EMPLOYEE' && employeeId) {
      const emp = await Employee.findById(employeeId);
      personalBalances = emp?.leaveBalances;
      const myTodayAtt = await Attendance.findOne({ employee: employeeId, date: { $gte: today } });
      personalTodayHours = myTodayAtt?.workHours || 0;
    }

    res.json({
      success: true,
      data: {
        role,
        employees: {
          total: totalEmployees,
          active: activeEmployees,
          departments: departmentCount
        },
        attendance: {
          presentToday: presentCount,
          absentToday: absentCount,
          onLeaveToday: onLeaveCount,
          personalTodayHours,
        },
        leaves: {
          pending: pendingLeaves,
          approved: approvedLeaves,
          rejected: rejectedLeaves,
          personalBalances
        },
        tasks: {
          active: activeTasks,
          todo: todoTasks,
          inProgress: inProgressTasks,
          review: reviewTasks,
          completed: completedTasks,
          overdue: overdueTasks
        },
        notifications: {
          unread: unreadNotifications
        },
        recentActivity
      }
    });

  } catch (error) {
    console.error('Dashboard Controller Error:', error);
    res.status(500).json({ success: false, error: 'Dashboard error: ' + error.message });
  }
};

import Team from '../models/Team.js';
import Employee from '../models/Employee.js';
import { logActivity } from '../services/activityService.js';
import { notifyUsers } from '../services/notificationService.js';

export const createTeam = async (req, res, next) => {
  try {
    const { name, description, departmentId, teamLeadId, members } = req.body;

    if (!name || !teamLeadId) {
      return res.status(400).json({ success: false, message: 'Name and Team Lead are required' });
    }

    const team = new Team({
      name: name.trim(),
      description: description?.trim() || '',
      departmentId: departmentId || null,
      teamLeadId,
      members: members || [],
    });

    await team.save();

    logActivity({
      actor: req.user._id,
      action: 'TEAM_CREATED',
      entityType: 'TEAM',
      entityId: team._id,
      description: `Team "${team.name}" was created`,
    });

    await team.populate('teamLeadId', 'firstName lastName email employeeCode');
    await team.populate('departmentId', 'name');

    // Notify initial members
    if (members && members.length > 0) {
      notifyUsers(members, {
        type: 'TEAM_MEMBER_ADDED',
        title: 'Added to Team',
        message: `You have been added to the team "${team.name}" by ${req.user.email}.`,
        relatedEntityType: 'TEAM',
        relatedEntityId: team._id,
      });
    }

    res.status(201).json({ success: true, data: team });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Team name already exists' });
    }
    next(error);
  }
};

export const getTeams = async (req, res, next) => {
  try {
    const query = {};
    if (req.user.role === 'MANAGER') {
      const managerEmp = await Employee.findById(req.user.employeeId);
      if (managerEmp?.departmentId) {
        query.departmentId = managerEmp.departmentId;
      }
    }

    const teams = await Team.find(query)
      .populate('teamLeadId', 'firstName lastName employeeCode')
      .populate('departmentId', 'name')
      .populate('members', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: teams });
  } catch (error) {
    next(error);
  }
};

export const getMyTeams = async (req, res, next) => {
  try {
    const empId = req.user.employeeId;
    if (!empId) {
      return res.status(404).json({ success: false, message: 'Employee profile not found' });
    }

    const teams = await Team.find({
      $or: [{ teamLeadId: empId }, { members: empId }]
    })
      .populate({
        path: 'teamLeadId',
        select: 'firstName lastName employeeCode designation profilePicture departmentId userId',
        populate: [
          { path: 'userId', select: 'email role' },
          { path: 'departmentId', select: 'name' }
        ]
      })
      .populate({
        path: 'members',
        select: 'firstName lastName employeeCode designation profilePicture departmentId userId phone',
        populate: [
          { path: 'userId', select: 'email role' },
          { path: 'departmentId', select: 'name' }
        ]
      })
      .populate('departmentId', 'name')
      .sort({ name: 1 });

    res.status(200).json({ success: true, data: teams });
  } catch (error) {
    next(error);
  }
};

export const getTeamById = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate({
        path: 'members',
        select: 'firstName lastName employeeCode designation profilePicture userId departmentId',
        populate: [
          { path: 'userId', select: 'email role' },
          { path: 'departmentId', select: 'name' }
        ]
      })
      .populate({
        path: 'teamLeadId',
        select: 'firstName lastName employeeCode designation profilePicture userId',
        populate: { path: 'userId', select: 'email role' }
      })
      .populate('departmentId', 'name');

    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

    res.status(200).json({ success: true, data: team });
  } catch (error) {
    next(error);
  }
};

export const updateTeam = async (req, res, next) => {
  try {
    const { name, description, departmentId, teamLeadId, isActive } = req.body;
    
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

    if (name) team.name = name.trim();
    if (description !== undefined) team.description = description.trim();
    if (departmentId !== undefined) team.departmentId = departmentId || null;
    if (teamLeadId) team.teamLeadId = teamLeadId;
    if (isActive !== undefined) team.isActive = isActive;

    await team.save();

    res.status(200).json({ success: true, data: team });
  } catch (error) {
    next(error);
  }
};

export const updateTeamMembers = async (req, res, next) => {
  try {
    const { members } = req.body; // array of employee IDs
    
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

    if (req.user.role === 'EMPLOYEE' && team.teamLeadId.toString() !== req.user.employeeId?.toString()) {
      return res.status(403).json({ success: false, message: 'Only Admin, HR, or the Team Lead can modify members' });
    }

    const oldMembers = team.members.map(m => m.toString());
    const newMembers = members.map(m => m.toString());

    const added = newMembers.filter(m => !oldMembers.includes(m));
    const removed = oldMembers.filter(m => !newMembers.includes(m));

    team.members = members;
    await team.save();

    // Notifications
    if (added.length > 0) {
      notifyUsers(added, {
        type: 'TEAM_MEMBER_ADDED',
        title: 'Added to Team',
        message: `You have been added to the team "${team.name}" by ${req.user.email}.`,
        relatedEntityType: 'TEAM',
        relatedEntityId: team._id,
      });
    }

    if (removed.length > 0) {
      notifyUsers(removed, {
        type: 'TEAM_MEMBER_REMOVED',
        title: 'Removed from Team',
        message: `You have been removed from the team "${team.name}".`,
        relatedEntityType: 'TEAM',
        relatedEntityId: team._id,
      });
    }

    await team.populate('members', 'firstName lastName designation');

    res.status(200).json({ success: true, data: team });
  } catch (error) {
    next(error);
  }
};

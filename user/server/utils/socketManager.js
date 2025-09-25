class SocketManager {
  constructor(io) {
    this.io = io
    this.connectedUsers = new Map()
  }

  // Add user to connected users map
  addUser(socketId, userId, userInfo) {
    this.connectedUsers.set(socketId, { userId, userInfo })
    console.log(`[v0] User ${userId} connected with socket ${socketId}`)
  }

  // Remove user from connected users map
  removeUser(socketId) {
    const user = this.connectedUsers.get(socketId)
    if (user) {
      this.connectedUsers.delete(socketId)
      console.log(`[v0] User ${user.userId} disconnected`)
    }
  }

  // Get all connected users
  getConnectedUsers() {
    return Array.from(this.connectedUsers.values())
  }

  // Send notification to specific user
  sendToUser(userId, event, data) {
    this.io.to(`user_${userId}`).emit(event, data)
  }

  // Send notification to course participants
  sendToCourse(courseId, event, data) {
    this.io.to(`course_${courseId}`).emit(event, data)
  }

  // Broadcast to all connected users
  broadcast(event, data) {
    this.io.emit(event, data)
  }

  // Send real-time schedule updates
  sendScheduleUpdate(scheduleData) {
    const { courseId, participants, instructor } = scheduleData

    // Notify course participants
    if (courseId) {
      this.sendToCourse(courseId, "schedule_updated", scheduleData)
    }

    // Notify individual participants
    if (participants && participants.length > 0) {
      participants.forEach((participant) => {
        this.sendToUser(participant.user, "schedule_notification", {
          type: "schedule_update",
          data: scheduleData,
        })
      })
    }

    // Notify instructor
    if (instructor) {
      this.sendToUser(instructor, "schedule_notification", {
        type: "schedule_update",
        data: scheduleData,
      })
    }
  }

  // Send enrollment notifications
  sendEnrollmentUpdate(courseId, studentId, instructorId, action) {
    const notificationData = {
      type: "enrollment",
      action, // 'enrolled' or 'unenrolled'
      courseId,
      studentId,
      timestamp: new Date(),
    }

    // Notify instructor
    this.sendToUser(instructorId, "enrollment_notification", notificationData)

    // Notify other students in the course
    this.sendToCourse(courseId, "course_update", {
      type: "enrollment_change",
      data: notificationData,
    })
  }

  // Send attendance updates
  sendAttendanceUpdate(scheduleId, attendanceData) {
    this.io.to(`schedule_${scheduleId}`).emit("attendance_updated", {
      scheduleId,
      attendance: attendanceData,
      timestamp: new Date(),
    })
  }
}

module.exports = SocketManager

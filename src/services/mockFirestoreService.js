import { 
  mockClassrooms, 
  mockLessons, 
  mockTests, 
  mockGames, 
  mockProgress, 
  mockTestAttempts, 
  mockGameAttempts, 
  mockNotifications,
  mockFirestore 
} from '../config/mockData';

export class MockFirestoreService {
  // Classroom operations
  static async getClassrooms(teacherId) {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockClassrooms.filter(c => c.teacherId === teacherId);
    } catch (error) {
      console.error('Error fetching classrooms:', error);
      throw error;
    }
  }

  static async createClassroom(classroomData) {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const newClassroom = {
        id: `classroom-${Date.now()}`,
        ...classroomData,
        studentIds: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockClassrooms.push(newClassroom);
      return newClassroom;
    } catch (error) {
      console.error('Error creating classroom:', error);
      throw error;
    }
  }

  static async getClassroomById(classroomId) {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      return mockClassrooms.find(c => c.id === classroomId);
    } catch (error) {
      console.error('Error fetching classroom:', error);
      throw error;
    }
  }

  static async updateClassroom(classroomId, updateData) {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const index = mockClassrooms.findIndex(c => c.id === classroomId);
      if (index !== -1) {
        mockClassrooms[index] = {
          ...mockClassrooms[index],
          ...updateData,
          updatedAt: new Date()
        };
        return mockClassrooms[index];
      }
      throw new Error('Classroom not found');
    } catch (error) {
      console.error('Error updating classroom:', error);
      throw error;
    }
  }

  static async deleteClassroom(classroomId) {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const index = mockClassrooms.findIndex(c => c.id === classroomId);
      if (index !== -1) {
        mockClassrooms.splice(index, 1);
        return { success: true };
      }
      throw new Error('Classroom not found');
    } catch (error) {
      console.error('Error deleting classroom:', error);
      throw error;
    }
  }

  // Lesson operations
  static async getLessons(classroomId) {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockLessons.filter(l => l.classroomId === classroomId);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      throw error;
    }
  }

  static async createLesson(lessonData) {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const newLesson = {
        id: `lesson-${Date.now()}`,
        ...lessonData,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockLessons.push(newLesson);
      return newLesson;
    } catch (error) {
      console.error('Error creating lesson:', error);
      throw error;
    }
  }

  static async getLessonById(lessonId) {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      return mockLessons.find(l => l.id === lessonId);
    } catch (error) {
      console.error('Error fetching lesson:', error);
      throw error;
    }
  }

  // Test operations
  static async getTests(classroomId) {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockTests.filter(t => t.classroomId === classroomId);
    } catch (error) {
      console.error('Error fetching tests:', error);
      throw error;
    }
  }

  static async createTest(testData) {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const newTest = {
        id: `test-${Date.now()}`,
        ...testData,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockTests.push(newTest);
      return newTest;
    } catch (error) {
      console.error('Error creating test:', error);
      throw error;
    }
  }

  static async getTestById(testId) {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      return mockTests.find(t => t.id === testId);
    } catch (error) {
      console.error('Error fetching test:', error);
      throw error;
    }
  }

  // Game operations
  static async getGames(classroomId) {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockGames.filter(g => g.classroomId === classroomId);
    } catch (error) {
      console.error('Error fetching games:', error);
      throw error;
    }
  }

  static async createGame(gameData) {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const newGame = {
        id: `game-${Date.now()}`,
        ...gameData,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockGames.push(newGame);
      return newGame;
    } catch (error) {
      console.error('Error creating game:', error);
      throw error;
    }
  }

  // Progress operations
  static async getProgress(studentId) {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockProgress.filter(p => p.studentId === studentId);
    } catch (error) {
      console.error('Error fetching progress:', error);
      throw error;
    }
  }

  static async updateProgress(progressData) {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const index = mockProgress.findIndex(p => 
        p.studentId === progressData.studentId && 
        p.lessonId === progressData.lessonId
      );
      
      if (index !== -1) {
        mockProgress[index] = {
          ...mockProgress[index],
          ...progressData,
          updatedAt: new Date()
        };
      } else {
        const newProgress = {
          id: `progress-${Date.now()}`,
          ...progressData,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        mockProgress.push(newProgress);
      }
      return { success: true };
    } catch (error) {
      console.error('Error updating progress:', error);
      throw error;
    }
  }

  // Test Attempt operations
  static async submitTestAttempt(attemptData) {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const newAttempt = {
        id: `attempt-${Date.now()}`,
        ...attemptData,
        completedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockTestAttempts.push(newAttempt);
      return newAttempt;
    } catch (error) {
      console.error('Error submitting test attempt:', error);
      throw error;
    }
  }

  static async getTestAttempts(studentId) {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockTestAttempts.filter(a => a.studentId === studentId);
    } catch (error) {
      console.error('Error fetching test attempts:', error);
      throw error;
    }
  }

  // Game Attempt operations
  static async submitGameAttempt(attemptData) {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const newAttempt = {
        id: `game-attempt-${Date.now()}`,
        ...attemptData,
        completedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockGameAttempts.push(newAttempt);
      return newAttempt;
    } catch (error) {
      console.error('Error submitting game attempt:', error);
      throw error;
    }
  }

  static async getGameAttempts(studentId) {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockGameAttempts.filter(a => a.studentId === studentId);
    } catch (error) {
      console.error('Error fetching game attempts:', error);
      throw error;
    }
  }

  // Notification operations
  static async getNotifications(userId) {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockNotifications.filter(n => n.userId === userId);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  static async markNotificationAsRead(notificationId) {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const notification = mockNotifications.find(n => n.id === notificationId);
      if (notification) {
        notification.isRead = true;
        notification.updatedAt = new Date();
      }
      return { success: true };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Student operations
  static async createStudent(studentData) {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const newStudent = {
        id: `student-${Date.now()}`,
        ...studentData,
        role: 'STUDENT',
        qrCode: `STU${Date.now().toString().slice(-6)}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      // Add to mock users (this would be in a real app)
      return newStudent;
    } catch (error) {
      console.error('Error creating student:', error);
      throw error;
    }
  }

  static async getStudents(classroomId) {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      // In a real app, this would query the database
      return [];
    } catch (error) {
      console.error('Error fetching students:', error);
      throw error;
    }
  }
}

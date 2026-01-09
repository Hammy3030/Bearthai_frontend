import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ArrowLeft,
  Users,
  BookOpen,
  BarChart3,
  Settings,
  UserPlus,
  Trash2,
  RefreshCw,
  Edit,
  Trash,
  GripVertical,
  FileText,
  Gamepad2,
  Copy,
  Check,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  X
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import AddStudentToClassModal from '../../components/teacher/AddStudentToClassModal';
import EditLessonModal from '../../components/teacher/EditLessonModal';
import { getApiUrl } from '../../utils/apiConfig';

const ClassroomPage = () => {
  const { classroomId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAddStudentsModal, setShowAddStudentsModal] = useState(false);
  const [showEditLessonModal, setShowEditLessonModal] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [editingLesson, setEditingLesson] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGender, setFilterGender] = useState('all'); // 'all', 'male', 'female'
  const [filterProgress, setFilterProgress] = useState('');
  const [sortBy, setSortBy] = useState('name'); // 'name', 'grade', 'progress', 'createdAt'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc', 'desc'

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch classroom details
  const { data: classroomData, isLoading } = useQuery(
    ['classroom', classroomId],
    async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        getApiUrl(`/teacher/classrooms/${classroomId}`),
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data.data.classroom;
    }
  );

  // Add students mutation
  const addStudentsMutation = useMutation(
    async (studentsData) => {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        getApiUrl(`/teacher/classrooms/${classroomId}/students`),
        studentsData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data.data.students;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['classroom', classroomId]);
        setShowAddStudentsModal(false);
        toast.success('เพิ่มนักเรียนสำเร็จ');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
      }
    }
  );

  // Remove student mutation
  const removeStudentMutation = useMutation(
    async (studentId) => {
      const token = localStorage.getItem('token');
      await axios.delete(
        getApiUrl(`/teacher/classrooms/${classroomId}/students/${studentId}`),
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['classroom', classroomId]);
        toast.success('ลบนักเรียนสำเร็จ');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
      }
    }
  );

  // Reset password mutation
  const resetPasswordMutation = useMutation(
    async (studentId) => {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        getApiUrl(`/teacher/classrooms/${classroomId}/students/${studentId}/reset-password`),
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data.data.newPassword;
    },
    {
      onSuccess: (newPassword) => {
        // Show persistent modal/alert instead of toast
        // Using a simple confirm/alert for now as a quick better-than-toast solution
        // In a real app, a dedicated modal "PasswordResetSuccessModal" is better
        globalThis.alert(`✅ รีเซ็ตรหัสผ่านสำเร็จ\n\nรหัสผ่านใหม่คือ: ${newPassword}\n\nกรุณาจดบันทึกรหัสผ่านนี้ไว้`);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
      }
    }
  );

  // Generate default lessons mutation
  const generateLessonsMutation = useMutation(
    async () => {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        getApiUrl(`/teacher/classrooms/${classroomId}/lessons/generate`),
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data.data.lessons;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['classroom', classroomId]);
        toast.success('สร้างบทเรียนอัตโนมัติสำเร็จ');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
      }
    }
  );

  // Generate tests mutation
  const generateTestsMutation = useMutation(
    async (lessonId) => {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        getApiUrl(`/teacher/lessons/${lessonId}/tests/generate`),
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data.data.tests;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['classroom', classroomId]);
        toast.success('สร้างแบบทดสอบอัตโนมัติสำเร็จ');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
      }
    }
  );

  // Generate games mutation
  const generateGamesMutation = useMutation(
    async (lessonId) => {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        getApiUrl(`/teacher/lessons/${lessonId}/games/generate`),
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data.data.games;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['classroom', classroomId]);
        toast.success('สร้างเกมอัตโนมัติสำเร็จ');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
      }
    }
  );

  // Update lesson mutation
  const updateLessonMutation = useMutation(
    async ({ lessonId, data }) => {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        getApiUrl(`/teacher/lessons/${lessonId}`),
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data.data.lesson;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['classroom', classroomId]);
        toast.success('อัปเดตบทเรียนสำเร็จ');
        setShowEditLessonModal(false);
        setSelectedLesson(null);
        setEditingLesson(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
      }
    }
  );

  // Delete lesson mutation
  const deleteLessonMutation = useMutation(
    async (lessonId) => {
      const token = localStorage.getItem('token');
      await axios.delete(
        getApiUrl(`/teacher/lessons/${lessonId}`),
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['classroom', classroomId]);
        toast.success('ลบบทเรียนสำเร็จ');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
      }
    }
  );

  // Delete test mutation
  const deleteTestMutation = useMutation(
    async (testId) => {
      const token = localStorage.getItem('token');
      await axios.delete(
        getApiUrl(`/teacher/tests/${testId}`),
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['classroom', classroomId]);
        toast.success('ลบแบบทดสอบสำเร็จ');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
      }
    }
  );

  // Delete game mutation
  const deleteGameMutation = useMutation(
    async (gameId) => {
      const token = localStorage.getItem('token');
      await axios.delete(
        getApiUrl(`/teacher/games/${gameId}`),
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['classroom', classroomId]);
        toast.success('ลบเกมสำเร็จ');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
      }
    }
  );

  // Reorder lessons mutation
  const reorderLessonsMutation = useMutation(
    async (lessonOrders) => {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        getApiUrl('/teacher/lessons/reorder'),
        { lessonOrders },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['classroom', classroomId]);
        toast.success('จัดลำดับบทเรียนสำเร็จ');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
      }
    }
  );

  const handleAddStudents = (data) => {
    addStudentsMutation.mutate(data);
  };

  const handleRemoveStudent = (studentId) => {
    // eslint-disable-next-line no-alert
    if (globalThis.confirm('คุณแน่ใจหรือไม่ที่จะลบนักเรียนคนนี้?')) {
      removeStudentMutation.mutate(studentId);
    }
  };

  const handleResetPassword = (studentId) => {
    // eslint-disable-next-line no-alert
    if (globalThis.confirm('คุณแน่ใจหรือไม่ที่จะรีเซ็ตรหัสผ่าน?')) {
      resetPasswordMutation.mutate(studentId);
    }
  };

  const handleEditLesson = (lesson) => {
    setSelectedLesson(lesson);
    setEditingLesson(true);
    setShowEditLessonModal(true);
  };

  const handleDeleteLesson = (lessonId) => {
    // eslint-disable-next-line no-alert
    if (globalThis.confirm('คุณแน่ใจหรือไม่ที่จะลบบทเรียนนี้?')) {
      deleteLessonMutation.mutate(lessonId);
    }
  };

  const handleSaveLesson = (lessonData) => {
    updateLessonMutation.mutate({ lessonId: selectedLesson.id, data: lessonData });
  };

  const handleGenerateTests = (lessonId) => {
    generateTestsMutation.mutate(lessonId);
  };

  const handleGenerateGames = (lessonId) => {
    generateGamesMutation.mutate(lessonId);
  };

  const handleDeleteTest = (testId) => {
    // eslint-disable-next-line no-alert
    if (globalThis.confirm('คุณแน่ใจหรือไม่ที่จะลบแบบทดสอบนี้?')) {
      deleteTestMutation.mutate(testId);
    }
  };

  const handleDeleteGame = (gameId) => {
    // eslint-disable-next-line no-alert
    if (globalThis.confirm('คุณแน่ใจหรือไม่ที่จะลบเกมนี้?')) {
      deleteGameMutation.mutate(gameId);
    }
  };

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(type);
      toast.success('คัดลอกแล้ว');
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Copy error:', err);
      toast.error('ไม่สามารถคัดลอกได้');
    }
  };

  // Filter and search students
  const filteredAndSortedStudents = () => {
    if (!classroomData?.students) return [];

    let filtered = [...classroomData.students];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(student =>
        student.name?.toLowerCase().includes(query) ||
        student.studentCode?.toLowerCase().includes(query) ||
        student.qrCode?.toLowerCase().includes(query)
      );
    }

    // Gender filter
    if (filterGender !== 'all') {
      filtered = filtered.filter(student => {
        const name = student.name?.toLowerCase() || '';
        if (filterGender === 'male') {
          return name.startsWith('เด็กชาย') || name.startsWith('ด.ช.') || name.startsWith('นาย');
        } else if (filterGender === 'female') {
          return name.startsWith('เด็กหญิง') || name.startsWith('ด.ญ.') || name.startsWith('นาง') || name.startsWith('น.ส.');
        }
        return true;
      });
    }

    // Progress filter
    if (filterProgress) {
      filtered = filtered.filter(student => {
        const progressCount = student.lessonProgress?.length || 0;
        if (filterProgress === 'no-progress') return progressCount === 0;
        if (filterProgress === 'in-progress') return progressCount > 0 && progressCount < 5;
        if (filterProgress === 'completed') return progressCount >= 5;
        return true;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'name':
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
          break;
        case 'grade':
          aValue = a.grade || '';
          bValue = b.grade || '';
          break;
        case 'progress':
          aValue = a.lessonProgress?.length || 0;
          bValue = b.lessonProgress?.length || 0;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt || 0).getTime();
          bValue = new Date(b.createdAt || 0).getTime();
          break;
        default:
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    return filtered;
  };

  // Pagination
  const paginatedStudents = () => {
    const filtered = filteredAndSortedStudents();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(filteredAndSortedStudents().length / itemsPerPage);

  // Reset to first page when filters change
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterGender('all');
    setFilterProgress('');
    setSortBy('name');
    setSortOrder('asc');
    setCurrentPage(1);
  };

  const handleDeleteAllLessons = async () => {
    // eslint-disable-next-line no-alert
    if (!globalThis.confirm('คุณแน่ใจหรือไม่ที่จะลบบทเรียนทั้งหมด?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (classroomData?.lessons && classroomData.lessons.length > 0) {
        await Promise.all(classroomData.lessons.map(lesson =>
          axios.delete(
            getApiUrl(`/teacher/lessons/${lesson.id}`),
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          )
        ));
        queryClient.invalidateQueries(['classroom', classroomId]);
        toast.success('ลบบทเรียนทั้งหมดสำเร็จ');
      }
    } catch (error) {
      console.error('Error deleting all lessons:', error);
      toast.error('เกิดข้อผิดพลาดในการลบบทเรียน');
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !classroomData?.lessons) {
      return;
    }

    const oldIndex = classroomData.lessons.findIndex(lesson => lesson.id === active.id);
    const newIndex = classroomData.lessons.findIndex(lesson => lesson.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const reorderedLessons = arrayMove(classroomData.lessons, oldIndex, newIndex);

    // Update orderIndex for each lesson
    const lessonOrders = reorderedLessons.map((lesson, index) => ({
      lessonId: lesson.id,
      orderIndex: index + 1
    }));

    reorderLessonsMutation.mutate(lessonOrders);
  };

  const handleMoveLesson = (lesson, direction) => {
    if (!classroomData?.lessons) return;

    // Filter lessons in the same category and chapter
    const siblings = classroomData.lessons
      .filter(l => l.category === lesson.category && (l.chapter || '1') === (lesson.chapter || '1'))
      .sort((a, b) => a.orderIndex - b.orderIndex);

    const currentIndex = siblings.findIndex(l => l.id === lesson.id);
    if (currentIndex === -1) return;

    let targetIndex;
    if (direction === 'up') {
      targetIndex = currentIndex - 1;
    } else {
      targetIndex = currentIndex + 1;
    }

    if (targetIndex < 0 || targetIndex >= siblings.length) return;

    const targetLesson = siblings[targetIndex];

    // Swap orderIndex
    const newOrders = [
      { lessonId: lesson.id, orderIndex: targetLesson.orderIndex },
      { lessonId: targetLesson.id, orderIndex: lesson.orderIndex }
    ];

    reorderLessonsMutation.mutate(newOrders);
  };

  // Sortable Lesson Item Component
  const SortableLessonItem = ({ lesson }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: lesson.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <motion.div
        ref={setNodeRef}
        style={style}
        className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition duration-200"
      >
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
        >
          <GripVertical className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">{lesson.title}</h4>
          <p className="text-sm text-gray-600 mt-1">{lesson.content?.substring(0, 100)}...</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleGenerateTests(lesson.id)}
            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
            title="สร้างแบบทดสอบอัตโนมัติ"
          >
            <FileText className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleGenerateGames(lesson.id)}
            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition"
            title="สร้างเกมอัตโนมัติ"
          >
            <Gamepad2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleEditLesson(lesson)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteLesson(lesson.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <Trash className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard/teacher')}
                className="p-2 text-gray-400 hover:text-gray-600 transition duration-200 mr-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {classroomData?.name}
                </h1>
                <p className="text-sm text-gray-500">
                  จัดการห้องเรียน
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600 transition duration-200">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm p-6 border"
          >
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">นักเรียน</p>
                <p className="text-2xl font-bold text-gray-900">
                  {classroomData?.students?.length || 0}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm p-6 border"
          >
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">บทเรียน</p>
                <p className="text-2xl font-bold text-gray-900">
                  {classroomData?.lessons?.length || 0}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm p-6 border"
          >
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">แบบทดสอบ</p>
                <p className="text-2xl font-bold text-gray-900">
                  {classroomData?.tests?.length || 0}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm p-6 border"
          >
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Gamepad2 className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">เกม</p>
                <p className="text-2xl font-bold text-gray-900">
                  {classroomData?.games?.length || 0}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Students Section */}
        <div className="bg-white rounded-xl shadow-sm border mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                รายชื่อนักเรียน ({filteredAndSortedStudents().length} / {classroomData?.students?.length || 0})
              </h3>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddStudentsModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition duration-200"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                เพิ่มนักเรียน
              </motion.button>
            </div>

            {/* Search and Filter Bar */}
            <div className="space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="ค้นหาด้วยชื่อหรือรหัสนักเรียน..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    handleFilterChange();
                  }}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      handleFilterChange();
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-3">
                {/* Gender Filter */}
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <select
                    value={filterGender}
                    onChange={(e) => {
                      setFilterGender(e.target.value);
                      handleFilterChange();
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">ทุกเพศ</option>
                    <option value="male">ชาย</option>
                    <option value="female">หญิง</option>
                  </select>
                </div>

                {/* Progress Filter */}
                <select
                  value={filterProgress}
                  onChange={(e) => {
                    setFilterProgress(e.target.value);
                    handleFilterChange();
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">ทุกความคืบหน้า</option>
                  <option value="no-progress">ยังไม่เริ่มเรียน</option>
                  <option value="in-progress">กำลังเรียน</option>
                  <option value="completed">เรียนจบแล้ว</option>
                </select>

                {/* Sort By */}
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    handleFilterChange();
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="name">เรียงตามชื่อ</option>
                  <option value="grade">เรียงตามชั้น</option>
                  <option value="progress">เรียงตามความคืบหน้า</option>
                  <option value="createdAt">เรียงตามวันที่สร้าง</option>
                </select>

                {/* Sort Order */}
                <button
                  onClick={() => {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    handleFilterChange();
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition duration-200"
                  title={sortOrder === 'asc' ? 'เรียงจากน้อยไปมาก' : 'เรียงจากมากไปน้อย'}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>

                {/* Clear Filters */}
                {(searchQuery || filterGender !== 'all' || filterProgress) && (
                  <button
                    onClick={clearFilters}
                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
                  >
                    <X className="w-4 h-4" />
                    ล้างตัวกรอง
                  </button>
                )}

                {/* Items Per Page */}
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-sm text-gray-600">แสดง:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            {classroomData?.students?.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  ยังไม่มีนักเรียน
                </h3>
                <p className="text-gray-600 mb-4">
                  เพิ่มนักเรียนเพื่อเริ่มต้นการเรียนรู้
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAddStudentsModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition duration-200"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  เพิ่มนักเรียน
                </motion.button>
              </div>
            ) : filteredAndSortedStudents().length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  ไม่พบนักเรียน
                </h3>
                <p className="text-gray-600 mb-4">
                  ไม่มีนักเรียนที่ตรงกับเงื่อนไขการค้นหา
                </p>
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition duration-200"
                >
                  ล้างตัวกรอง
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {paginatedStudents().map((student, index) => (
                    <motion.div
                      key={student.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-800">{student.name}</h3>
                          <p className="text-sm text-gray-600">รหัสนักเรียน: {student.studentCode || student.qrCode}</p>
                          {student.grade && (
                            <p className="text-sm text-gray-500">ชั้น: {student.grade}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            สร้างเมื่อ: {new Date(student.createdAt || Date.now()).toLocaleString('th-TH')}
                          </p>
                          {student.lessonProgress && (
                            <p className="text-xs text-gray-500 mt-1">
                              ความคืบหน้า: {student.lessonProgress.length || 0} บทเรียน
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => copyToClipboard(student.qrCode || student.studentCode, `code-${student.id}`)}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition duration-200"
                            title="คัดลอกรหัสนักเรียน"
                          >
                            {copiedCode === `code-${student.id}` ? (
                              <Check size={16} className="text-green-600" />
                            ) : (
                              <Copy size={16} />
                            )}
                          </button>
                          <button
                            onClick={() => handleResetPassword(student.id)}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition duration-200"
                            title="รีเซ็ตรหัสผ่าน"
                          >
                            <RefreshCw size={16} />
                          </button>
                          <button
                            onClick={() => handleRemoveStudent(student.id)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition duration-200"
                            title="ลบนักเรียน"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
                    <div className="text-sm text-gray-600">
                      แสดง {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredAndSortedStudents().length)} จาก {filteredAndSortedStudents().length} คน
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>

                      {/* Page Numbers */}
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }

                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`px-3 py-2 text-sm rounded-lg transition duration-200 ${currentPage === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'border border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Lessons Section */}
        <div className="bg-white rounded-xl shadow-sm border mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                📚 บทเรียนของคุณ
              </h3>
              <div className="flex gap-2">
                {classroomData?.lessons && classroomData.lessons.length > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDeleteAllLessons}
                    className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition duration-200"
                  >
                    <Trash className="w-4 h-4 mr-2" />
                    ลบทั้งหมด
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => generateLessonsMutation.mutate()}
                  disabled={generateLessonsMutation.isLoading}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generateLessonsMutation.isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      กำลังสร้าง...
                    </>
                  ) : (
                    <>
                      <BookOpen className="w-4 h-4 mr-2" />
                      สร้างบทเรียนอัตโนมัติ
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {classroomData?.lessons?.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  ยังไม่มีบทเรียน
                </h3>
                <p className="text-gray-600 mb-4">
                  คลิกที่ปุ่มด้านบนเพื่อสร้างบทเรียนอัตโนมัติ
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {['consonants', 'vowels', 'words', 'sentences'].map((category) => {
                  const categoryLessons = classroomData?.lessons?.filter(l => l.category === category) || [];
                  if (categoryLessons.length === 0) return null;

                  const categoryTitle = {
                    consonants: 'พยัญชนะ',
                    vowels: 'สระ',
                    words: 'คำพยางค์เดียว',
                    sentences: 'การแต่งประโยค'
                  }[category];

                  // Group by chapter
                  const chapters = {};
                  categoryLessons.forEach(lesson => {
                    const chapter = lesson.chapter || '1';
                    if (!chapters[chapter]) chapters[chapter] = [];
                    chapters[chapter].push(lesson);
                  });

                  return (
                    <div key={category} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                      <h4 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 border-gray-300">
                        หมวด: {categoryTitle}
                      </h4>

                      <div className="space-y-6">
                        {Object.entries(chapters).sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true })).map(([chapter, lessons]) => (
                          <div key={chapter}>
                            <h5 className="text-md font-semibold text-gray-700 mb-3 ml-2">
                              บทที่ {chapter}
                            </h5>
                            <div className="space-y-3 pl-4">
                              {lessons.sort((a, b) => a.orderIndex - b.orderIndex).map((lesson, index) => (
                                <div
                                  key={lesson.id}
                                  className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition duration-200"
                                >
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900">{lesson.title}</h4>
                                    <p className="text-sm text-gray-600 mt-1">
                                      {lesson.content?.includes('[MEDIA]')
                                        ? 'สื่อการสอนมัลติมีเดีย (Multimedia Content)'
                                        : (lesson.content?.substring(0, 100) + (lesson.content?.length > 100 ? '...' : ''))}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="flex flex-col mr-2">
                                      <button
                                        onClick={() => handleMoveLesson(lesson, 'up')}
                                        disabled={index === 0}
                                        className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                        title="เลื่อนขึ้น"
                                      >
                                        <ChevronUp className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleMoveLesson(lesson, 'down')}
                                        disabled={index === lessons.length - 1}
                                        className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                        title="เลื่อนลง"
                                      >
                                        <ChevronDown className="w-4 h-4" />
                                      </button>
                                    </div>
                                    <button
                                      onClick={() => handleGenerateTests(lesson.id)}
                                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                                      title="สร้างแบบทดสอบอัตโนมัติ"
                                    >
                                      <FileText className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleGenerateGames(lesson.id)}
                                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                                      title="สร้างเกมอัตโนมัติ"
                                    >
                                      <Gamepad2 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleEditLesson(lesson)}
                                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteLesson(lesson.id)}
                                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                    >
                                      <Trash className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Tests Section */}
        <div className="bg-white rounded-xl shadow-sm border mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              แบบทดสอบทั้งหมด
            </h3>
          </div>
          <div className="p-6">
            {!classroomData?.tests || classroomData.tests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">ยังไม่มีแบบทดสอบ</div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {classroomData.tests.map((test) => (
                  <div key={test.id} className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition bg-white">
                    <div className="flex justify-between items-start mb-2">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <button
                        onClick={() => handleDeleteTest(test.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                        title="ลบแบบทดสอบ"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1 line-clamp-1">{test.title}</h4>
                    <div className="flex items-center justify-between text-sm text-gray-600 mt-3">
                      <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {test.type === 'PRE_TEST' ? 'ก่อนเรียน' : test.type === 'POST_TEST' ? 'หลังเรียน' : 'ทั่วไป'}
                      </span>
                      <span>{test.questions?.length || 0} ข้อ</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Games Section */}
        <div className="bg-white rounded-xl shadow-sm border mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-purple-600" />
              เกมทั้งหมด
            </h3>
          </div>
          <div className="p-6">
            {!classroomData?.games || classroomData.games.length === 0 ? (
              <div className="text-center py-8 text-gray-500">ยังไม่มีเกม</div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {classroomData.games.map((game) => (
                  <div key={game.id} className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition bg-white">
                    <div className="flex justify-between items-start mb-2">
                      <div className="p-2 bg-purple-50 rounded-lg">
                        <Gamepad2 className="w-6 h-6 text-purple-600" />
                      </div>
                      <button
                        onClick={() => handleDeleteGame(game.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                        title="ลบเกม"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1 line-clamp-1">{game.title}</h4>
                    <div className="flex items-center justify-between text-sm text-gray-600 mt-3">
                      <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {game.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Add Students Modal */}
      {/* Add Student To Class Modal */}
      {showAddStudentsModal && (
        <AddStudentToClassModal
          isOpen={showAddStudentsModal}
          onClose={() => setShowAddStudentsModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries(['classroom', classroomId]);
          }}
          classroomId={classroomId}
        />
      )}

      {/* Edit Lesson Modal */}
      {
        showEditLessonModal && (
          <EditLessonModal
            isOpen={showEditLessonModal}
            onClose={() => {
              setShowEditLessonModal(false);
              setSelectedLesson(null);
              setEditingLesson(false);
            }}
            onSubmit={editingLesson ? handleSaveLesson : null}
            initialData={selectedLesson}
            isEditing={editingLesson}
          />
        )
      }

    </div >
  );
};

export default ClassroomPage;

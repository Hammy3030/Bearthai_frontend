import React, { useState, useEffect } from 'react';
import { X, UserPlus, Upload, AlertCircle, Search, Check } from 'lucide-react';
import axios from 'axios';
import { getApiUrl } from '../../utils/apiConfig';
import toast from 'react-hot-toast';

const AddStudentToClassModal = ({ isOpen, onClose, onSuccess, classroomId }) => {
    const [activeTab, setActiveTab] = useState('create'); // 'create' or 'existing'

    // Create Mode States
    const [names, setNames] = useState('');

    // Existing Mode States
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // Shared States
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // Reset states when modal opens
    useEffect(() => {
        if (isOpen) {
            setNames('');
            setSearchQuery('');
            setSearchResults([]);
            setSelectedStudents([]);
            setError(null);
            setActiveTab('create');
        }
    }, [isOpen]);

    // Debounce search
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (activeTab === 'existing' && searchQuery.trim()) {
                handleSearch();
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, activeTab]);

    if (!isOpen) return null;

    const handleSearch = async () => {
        setIsSearching(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(getApiUrl('/teacher/students/search'), {
                params: { query: searchQuery },
                headers: { Authorization: `Bearer ${token}` }
            });

            // Filter out students already in this class (if backend doesn't)
            // Ideally backend handles this, but frontend filter is safe
            // Assuming result includes classroomId
            const students = response.data.data.students || [];
            setSearchResults(students);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSearching(false);
        }
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            const studentNames = names.split('\n')
                .map(name => name.trim())
                .filter(name => name.length > 0);

            if (studentNames.length === 0) {
                throw new Error('กรุณาระบุรายชื่อนักเรียนอย่างน้อย 1 คน');
            }

            const studentsData = studentNames.map(name => ({ name }));

            const token = localStorage.getItem('token');
            const response = await axios.post(
                getApiUrl(`/teacher/classrooms/${classroomId}/students`),
                { students: studentsData },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                toast.success(`เพิ่มนักเรียนใหม่ ${response.data.data.students.length} คนสำเร็จ`);
                onSuccess();
                onClose();
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAssignSubmit = async () => {
        if (selectedStudents.length === 0) return;

        setError(null);
        setIsSubmitting(true);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                getApiUrl(`/teacher/classrooms/${classroomId}/students/assign`),
                { studentIds: selectedStudents },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                toast.success('เพิ่มนักเรียนเข้าห้องเรียนสำเร็จ');
                onSuccess();
                onClose();
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleStudentSelection = (studentId) => {
        setSelectedStudents(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-[#FFB000] p-4 flex justify-between items-center shrink-0">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <UserPlus size={24} />
                        เพิ่มนักเรียนเข้าห้องเรียน
                    </h3>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b shrink-0">
                    <button
                        onClick={() => setActiveTab('create')}
                        className={`flex-1 py-3 font-semibold text-sm transition-colors ${activeTab === 'create'
                                ? 'text-[#FFB000] border-b-2 border-[#FFB000] bg-yellow-50/50'
                                : 'text-gray-500 hover:text-gray-700 bg-gray-50'
                            }`}
                    >
                        สร้างบัญชีใหม่
                    </button>
                    <button
                        onClick={() => setActiveTab('existing')}
                        className={`flex-1 py-3 font-semibold text-sm transition-colors ${activeTab === 'existing'
                                ? 'text-[#FFB000] border-b-2 border-[#FFB000] bg-yellow-50/50'
                                : 'text-gray-500 hover:text-gray-700 bg-gray-50'
                            }`}
                    >
                        เลือกจากที่มีอยู่
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {/* Create New Tab */}
                    {activeTab === 'create' && (
                        <form onSubmit={handleCreateSubmit} className="space-y-4 h-full flex flex-col">
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3 shrink-0">
                                <AlertCircle className="text-blue-500 shrink-0" size={20} />
                                <div className="text-sm text-blue-700">
                                    <p className="font-semibold mb-1">คำแนะนำ</p>
                                    <p>พิมพ์ชื่อ-นามสกุลของนักเรียน 1 คนต่อ 1 บรรทัด</p>
                                    <p>ระบบจะสร้างรหัสผ่านและ QR Code ให้โดยอัตโนมัติ</p>
                                </div>
                            </div>

                            <div className="flex-1 min-h-[200px]">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    รายชื่อนักเรียน
                                </label>
                                <textarea
                                    value={names}
                                    onChange={(e) => setNames(e.target.value)}
                                    placeholder="เด็กชายรักเรียน ขยันหมั่นเพียร&#10;เด็กหญิงใจดี มีน้ำใจ&#10;..."
                                    className="w-full h-full min-h-[200px] p-4 rounded-xl border-2 border-gray-200 focus:border-[#FFB000] focus:ring-4 focus:ring-[#FFB000]/20 transition-all resize-none font-medium"
                                />
                            </div>
                            <div className="text-right text-sm text-gray-500 shrink-0">
                                จำนวน: {names.split('\n').filter(n => n.trim()).length} คน
                            </div>
                        </form>
                    )}

                    {/* Add Existing Tab */}
                    {activeTab === 'existing' && (
                        <div className="space-y-4 h-full flex flex-col">
                            <div className="relative shrink-0">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="ค้นหาด้วยชื่อ, รหัสนักเรียน หรือ QR Code..."
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#FFB000] focus:ring-4 focus:ring-[#FFB000]/20 transition-all"
                                />
                            </div>

                            <div className="flex-1 border rounded-xl overflow-hidden flex flex-col min-h-[250px]">
                                <div className="bg-gray-50 px-4 py-2 border-b text-sm font-medium text-gray-500 flex justify-between">
                                    <span>รายชื่อที่ค้นพบ</span>
                                    <span>เลือกแล้ว {selectedStudents.length} คน</span>
                                </div>

                                <div className="overflow-y-auto flex-1 p-2 space-y-2">
                                    {isSearching ? (
                                        <div className="flex items-center justify-center h-32 text-gray-400">
                                            กำลังค้นหา...
                                        </div>
                                    ) : searchResults.length > 0 ? (
                                        searchResults.map(student => {
                                            const isSelected = selectedStudents.includes(student.id || student._id);
                                            // Check if student is already in THIS classroom (simple check if we had classroom data, but mostly relies on backend update to overwrite)
                                            // Or disable if student.classroomId === classroomId
                                            const isInClass = student.classroomId && (student.classroomId === classroomId || student.classroomId._id === classroomId);

                                            return (
                                                <div
                                                    key={student.id || student._id}
                                                    onClick={() => !isInClass && toggleStudentSelection(student.id || student._id)}
                                                    className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${isInClass
                                                            ? 'bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed'
                                                            : isSelected
                                                                ? 'bg-yellow-50 border-[#FFB000] shadow-sm'
                                                                : 'hover:bg-gray-50 border-gray-100'
                                                        }`}
                                                >
                                                    <div>
                                                        <div className="font-semibold text-gray-800">{student.name}</div>
                                                        <div className="text-xs text-gray-500 flex gap-2">
                                                            <span>{student.studentCode}</span>
                                                            {student.classroomId && (
                                                                <span className="text-blue-600 bg-blue-50 px-1 rounded">
                                                                    {student.classroomId.name || 'มีห้องเรียนแล้ว'}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {isInClass ? (
                                                        <span className="text-xs text-gray-500 font-medium px-2 py-1 bg-gray-200 rounded">อยู่ในห้องนี้แล้ว</span>
                                                    ) : (
                                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'bg-[#FFB000] border-[#FFB000] text-white' : 'border-gray-300'
                                                            }`}>
                                                            {isSelected && <Check size={14} />}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    ) : searchQuery ? (
                                        <div className="text-center py-8 text-gray-500">
                                            ไม่พบนักเรียนที่ค้นหา
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-400">
                                            พิมพ์คำค้นหาเพื่อเริ่มค้นหานักเรียน
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mt-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2 shrink-0">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-gray-50 flex gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2 rounded-xl border-2 border-gray-200 text-gray-600 font-bold hover:bg-white transition-colors"
                    >
                        ยกเลิก
                    </button>
                    <button
                        type="button"
                        onClick={activeTab === 'create' ? handleCreateSubmit : handleAssignSubmit}
                        disabled={
                            isSubmitting ||
                            (activeTab === 'create' && !names.trim()) ||
                            (activeTab === 'existing' && selectedStudents.length === 0)
                        }
                        className="flex-1 px-4 py-2 rounded-xl bg-[#FFB000] text-white font-bold hover:bg-[#E59E00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                {activeTab === 'create' ? <Upload size={20} /> : <UserPlus size={20} />}
                                {activeTab === 'create' ? 'สร้างบัญชี' : 'เพิ่มเข้าห้องเรียน'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddStudentToClassModal;

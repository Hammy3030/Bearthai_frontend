import React, { useState } from 'react';
import { X, UserPlus, Upload, AlertCircle } from 'lucide-react';

const BulkCreateStudentModal = ({ isOpen, onClose, onSubmit, classroomId = null }) => {
    const [names, setNames] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            // Split by newline and filter empty strings
            const studentNames = names.split('\n')
                .map(name => name.trim())
                .filter(name => name.length > 0);

            if (studentNames.length === 0) {
                throw new Error('กรุณาระบุรายชื่อนักเรียนอย่างน้อย 1 คน');
            }

            const studentsData = studentNames.map(name => ({ name }));

            await onSubmit(studentsData);

            setNames('');
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
                {/* Header */}
                <div className="bg-[#FFB000] p-4 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <UserPlus size={24} />
                        {classroomId ? 'เพิ่มนักเรียนเข้าห้องเรียน' : 'สร้างบัญชีนักเรียนใหม่'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-white/80 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3">
                        <AlertCircle className="text-blue-500 shrink-0" size={20} />
                        <div className="text-sm text-blue-700">
                            <p className="font-semibold mb-1">คำแนะนำ</p>
                            <p>พิมพ์ชื่อ-นามสกุลของนักเรียน 1 คนต่อ 1 บรรทัด</p>
                            <p>ระบบจะสร้างรหัสผ่านและ QR Code ให้โดยอัตโนมัติ</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            รายชื่อนักเรียน
                        </label>
                        <textarea
                            value={names}
                            onChange={(e) => setNames(e.target.value)}
                            placeholder="เด็กชายรักเรียน ขยันหมั่นเพียร&#10;เด็กหญิงใจดี มีน้ำใจ&#10;..."
                            className="w-full h-48 p-4 rounded-xl border-2 border-gray-200 focus:border-[#FFB000] focus:ring-4 focus:ring-[#FFB000]/20 transition-all resize-none font-medium"
                        />
                        <div className="mt-2 text-right text-sm text-gray-500">
                            จำนวน: {names.split('\n').filter(n => n.trim()).length} คน
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 rounded-xl border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors"
                        >
                            ยกเลิก
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !names.trim()}
                            className="flex-1 px-4 py-2 rounded-xl bg-[#FFB000] text-white font-bold hover:bg-[#E59E00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Upload size={20} />
                                    บันทึกข้อมูล
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BulkCreateStudentModal;

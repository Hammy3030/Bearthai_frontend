import React from 'react';

/**
 * Status Legend Component
 * Displays lesson status descriptions
 */
const StatusLegend = () => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <div className="flex flex-wrap items-center gap-6">
        <h3 className="text-lg font-bold text-gray-800 shrink-0">
          📖 คำอธิบายสถานะ:
        </h3>
        <div className="flex flex-1 flex-wrap justify-evenly gap-6">
          <span className="text-sm text-gray-600">🔒 ล็อกอยู่</span>
          <span className="text-sm text-gray-600">🔓 พร้อมเรียน</span>
          <span className="text-sm text-gray-600">📖 กำลังเรียน</span>
          <span className="text-sm text-gray-600">✅ เรียนจบแล้ว</span>
        </div>
      </div>
    </div>
  );
};

export default StatusLegend;

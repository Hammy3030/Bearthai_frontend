import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  GraduationCap, 
  Users, 
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  Check
} from 'lucide-react';
import toast from 'react-hot-toast';

const HelpPage = () => {
  const [expandedSection, setExpandedSection] = useState(null);
  const [copiedText, setCopiedText] = useState('');

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    toast.success('คัดลอกแล้ว!');
    setTimeout(() => setCopiedText(''), 2000);
  };

  const teacherData = {
    email: 'teacher@test.com',
    password: 'password123',
    name: 'ครูสมชาย',
    school: 'โรงเรียนทดสอบ'
  };

  const studentData = {
    code1: 'STU001',
    code2: 'STU002',
    code3: 'STU003',
    code4: 'STU004',
    code5: 'STU005'
  };

  const sections = [
    {
      id: 'teacher-login',
      title: 'การเข้าสู่ระบบสำหรับครู',
      icon: <GraduationCap className="text-blue-600" size={24} />,
      content: (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">ข้อมูลทดสอบ:</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-white p-2 rounded">
                <span className="text-sm">อีเมล:</span>
                <div className="flex items-center gap-2">
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">{teacherData.email}</code>
                  <button
                    onClick={() => copyToClipboard(teacherData.email)}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    {copiedText === teacherData.email ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between bg-white p-2 rounded">
                <span className="text-sm">รหัสผ่าน:</span>
                <div className="flex items-center gap-2">
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">(อะไรก็ได้)</code>
                  <button
                    onClick={() => copyToClipboard('password123')}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    {copiedText === 'password123' ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">ขั้นตอนการเข้าสู่ระบบ:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>ไปที่หน้า <strong>เข้าสู่ระบบ</strong> (/login)</li>
              <li>เลือก <strong>"ครู"</strong></li>
              <li>กรอกข้อมูลทดสอบด้านบน</li>
              <li>กดปุ่ม <strong>"เข้าสู่ระบบ"</strong></li>
              <li>ระบบจะ redirect ไปที่ Dashboard ครู</li>
            </ol>
          </div>
        </div>
      )
    },
    {
      id: 'student-login',
      title: 'การเข้าสู่ระบบสำหรับนักเรียน',
      icon: <Users className="text-green-600" size={24} />,
      content: (
        <div className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">ข้อมูลทดสอบ:</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-white p-2 rounded">
                <span className="text-sm">รหัสนักเรียน 1:</span>
                <div className="flex items-center gap-2">
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">{studentData.code1}</code>
                  <button
                    onClick={() => copyToClipboard(studentData.code1)}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    {copiedText === studentData.code1 ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between bg-white p-2 rounded">
                <span className="text-sm">รหัสนักเรียน 2:</span>
                <div className="flex items-center gap-2">
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">{studentData.code2}</code>
                  <button
                    onClick={() => copyToClipboard(studentData.code2)}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    {copiedText === studentData.code2 ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between bg-white p-2 rounded">
                <span className="text-sm">รหัสนักเรียน 3:</span>
                <div className="flex items-center gap-2">
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">{studentData.code3}</code>
                  <button
                    onClick={() => copyToClipboard(studentData.code3)}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    {copiedText === studentData.code3 ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between bg-white p-2 rounded">
                <span className="text-sm">รหัสนักเรียน 4:</span>
                <div className="flex items-center gap-2">
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">{studentData.code4}</code>
                  <button
                    onClick={() => copyToClipboard(studentData.code4)}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    {copiedText === studentData.code4 ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between bg-white p-2 rounded">
                <span className="text-sm">รหัสนักเรียน 5:</span>
                <div className="flex items-center gap-2">
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">{studentData.code5}</code>
                  <button
                    onClick={() => copyToClipboard(studentData.code5)}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    {copiedText === studentData.code5 ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="mt-4 bg-white p-3 rounded">
              <p className="text-sm text-gray-700">
                <strong>💡 แต่ละรหัสมีสถานะต่างกัน:</strong>
              </p>
              <ul className="text-xs text-gray-600 mt-2 space-y-1">
                <li>• STU001 - เก่ง (เรียนจบ 2 บท)</li>
                <li>• STU002 - ปานกลาง (กำลังเรียนบทที่ 1)</li>
                <li>• STU003 - ยังไม่เริ่ม</li>
                <li>• STU004, STU005 - พร้อมเรียน</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">ขั้นตอนการเข้าสู่ระบบ:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>ไปที่หน้า <strong>เข้าสู่ระบบ</strong> (/login)</li>
              <li>เลือก <strong>"นักเรียน"</strong></li>
              <li>กรอกรหัสนักเรียนทดสอบด้านบน</li>
              <li>กดปุ่ม <strong>"เข้าสู่ระบบ"</strong></li>
              <li>ระบบจะ redirect ไปที่ Dashboard นักเรียน</li>
            </ol>
          </div>
        </div>
      )
    },
    {
      id: 'teacher-features',
      title: 'ฟีเจอร์สำหรับครู',
      icon: <GraduationCap className="text-purple-600" size={24} />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-semibold text-purple-800 mb-2">สร้างห้องเรียน</h4>
              <ul className="text-sm space-y-1">
                <li>• กด "สร้างห้องเรียนใหม่"</li>
                <li>• กรอกชื่อและคำอธิบาย</li>
                <li>• กด "สร้างห้องเรียน"</li>
              </ul>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">จัดการนักเรียน</h4>
              <ul className="text-sm space-y-1">
                <li>• ดูรายการนักเรียน</li>
                <li>• เพิ่มนักเรียนใหม่</li>
                <li>• สร้าง QR Code</li>
                <li>• ลบนักเรียน</li>
              </ul>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">ดูรายงาน</h4>
              <ul className="text-sm space-y-1">
                <li>• ดูความคืบหน้านักเรียน</li>
                <li>• วิเคราะห์ผลรายคน</li>
                <li>• ดูสถิติห้องเรียน</li>
              </ul>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg">
              <h4 className="font-semibold text-orange-800 mb-2">ตั้งค่าโปรไฟล์</h4>
              <ul className="text-sm space-y-1">
                <li>• แก้ไขข้อมูลส่วนตัว</li>
                <li>• เปลี่ยนรหัสผ่าน</li>
                <li>• ตั้งค่าการแจ้งเตือน</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'student-features',
      title: 'ฟีเจอร์สำหรับนักเรียน',
      icon: <BookOpen className="text-indigo-600" size={24} />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-indigo-50 p-4 rounded-lg">
              <h4 className="font-semibold text-indigo-800 mb-2">เรียนบทเรียน</h4>
              <ul className="text-sm space-y-1">
                <li>• บทที่ 1: สระ อา</li>
                <li>• บทที่ 2: สระ อี</li>
                <li>• ฟังเสียงและดูเนื้อหา</li>
                <li>• ทำแบบทดสอบ</li>
              </ul>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">ทำแบบทดสอบ</h4>
              <ul className="text-sm space-y-1">
                <li>• แบบทดสอบก่อนเรียน</li>
                <li>• แบบทดสอบหลังเรียน</li>
                <li>• ดูผลคะแนน</li>
                <li>• ดูคำอธิบาย</li>
              </ul>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">เล่นเกม</h4>
              <ul className="text-sm space-y-1">
                <li>• เกมจับคู่สระ อา</li>
                <li>• ทำคะแนนให้ได้มากที่สุด</li>
                <li>• ดูผลคะแนน</li>
                <li>• ปลดล็อกเกมใหม่</li>
              </ul>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-semibold text-purple-800 mb-2">ดูความคืบหน้า</h4>
              <ul className="text-sm space-y-1">
                <li>• ดูบทเรียนที่เรียนแล้ว</li>
                <li>• ดูคะแนนแบบทดสอบ</li>
                <li>• ดูคะแนนเกม</li>
                <li>• ดูสถิติการเรียน</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'troubleshooting',
      title: 'การแก้ไขปัญหา',
      icon: <HelpCircle className="text-red-600" size={24} />,
      content: (
        <div className="space-y-4">
          <div className="bg-red-50 p-4 rounded-lg">
            <h4 className="font-semibold text-red-800 mb-2">ปัญหาการเข้าสู่ระบบ</h4>
            <div className="space-y-2 text-sm">
              <div className="bg-white p-3 rounded">
                <strong>ครูเข้าสู่ระบบไม่ได้:</strong>
                <ul className="mt-1 ml-4 space-y-1">
                  <li>• ตรวจสอบอีเมล: teacher@test.com</li>
                  <li>• ตรวจสอบรหัสผ่าน: (อะไรก็ได้)</li>
                  <li>• ตรวจสอบว่าเลือก "ครู"</li>
                </ul>
              </div>
              <div className="bg-white p-3 rounded">
                <strong>นักเรียนเข้าสู่ระบบไม่ได้:</strong>
                <ul className="mt-1 ml-4 space-y-1">
                  <li>• ตรวจสอบรหัสนักเรียน: STU001 หรือ STU002</li>
                  <li>• ตรวจสอบว่าเลือก "นักเรียน"</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-semibold text-yellow-800 mb-2">ปัญหาการแสดงข้อมูล</h4>
            <div className="space-y-2 text-sm">
              <div className="bg-white p-3 rounded">
                <strong>Dashboard ไม่แสดงข้อมูล:</strong>
                <ul className="mt-1 ml-4 space-y-1">
                  <li>• รีเฟรชหน้าเว็บ (F5)</li>
                  <li>• ตรวจสอบการเข้าสู่ระบบ</li>
                  <li>• ลองเข้าสู่ระบบใหม่</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
            📚 คู่มือการใช้งาน BearThai Web CAI
          </h1>
          <p className="text-lg text-gray-600">
            คู่มือการใช้งานระบบสำหรับครูและนักเรียน
          </p>
        </div>

        <div className="space-y-4">
          {sections.map((section) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden"
            >
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full p-6 text-left hover:bg-gray-50 transition duration-200 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  {section.icon}
                  <h2 className="text-xl font-semibold text-gray-800">
                    {section.title}
                  </h2>
                </div>
                {expandedSection === section.id ? (
                  <ChevronUp className="text-gray-500" size={24} />
                ) : (
                  <ChevronDown className="text-gray-500" size={24} />
                )}
              </button>
              
              {expandedSection === section.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="px-6 pb-6"
                >
                  {section.content}
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        <div className="mt-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">🎉 ระบบพร้อมใช้งาน!</h3>
          <p className="text-lg mb-4">
            ตอนนี้คุณสามารถเริ่มต้นใช้งานระบบ BearThai Web CAI ได้แล้ว
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/login"
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition duration-200"
            >
              เริ่มต้นใช้งาน
            </a>
            <a
              href="/register"
              className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition duration-200"
            >
              สมัครสมาชิก
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default HelpPage;

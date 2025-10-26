import React, { useState } from 'react';
import { Homework, ReminderMode, Settings } from '../types';

interface HomeworkTableProps {
  homeworks: Homework[];
  setHomeworks: React.Dispatch<React.SetStateAction<Homework[]>>;
  settings: Settings;
}

const themeClasses = {
  cyan: { text: 'text-cyan-400', ring: 'focus:ring-cyan-500', accent: 'accent-cyan-500', bg: 'bg-cyan-600', hoverBg: 'hover:bg-cyan-500' },
  magenta: { text: 'text-fuchsia-400', ring: 'focus:ring-fuchsia-500', accent: 'accent-fuchsia-500', bg: 'bg-fuchsia-600', hoverBg: 'hover:bg-fuchsia-500' },
  green: { text: 'text-emerald-400', ring: 'focus:ring-emerald-500', accent: 'accent-emerald-500', bg: 'bg-emerald-600', hoverBg: 'hover:bg-emerald-500' },
};

const HomeworkTable: React.FC<HomeworkTableProps> = ({ homeworks, setHomeworks, settings }) => {
  const [newSubject, setNewSubject] = useState('');
  const [newTask, setNewTask] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newReminder, setNewReminder] = useState<ReminderMode>(ReminderMode.None);
  const [newEmail, setNewEmail] = useState('');
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const currentTheme = themeClasses[settings.theme];

  const resetForm = () => {
      setNewSubject('');
      setNewTask('');
      setNewDeadline('');
      setNewReminder(ReminderMode.None);
      setNewEmail('');
  };

  const addHomework = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTask.trim() && newSubject.trim() && newDeadline) {
      const newHomework: Homework = {
        id: Date.now(),
        subject: newSubject,
        task: newTask,
        deadline: newDeadline,
        reminder: newReminder,
        email: newEmail,
        reminderSent: false,
        completed: false,
      };
      setHomeworks([...homeworks, newHomework]);
      
      if (newEmail.trim()) {
        alert(`Đã thêm nhiệm vụ: "${newHomework.task}". Một email xác nhận đã được "gửi" đến ${newEmail}.`);
      }
      
      resetForm();
      setIsModalVisible(false);
    }
  };

  const toggleComplete = (id: number) => {
    setHomeworks(homeworks.map(hw => hw.id === id ? { ...hw, completed: !hw.completed } : hw));
  };
  
  const deleteHomework = (id: number) => {
    setHomeworks(homeworks.filter(hw => hw.id !== id));
  };
  
  const sortedHomeworks = [...homeworks].sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  const getDeadlineColor = (deadline: string, completed: boolean) => {
    if (completed) return 'text-green-500';
    const daysUntil = (new Date(deadline).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
    if (daysUntil < 0) return 'text-red-500 font-bold';
    if (daysUntil < 3) return 'text-red-400';
    if (daysUntil < 7) return 'text-yellow-400';
    return 'text-slate-300';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className={`text-3xl font-bold ${currentTheme.text}`}>Danh sách nhiệm vụ</h1>
        <button 
          onClick={() => setIsModalVisible(true)}
          className={`px-4 py-2 rounded-xl font-semibold text-white ${currentTheme.bg} ${currentTheme.hoverBg} transition-colors`}
        >
          Thêm nhiệm vụ
        </button>
      </div>
      
      {isModalVisible && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-lg z-50 flex items-center justify-center p-4">
          <form onSubmit={addHomework} className="w-full max-w-lg p-6 bg-slate-800/80 backdrop-blur-xl border border-white/10 rounded-2xl space-y-4 shadow-2xl shadow-black/30">
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-2xl font-bold ${currentTheme.text}`}>Nhiệm vụ mới</h2>
              <button type="button" onClick={() => setIsModalVisible(false)} className="text-slate-400 text-2xl leading-none hover:text-slate-200">&times;</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" value={newSubject} onChange={(e) => setNewSubject(e.target.value)} placeholder="Môn học" required className={`w-full bg-slate-700 p-2 rounded-lg focus:outline-none focus:ring-2 ${currentTheme.ring}`} />
              <input type="date" value={newDeadline} onChange={(e) => setNewDeadline(e.target.value)} required className={`w-full bg-slate-700 p-2 rounded-lg focus:outline-none focus:ring-2 ${currentTheme.ring}`} />
            </div>
            <input type="text" value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="Mô tả nhiệm vụ" required className={`w-full bg-slate-700 p-2 rounded-lg focus:outline-none focus:ring-2 ${currentTheme.ring}`} />
            <select value={newReminder} onChange={(e) => setNewReminder(e.target.value as ReminderMode)} className={`bg-slate-700 p-2 rounded-lg w-full focus:outline-none focus:ring-2 ${currentTheme.ring}`}>
              <option value={ReminderMode.None}>Không nhắc nhở</option>
              <option value={ReminderMode.OneDay}>Trước 1 ngày</option>
              <option value={ReminderMode.TwoDays}>Trước 2 ngày</option>
              <option value={ReminderMode.OneWeek}>Trước 1 tuần</option>
            </select>
            {newReminder !== ReminderMode.None && (
                <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Email nhận nhắc nhở"
                    required
                    className={`w-full bg-slate-700 p-2 rounded-lg focus:outline-none focus:ring-2 ${currentTheme.ring}`}
                />
            )}
            <div className="flex justify-end gap-4 pt-4">
              <button type="button" onClick={() => setIsModalVisible(false)} className="px-4 py-2 bg-slate-600 rounded-lg font-semibold hover:bg-slate-500 transition-colors">Hủy</button>
              <button type="submit" className="px-4 py-2 bg-green-600 rounded-lg font-semibold hover:bg-green-500 transition-colors text-white">Lưu</button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto bg-slate-800/60 backdrop-blur-md border border-white/10 rounded-2xl shadow-lg">
        <table className="w-full text-left">
          <thead className="bg-slate-900/50">
            <tr>
              <th className="p-4">Trạng thái</th>
              <th className="p-4">Môn học</th>
              <th className="p-4">Nhiệm vụ</th>
              <th className="p-4">Hạn chót</th>
              <th className="p-4">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {sortedHomeworks.map(hw => (
              <tr key={hw.id} className={`border-b border-slate-700 ${hw.completed ? 'bg-slate-850 opacity-60' : 'hover:bg-slate-750/70'}`}>
                <td className="p-4">
                  <input type="checkbox" checked={hw.completed} onChange={() => toggleComplete(hw.id)} className={`w-5 h-5 ${currentTheme.accent}`} />
                </td>
                <td className="p-4 font-semibold">{hw.subject}</td>
                <td className={`p-4 ${hw.completed ? 'line-through' : ''}`}>{hw.task}</td>
                <td className={`p-4 ${getDeadlineColor(hw.deadline, hw.completed)}`}>{new Date(hw.deadline).toLocaleDateString('vi-VN')}</td>
                <td className="p-4">
                  <button onClick={() => deleteHomework(hw.id)} className="text-red-500 hover:text-red-400">Xóa</button>
                </td>
              </tr>
            ))}
             {sortedHomeworks.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center p-8 text-slate-400">Chưa có nhiệm vụ nào. Thêm một nhiệm vụ để bắt đầu!</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HomeworkTable;

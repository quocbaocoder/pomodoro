import React, { useState, useRef, useEffect } from 'react';
import { askAI } from '../services/geminiService';
import { SparklesIcon } from './icons/SparklesIcon';
import { Message, AIMode } from '../types';

interface AIAssistantProps {
    onClose: () => void;
    onAddTask: (taskDetails: { subject: string; task: string; deadline: string }) => void;
    onDeleteTask: (taskDescription: string) => string | null;
    onCompleteTask: (taskDescription: string) => string | null;
    taskChatHistory: Message[];
    setTaskChatHistory: React.Dispatch<React.SetStateAction<Message[]>>;
    studyChatHistory: Message[];
    setStudyChatHistory: React.Dispatch<React.SetStateAction<Message[]>>;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ 
    onClose, 
    onAddTask, 
    onDeleteTask, 
    onCompleteTask, 
    taskChatHistory, 
    setTaskChatHistory,
    studyChatHistory,
    setStudyChatHistory
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<AIMode>('study');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const chatHistory = mode === 'tasks' ? taskChatHistory : studyChatHistory;
  const setChatHistory = mode === 'tasks' ? setTaskChatHistory : setStudyChatHistory;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSubmit = async (e: React.FormEvent, prompt?: string) => {
    e.preventDefault();
    const currentInput = prompt || input;
    if (!currentInput.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', text: currentInput };
    const historyForAPI = chatHistory.map(msg => ({ role: msg.role, parts: [{text: msg.text}] }));
    
    setChatHistory(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const aiResponse = await askAI(currentInput, historyForAPI, mode);
    
    let responseMessage: Message | null = null;

    if (aiResponse.functionCall && mode === 'tasks') {
        const { name, args } = aiResponse.functionCall;

        if (name === 'addHomework') {
            const { subject, task, deadline } = args;
            if (subject && task && deadline && /^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
                onAddTask({ subject, task, deadline });
                responseMessage = { 
                    role: 'model', 
                    text: `✅ Đã thêm nhiệm vụ!\n- Môn học: ${subject}\n- Nhiệm vụ: ${task}\n- Hạn chót: ${new Date(deadline).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'})}` 
                };
            } else {
                 responseMessage = { role: 'model', text: "Tôi không thể thêm nhiệm vụ vì thiếu thông tin hoặc định dạng ngày không đúng. Vui lòng thử lại và đảm bảo hạn chót rõ ràng." };
            }
        } else if (name === 'deleteHomework') {
            const { task } = args;
            if (task) {
                const deletedTaskName = onDeleteTask(task);
                if (deletedTaskName) {
                    responseMessage = { role: 'model', text: `🗑️ Đã xóa nhiệm vụ: "${deletedTaskName}"` };
                } else {
                    responseMessage = { role: 'model', text: `Tôi không tìm thấy nhiệm vụ nào khớp với "${task}" để xóa. Vui lòng cụ thể hơn hoặc kiểm tra danh sách nhiệm vụ của bạn.` };
                }
            } else {
                responseMessage = { role: 'model', text: "Vui lòng cho tôi biết bạn muốn xóa nhiệm vụ nào." };
            }
        } else if (name === 'completeHomework') {
            const { task } = args;
            if (task) {
                const completedTaskName = onCompleteTask(task);
                if (completedTaskName) {
                    responseMessage = { role: 'model', text: `🎉 Làm tốt lắm! Đã đánh dấu hoàn thành nhiệm vụ: "${completedTaskName}"` };
                } else {
                    responseMessage = { role: 'model', text: `Tôi không tìm thấy nhiệm vụ nào đang hoạt động khớp với "${task}" để hoàn thành. Vui lòng cụ thể hơn hoặc kiểm tra danh sách nhiệm vụ của bạn.` };
                }
            } else {
                responseMessage = { role: 'model', text: "Vui lòng cho tôi biết bạn đã hoàn thành nhiệm vụ nào." };
            }
        }
    } else if (aiResponse.text) {
        responseMessage = { role: 'model', text: aiResponse.text };
    }
    
    if (responseMessage) {
      setChatHistory(prev => [...prev, responseMessage!]);
    }

    setIsLoading(false);
  };
  
  return (
    <div className="flex flex-col h-full max-h-[700px] w-full max-w-2xl bg-slate-800/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-lg shadow-black/30">
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center space-x-2">
            <SparklesIcon className="text-cyan-400" />
            <h1 className="text-xl font-bold text-cyan-400">Trợ lý AI</h1>
        </div>
        <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-700 transition-colors" aria-label="Đóng Trợ lý AI">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      <div className="p-2">
          <div className="flex p-1 bg-slate-700 rounded-lg">
              <button onClick={() => setMode('study')} className={`w-full p-2 rounded-md transition-colors text-sm font-semibold ${mode === 'study' ? 'bg-cyan-600 text-white' : 'hover:bg-slate-600'}`}>Học tập</button>
              <button onClick={() => setMode('tasks')} className={`w-full p-2 rounded-md transition-colors text-sm font-semibold ${mode === 'tasks' ? 'bg-cyan-600 text-white' : 'hover:bg-slate-600'}`}>Nhiệm vụ</button>
          </div>
      </div>

      <div className="flex-grow p-4 overflow-y-auto space-y-4">
        {chatHistory.length === 0 && (
          mode === 'study' ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center">
              <SparklesIcon className="w-16 h-16 mb-4"/>
              <p className="text-lg">Chào bạn! Tôi là bạn học AI của bạn.</p>
              <p className="text-sm mb-6">Hãy hỏi tôi bất cứ điều gì về các môn học của bạn!</p>
              <div className="flex flex-wrap justify-center gap-2">
                  <button onClick={(e) => handleSubmit(e, "Giải thích quang hợp là gì?")} className="bg-slate-700/80 hover:bg-slate-600/80 transition-colors text-sm px-3 py-2 rounded-lg">Giải thích quang hợp</button>
                  <button onClick={(e) => handleSubmit(e, "Tóm tắt các nguyên nhân chính của Chiến tranh thế giới thứ nhất.")} className="bg-slate-700/80 hover:bg-slate-600/80 transition-colors text-sm px-3 py-2 rounded-lg">Tóm tắt lịch sử</button>
                  <button onClick={(e) => handleSubmit(e, "Sự khác biệt giữa động lượng và quán tính là gì?")} className="bg-slate-700/80 hover:bg-slate-600/80 transition-colors text-sm px-3 py-2 rounded-lg">So sánh các khái niệm</button>
              </div>
            </div>
          ) : (
             <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center">
                <SparklesIcon className="w-16 h-16 mb-4"/>
                <p className="text-lg">Cần quản lý một nhiệm vụ?</p>
                <p className="text-sm mb-6">ví dụ: "Đánh dấu bài luận lịch sử của tôi là đã hoàn thành."</p>
                <div className="flex flex-wrap justify-center gap-2">
                    <button onClick={(e) => handleSubmit(e, "Thêm một nhiệm vụ mới")} className="bg-slate-700/80 hover:bg-slate-600/80 transition-colors text-sm px-3 py-2 rounded-lg">Thêm một nhiệm vụ mới</button>
                    <button onClick={() => setInput("Tôi đã hoàn thành bài tập về...")} className="bg-slate-700/80 hover:bg-slate-600/80 transition-colors text-sm px-3 py-2 rounded-lg">Hoàn thành một nhiệm vụ</button>
                    <button onClick={() => setInput("Xóa nhiệm vụ của tôi về...")} className="bg-slate-700/80 hover:bg-slate-600/80 transition-colors text-sm px-3 py-2 rounded-lg">Xóa một nhiệm vụ</button>
                </div>
              </div>
          )
        )}
        {chatHistory.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-2xl ${msg.role === 'user' ? 'bg-cyan-600 text-white rounded-br-none' : 'bg-slate-700 text-slate-200 rounded-bl-none'}`}>
              <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-2xl bg-slate-700 text-slate-200 rounded-bl-none flex items-center space-x-2">
               <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-75"></div>
               <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-150"></div>
               <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-300"></div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-slate-700">
        <div className="flex items-center bg-slate-700 rounded-lg">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Đặt một câu hỏi..."
            className="w-full bg-transparent p-3 focus:outline-none"
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading || !input.trim()} className="p-3 text-cyan-400 disabled:text-slate-500 hover:text-cyan-300 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default AIAssistant;
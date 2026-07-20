import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../services/api';
import { FiMessageSquare, FiPlus, FiX, FiCheck, FiXCircle } from 'react-icons/fi';

const AdminAIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      loadSessions();
    }
  }, [isOpen]);

  useEffect(() => {
    if (currentSessionId) {
      loadSessionMessages(currentSessionId);
    } else {
      setMessages([{ role: 'model', text: 'مرحباً بك! أنا مساعدك الذكي ذو الصلاحيات الكاملة. يمكنك أن تطلب مني أي شيء وسأقوم به لك بعد موافقتك.' }]);
    }
  }, [currentSessionId]);

  const loadSessions = async () => {
    try {
      const res = await adminAPI.agentGetSessions();
      if (res.data?.success) {
        setSessions(res.data.data);
        if (res.data.data.length > 0 && !currentSessionId) {
          setCurrentSessionId(res.data.data[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to load sessions', err);
    }
  };

  const loadSessionMessages = async (id) => {
    try {
      const res = await adminAPI.agentGetSession(id);
      if (res.data?.success) {
        setMessages(res.data.data.messages || []);
      }
    } catch (err) {
      console.error('Failed to load session messages', err);
    }
  };

  const startNewSession = async () => {
    try {
      const res = await adminAPI.agentCreateSession();
      if (res.data?.success) {
        const newSession = res.data.data;
        setSessions([newSession, ...sessions]);
        setCurrentSessionId(newSession._id);
        setMessages([]);
      }
    } catch (err) {
      toast.error('فشل إنشاء محادثة جديدة');
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    let sessionId = currentSessionId;
    if (!sessionId) {
       // Create a session implicitly if none exists
       try {
         const res = await adminAPI.agentCreateSession();
         if (res.data?.success) {
           sessionId = res.data.data._id;
           setSessions([res.data.data, ...sessions]);
           setCurrentSessionId(sessionId);
         } else {
           throw new Error('Failed to create session');
         }
       } catch (err) {
         toast.error('فشل إنشاء محادثة');
         return;
       }
    }

    const userMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await adminAPI.agentChat(sessionId, userMessage.text);
      if (res.data?.success && res.data.data) {
        setMessages(prev => [...prev, res.data.data]);
        loadSessions(); // Refresh titles
      } else {
        toast.error(res.data?.message || 'فشل الاتصال بالمساعد الذكي');
      }
    } catch (err) {
      toast.error('حدث خطأ في الاتصال بالمساعد الذكي');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteAction = async (proposedAction, messageId, msgIndex) => {
    const toastId = toast.loading('جاري تنفيذ التعديلات...');
    try {
      const res = await adminAPI.agentExecute({
        sessionId: currentSessionId,
        messageId,
        collectionName: proposedAction.collectionName,
        documentIds: proposedAction.documentIds,
        updates: proposedAction.updates
      });
      if (res.data?.success) {
        toast.success(res.data.message || 'تم التنفيذ بنجاح!', { id: toastId });
        setMessages(prev => {
           const updated = [...prev];
           updated[msgIndex] = { ...updated[msgIndex], executed: true };
           return updated;
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل تنفيذ التعديلات', { id: toastId });
    }
  };

  const handleRejectAction = async (messageId, msgIndex) => {
    try {
      await adminAPI.agentReject({ sessionId: currentSessionId, messageId });
      setMessages(prev => {
         const updated = [...prev];
         updated[msgIndex] = { ...updated[msgIndex], executed: 'rejected' };
         return updated;
      });
    } catch (err) {
      toast.error('فشل الإلغاء');
    }
  };

  // UI Renderers for Previews
  const renderPreviewItem = (collectionName, item) => {
    switch (collectionName) {
      case 'Product':
        return (
          <div key={item._id} className="flex items-center gap-2 p-2 bg-white rounded border border-gray-100">
            {item.images?.[0]?.url ? (
              <img src={item.images[0].url} alt="" className="w-8 h-8 rounded object-cover" />
            ) : (
              <div className="w-8 h-8 rounded bg-gray-200" />
            )}
            <span className="text-xs font-medium text-gray-800 line-clamp-1">{item.name}</span>
          </div>
        );
      case 'User':
        return (
          <div key={item._id} className="flex flex-col p-2 bg-white rounded border border-gray-100">
             <span className="text-xs font-bold text-gray-800">{item.firstName} {item.lastName}</span>
             <span className="text-[10px] text-gray-500">{item.email} • {item.role}</span>
          </div>
        );
      case 'Order':
        return (
          <div key={item._id} className="flex flex-col p-2 bg-white rounded border border-gray-100">
             <span className="text-xs font-bold text-blue-700">{item.orderNumber}</span>
             <span className="text-[10px] text-gray-500">الحالة: {item.status} • الإجمالي: {item.total} ج.م</span>
          </div>
        );
      case 'Category':
        return (
          <div key={item._id} className="flex items-center gap-2 p-2 bg-white rounded border border-gray-100">
             <span className="text-xs font-medium text-gray-800">{item.name}</span>
          </div>
        );
      default:
        return (
          <div key={item._id} className="text-xs text-gray-700 bg-gray-50 p-1 px-2 rounded">
            {item._id}
          </div>
        );
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
      >
        <span className="text-2xl">✨</span>
      </button>

      {/* Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/30 z-[60]" onClick={() => setIsOpen(false)} />
      )}

      {/* Drawer Container */}
      <div className={`fixed top-0 right-0 h-full bg-white shadow-2xl z-[70] transition-transform duration-300 flex overflow-hidden border-l border-gray-200 ${
        isOpen ? 'translate-x-0 w-[90vw] md:w-[700px]' : 'translate-x-full w-0'
      }`}>
        
        {/* Left Sidebar (Sessions History) */}
        <div className="w-[250px] bg-gray-50 border-l border-gray-200 flex flex-col hidden md:flex">
          <div className="p-4 border-b border-gray-200">
            <button 
              onClick={startNewSession}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-sm font-bold text-gray-700"
            >
              <FiPlus /> محادثة جديدة
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {sessions.map(s => (
              <button
                key={s._id}
                onClick={() => setCurrentSessionId(s._id)}
                className={`w-full text-right p-3 rounded-lg text-sm transition-colors flex items-center gap-2 truncate ${
                  currentSessionId === s._id ? 'bg-purple-100 text-purple-700 font-medium' : 'hover:bg-gray-200 text-gray-700'
                }`}
              >
                <FiMessageSquare className="shrink-0" />
                <span className="truncate">{s.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Area (Active Chat) */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white flex justify-between items-center shadow-md z-10">
            <div className="flex items-center gap-2">
              <span className="text-xl">✨</span>
              <div>
                <h3 className="font-bold leading-tight">المساعد الذكي (Admin)</h3>
                <p className="text-[10px] text-purple-100">صلاحيات كاملة على المنتجات، المستخدمين، الطلبات</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
               {/* Mobile new chat button */}
               <button onClick={startNewSession} className="md:hidden p-2 text-white hover:bg-white/20 rounded">
                 <FiPlus />
               </button>
               <button onClick={() => setIsOpen(false)} className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors">
                 <FiX size={24} />
               </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5" style={{ scrollBehavior: 'smooth' }}>
            {messages.map((msg, index) => (
              <div key={msg._id || index} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                {msg.text && (
                  <div className={`max-w-[85%] p-3 rounded-2xl ${
                    msg.role === 'user' 
                      ? 'bg-purple-600 text-white rounded-br-none' 
                      : 'bg-gray-100 text-gray-800 shadow-sm border border-gray-200 rounded-bl-none'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                  </div>
                )}
                
                {msg.proposedAction && (
                  <div className="mt-3 w-full max-w-[95%] bg-white rounded-xl shadow-lg border border-yellow-300 overflow-hidden">
                    <div className="p-3 bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-yellow-200 flex items-start gap-2">
                      <span className="text-orange-500 mt-1 text-lg">⚠️</span>
                      <div>
                        <h4 className="font-bold text-orange-800 text-sm">مراجعة تعديلات على: {msg.proposedAction.collectionName}</h4>
                        <p className="text-xs text-orange-700 mt-1">{msg.proposedAction.reasoning}</p>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-gray-50">
                      <p className="text-xs font-semibold text-gray-600 mb-2">
                        العناصر المتأثرة ({msg.proposedAction.preview?.length || msg.proposedAction.documentIds?.length || 0}):
                      </p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[150px] overflow-y-auto mb-4 pr-1 custom-scrollbar">
                        {msg.proposedAction.preview?.map(p => renderPreviewItem(msg.proposedAction.collectionName, p))}
                      </div>

                      <div className="text-xs text-gray-700 bg-blue-50/50 p-3 rounded-xl border border-blue-200/50 mb-4 shadow-inner">
                        <span className="font-bold text-blue-800 block mb-2 flex items-center gap-1">
                          <span className="text-blue-500">🔧</span> التحديثات المقترحة:
                        </span>
                        <pre className="whitespace-pre-wrap font-mono text-[11px] text-blue-900 bg-white p-2 rounded border border-blue-100">
                          {JSON.stringify(msg.proposedAction.updates, null, 2)}
                        </pre>
                      </div>

                      {!msg.executed ? (
                         <div className="flex gap-3 mt-2">
                           <button 
                             onClick={() => handleExecuteAction(msg.proposedAction, msg._id, index)}
                             className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                           >
                             <FiCheck size={18} /> تأكيد التنفيذ
                           </button>
                           <button 
                             onClick={() => handleRejectAction(msg._id, index)}
                             className="px-4 bg-white border-2 border-red-100 text-red-600 hover:bg-red-50 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-2"
                           >
                             <FiXCircle size={18} /> إلغاء
                           </button>
                         </div>
                      ) : msg.executed === 'rejected' ? (
                         <div className="text-center py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                           <FiXCircle size={18} /> تم رفض التعديلات
                         </div>
                      ) : (
                         <div className="text-center py-2.5 bg-green-50 text-green-700 border border-green-200 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                           <FiCheck size={18} /> تم تنفيذ التعديلات بنجاح
                         </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-start">
                <div className="bg-gray-100 p-4 rounded-2xl rounded-bl-none shadow-sm flex gap-2 w-16 justify-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-200">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex gap-2 relative"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="اطلب أي شيء (مثال: أضف خصم 10٪ لمنتجات عيد الأم)..."
                className="flex-1 bg-gray-50 border border-gray-300 rounded-xl pr-4 pl-20 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-sm"
                disabled={isLoading}
              />
              <button 
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute left-2 top-2 bottom-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:grayscale text-white rounded-lg px-4 transition-all flex items-center justify-center shadow-md"
              >
                إرسال
              </button>
            </form>
            <div className="text-center mt-2">
              <span className="text-[10px] text-gray-400">لن يتم تنفيذ أي تعديلات على قاعدة البيانات بدون تأكيدك.</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminAIAssistant;

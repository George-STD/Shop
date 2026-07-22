import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../services/api';
import { 
  FiMessageSquare, 
  FiPlus, 
  FiX, 
  FiCheck, 
  FiXCircle, 
  FiTrash2, 
  FiMaximize2, 
  FiMinimize2, 
  FiSidebar 
} from 'react-icons/fi';

const AdminAIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
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

  const handleDeleteSession = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('هل أنت متأكد من حذف هذه المحادثة نهائياً؟')) return;

    try {
      const res = await adminAPI.agentDeleteSession(id);
      if (res.data?.success) {
        toast.success('تم حذف المحادثة');
        setSessions(prev => prev.filter(s => s._id !== id));
        if (currentSessionId === id) {
          setCurrentSessionId(null);
          setMessages([]);
        }
      }
    } catch (err) {
      toast.error('فشل حذف المحادثة');
    }
  };

  // UI Renderers for Previews
  const renderPreviewTable = (collectionName, items) => {
    if (!items || items.length === 0) return <div className="text-sm text-gray-500">لا يوجد عناصر متأثرة.</div>;

    let headers = [];
    let renderRow = null;

    switch (collectionName) {
      case 'Product':
        headers = ['الصورة', 'اسم المنتج', 'السعر', 'المخزون', 'الفئات', 'الحالة'];
        renderRow = (item) => (
          <>
            <td className="px-3 py-2 whitespace-nowrap">
              {item.images?.[0]?.url ? (
                <img src={item.images[0].url} alt="" className="w-8 h-8 rounded object-cover" />
              ) : (
                <div className="w-8 h-8 rounded bg-gray-200" />
              )}
            </td>
            <td className="px-3 py-2 whitespace-nowrap font-medium text-gray-900">{item.name}</td>
            <td className="px-3 py-2 whitespace-nowrap">{item.price} ج.م</td>
            <td className="px-3 py-2 whitespace-nowrap">{item.stock}</td>
            <td className="px-3 py-2 whitespace-nowrap text-xs">{(item.category || []).join(', ')}</td>
            <td className="px-3 py-2 whitespace-nowrap">
              <span className={`px-2 py-1 rounded text-[10px] ${item.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {item.isActive ? 'نشط' : 'غير نشط'}
              </span>
            </td>
          </>
        );
        break;
      case 'User':
        headers = ['الاسم', 'البريد الإلكتروني', 'الدور', 'الحالة'];
        renderRow = (item) => (
          <>
            <td className="px-3 py-2 whitespace-nowrap font-medium text-gray-900">{item.firstName} {item.lastName}</td>
            <td className="px-3 py-2 whitespace-nowrap text-gray-600">{item.email}</td>
            <td className="px-3 py-2 whitespace-nowrap text-blue-700">{item.role}</td>
            <td className="px-3 py-2 whitespace-nowrap">
              <span className={`px-2 py-1 rounded text-[10px] ${item.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {item.isActive ? 'نشط' : 'غير نشط'}
              </span>
            </td>
          </>
        );
        break;
      case 'Order':
        headers = ['رقم الطلب', 'الحالة', 'الإجمالي', 'العميل'];
        renderRow = (item) => (
          <>
            <td className="px-3 py-2 whitespace-nowrap font-medium text-gray-900">#{item.orderNumber}</td>
            <td className="px-3 py-2 whitespace-nowrap">
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-[10px]">{item.status}</span>
            </td>
            <td className="px-3 py-2 whitespace-nowrap">{item.total} ج.م</td>
            <td className="px-3 py-2 whitespace-nowrap text-gray-600">{item.user?.name || item.user || '-'}</td>
          </>
        );
        break;
      case 'Category':
        headers = ['الصورة', 'اسم الفئة', 'الرابط', 'الحالة'];
        renderRow = (item) => (
          <>
            <td className="px-3 py-2 whitespace-nowrap">
              {item.image?.url ? (
                <img src={item.image.url} alt="" className="w-8 h-8 rounded object-cover" />
              ) : (
                <div className="w-8 h-8 rounded bg-gray-200" />
              )}
            </td>
            <td className="px-3 py-2 whitespace-nowrap font-medium text-gray-900">{item.name}</td>
            <td className="px-3 py-2 whitespace-nowrap text-gray-600">{item.slug}</td>
            <td className="px-3 py-2 whitespace-nowrap">
              <span className={`px-2 py-1 rounded text-[10px] ${item.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {item.isActive ? 'نشط' : 'غير نشط'}
              </span>
            </td>
          </>
        );
        break;
      default:
        headers = ['المعرف (ID)'];
        renderRow = (item) => (
          <td className="px-3 py-2 whitespace-nowrap font-mono text-gray-600 text-xs">{item._id}</td>
        );
        break;
    }

    return (
      <div className="overflow-x-auto w-full rounded-xl border border-gray-200 shadow-sm max-h-[350px] overflow-y-auto custom-scrollbar bg-white">
        <table className="min-w-full w-full text-right text-xs text-gray-700 bg-white">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0 z-10 shadow-sm">
            <tr>
              {headers.map((h, i) => <th key={i} className="px-3 py-2.5 font-bold whitespace-nowrap">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item._id || idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                {renderRow(item)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
        title="المساعد الذكي (Admin)"
      >
        <span className="text-2xl">✨</span>
      </button>

      {/* Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[60]" onClick={() => setIsOpen(false)} />
      )}

      {/* Drawer Container */}
      <div className={`fixed top-0 right-0 h-full bg-white shadow-2xl z-[70] transition-all duration-300 flex overflow-hidden border-l border-gray-200 ${
        isOpen 
          ? isExpanded 
            ? 'translate-x-0 w-full md:w-[96vw]' 
            : 'translate-x-0 w-full md:w-[850px] lg:w-[950px]' 
          : 'translate-x-full w-0'
      }`}>
        
        {/* Left Sidebar (Sessions History) */}
        {showSidebar && (
          <div className="w-[260px] bg-gray-50 border-l border-gray-200 flex flex-col hidden md:flex shrink-0">
            <div className="p-4 border-b border-gray-200">
              <button 
                onClick={startNewSession}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-gray-300 rounded-xl hover:bg-purple-50 hover:border-purple-300 transition-all text-sm font-bold text-gray-700 shadow-xs"
              >
                <FiPlus /> محادثة جديدة
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {sessions.map(s => (
                <div
                  key={s._id}
                  onClick={() => setCurrentSessionId(s._id)}
                  className={`w-full text-right p-3 rounded-xl text-sm transition-colors flex items-center justify-between group cursor-pointer ${
                    currentSessionId === s._id ? 'bg-purple-100 text-purple-800 font-bold shadow-xs' : 'hover:bg-gray-200/70 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate overflow-hidden">
                    <FiMessageSquare className="shrink-0 text-purple-600" />
                    <span className="truncate block">{s.title}</span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteSession(e, s._id)}
                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                    title="حذف المحادثة"
                  >
                    <FiTrash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Right Area (Active Chat) */}
        <div className="flex-1 flex flex-col bg-white min-w-0">
          {/* Header */}
          <div className="p-3.5 px-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white flex justify-between items-center shadow-md z-10">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowSidebar(!showSidebar)} 
                className="hidden md:flex p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white"
                title={showSidebar ? "إخفاء قائمة المحادثات" : "إظهار قائمة المحادثات"}
              >
                <FiSidebar size={18} />
              </button>
              <span className="text-xl">✨</span>
              <div>
                <h3 className="font-bold text-sm md:text-base leading-tight">المساعد الذكي (Admin)</h3>
                <p className="text-[10px] text-purple-100">تحليل وتعديل المنتجات، المستخدمين، والطلبات</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5">
               {/* Expand / Fullscreen button */}
               <button 
                 onClick={() => setIsExpanded(!isExpanded)} 
                 className="hidden md:flex p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                 title={isExpanded ? "تصغير الحجم" : "توسيع الشاشة بالكامل"}
               >
                 {isExpanded ? <FiMinimize2 size={18} /> : <FiMaximize2 size={18} />}
               </button>

               {/* Mobile new chat button */}
               <button onClick={startNewSession} className="md:hidden p-2 text-white hover:bg-white/20 rounded-lg">
                 <FiPlus size={18} />
               </button>

               <button onClick={() => setIsOpen(false)} className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors">
                 <FiX size={20} />
               </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-5 bg-gray-50/40" style={{ scrollBehavior: 'smooth' }}>
            {messages.map((msg, index) => (
              <div key={msg._id || index} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                {msg.text && (
                  <div className={`max-w-[88%] md:max-w-[80%] p-3.5 rounded-2xl shadow-xs ${
                    msg.role === 'user' 
                      ? 'bg-purple-600 text-white rounded-br-none font-medium' 
                      : 'bg-white text-gray-800 border border-gray-200/80 rounded-bl-none shadow-sm'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                  </div>
                )}
                
                {msg.proposedAction && (
                  <div className="mt-3 w-full bg-white rounded-2xl shadow-lg border border-amber-300/80 overflow-hidden">
                    <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200/80 flex items-start gap-2.5">
                      <span className="text-orange-500 mt-0.5 text-lg">⚠️</span>
                      <div className="flex-1">
                        <h4 className="font-bold text-orange-900 text-sm">مراجعة تعديلات على جدول: {msg.proposedAction.collectionName}</h4>
                        <p className="text-xs text-orange-800 mt-0.5 font-medium">{msg.proposedAction.reasoning}</p>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-gray-50/60 space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-bold text-gray-700">
                            العناصر المتأثرة ({msg.proposedAction.preview?.length || msg.proposedAction.documentIds?.length || 0}):
                          </p>
                          <span className="text-[10px] text-gray-500 bg-gray-200/60 px-2 py-0.5 rounded-full">
                            جدول قابل للتمرير الأفقي والرأسي
                          </span>
                        </div>
                        {renderPreviewTable(msg.proposedAction.collectionName, msg.proposedAction.preview)}
                      </div>

                      <div className="text-xs text-gray-700 bg-blue-50/60 p-3.5 rounded-xl border border-blue-200/70 shadow-xs">
                        <span className="font-bold text-blue-900 block mb-2 flex items-center gap-1.5">
                          <span className="text-blue-600">🔧</span> التحديثات المقترحة (MongoDB JSON):
                        </span>
                        <pre className="whitespace-pre-wrap font-mono text-[11px] text-blue-950 bg-white p-2.5 rounded-lg border border-blue-100/80 max-h-[160px] overflow-y-auto custom-scrollbar break-all">
                          {JSON.stringify(msg.proposedAction.updates, null, 2)}
                        </pre>
                      </div>

                      {!msg.executed ? (
                         <div className="flex gap-3 pt-1">
                           <button 
                             onClick={() => handleExecuteAction(msg.proposedAction, msg._id, index)}
                             className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                           >
                             <FiCheck size={18} /> تأكيد التنفيذ
                           </button>
                           <button 
                             onClick={() => handleRejectAction(msg._id, index)}
                             className="px-5 bg-white border border-red-200 text-red-600 hover:bg-red-50 py-2.5 rounded-xl text-sm font-bold shadow-xs transition-all flex items-center gap-2"
                           >
                             <FiXCircle size={18} /> إلغاء
                           </button>
                         </div>
                      ) : msg.executed === 'rejected' ? (
                         <div className="text-center py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                           <FiXCircle size={18} /> تم رفض التعديلات
                         </div>
                      ) : (
                         <div className="text-center py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
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

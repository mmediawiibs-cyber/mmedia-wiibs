import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';

const TEAM_MEMBERS = ['Doni', 'Ersady', 'Jalal', 'Rica', 'Bila', 'Resti', 'Afghan'];

const MEMBER_COLORS = {
  'Doni': { bg: 'bg-blue-100', text: 'text-blue-900', border: 'border-blue-200' },
  'Ersady': { bg: 'bg-emerald-100', text: 'text-emerald-900', border: 'border-emerald-200' },
  'Jalal': { bg: 'bg-amber-100', text: 'text-amber-900', border: 'border-amber-200' },
  'Rica': { bg: 'bg-pink-100', text: 'text-pink-900', border: 'border-pink-200' },
  'Bila': { bg: 'bg-purple-100', text: 'text-purple-900', border: 'border-purple-200' },
  'Resti': { bg: 'bg-orange-100', text: 'text-orange-900', border: 'border-orange-200' },
  'Afghan': { bg: 'bg-cyan-100', text: 'text-cyan-900', border: 'border-cyan-200' },
};

const EVENT_COLORS = [
  { id: 'default', bg: 'bg-white', border: 'border-gray-200', tab: 'bg-gray-400' },
  { id: 'high', bg: 'bg-red-50', border: 'border-red-200', tab: 'bg-red-500' },
  { id: 'medium', bg: 'bg-orange-50', border: 'border-orange-200', tab: 'bg-orange-500' },
  { id: 'low', bg: 'bg-green-50', border: 'border-green-200', tab: 'bg-green-500' },
  { id: 'info', bg: 'bg-blue-50', border: 'border-blue-200', tab: 'bg-blue-500' }
];

const UNIT_OPTIONS = ['Asset Management', 'Content Creator', 'Design Graphic'];

const TASK_TYPES = [
  'Dokumentasi', 'Carousel', 'Fotoshoot', 'Reels', 'Story', 
  'Aftermovie', 'Short Video', 'Nesting Asset', 'Video Rekap', 
  'Streaming', 'Operator', 'Taping', 'Recording', 'BTS', 
  'Reporting', 'Posting'
];

const generateId = () => Math.random().toString(36).substr(2, 9);

// Setup Cloud Database (Firebase)
const firebaseConfig = {
  apiKey: "AIzaSyC5fsM7k6D4HIhhmvNMVniGReHmIbItynY",
  authDomain: "mmedia-wiibs-task-planner.firebaseapp.com",
  projectId: "mmedia-wiibs-task-planner",
  storageBucket: "mmedia-wiibs-task-planner.firebasestorage.app",
  messagingSenderId: "220009310175",
  appId: "1:220009310175:web:2448053c2da0df705c866a",
  measurementId: "G-58SLK1JQBM"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'mmedia-wiibs-app';

const getWeekDays = (weekOffset) => {
  const today = new Date();
  const dayOfWeek = today.getDay() || 7; 
  today.setHours(0, 0, 0, 0);
  const monday = new Date(today);
  monday.setDate(today.getDate() - dayOfWeek + 1 + (weekOffset * 7));

  const days = [];
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  for (let i = 0; i < 7; i++) {
    const currentDay = new Date(monday);
    currentDay.setDate(monday.getDate() + i);
    const dateKey = `${currentDay.getFullYear()}-${String(currentDay.getMonth() + 1).padStart(2, '0')}-${String(currentDay.getDate()).padStart(2, '0')}`;
    const display = `${dayNames[currentDay.getDay()]}, ${currentDay.getDate()} ${monthNames[currentDay.getMonth()]}`;
    days.push({ dateKey, display });
  }
  return days;
};

const EventCard = ({
  event,
  onDragStart,
  onDragEnd,
  onUpdateEventParentType,
  onUpdateEventTitle,
  onUpdateEventUnit,
  onUpdateEventColor,
  onDeleteEvent,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onToggleTaskCompletion
}) => {
  const activeColor = EVENT_COLORS.find(c => c.id === event.colorId) || EVENT_COLORS[0];
  const visibleTasks = (event.tasks || []).filter(t => !t.isCompleted);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, event.id)}
      onDragEnd={onDragEnd}
      className={`${activeColor.bg} ${activeColor.border} border-l-4 rounded-xl shadow-sm hover:shadow-md transition-all p-3 mb-3 cursor-grab active:cursor-grabbing border relative overflow-hidden group`}
      style={{ borderLeftColor: activeColor.id === 'default' ? '#cbd5e1' : undefined }}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${activeColor.tab}`}></div>

      <div className="flex flex-col gap-2 mb-3 ml-1">
        <div className="flex justify-between items-start">
          <div className="flex flex-col w-full mr-2 gap-1.5">
            <div className="relative w-fit mb-0.5">
               <select
                 value={event.parentType || 'Event'}
                 onChange={(e) => onUpdateEventParentType(event.id, e.target.value)}
                 className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-600 bg-indigo-50 rounded-md px-2.5 py-0.5 border border-indigo-100 hover:bg-indigo-100 focus:ring-0 cursor-pointer appearance-none pr-6 transition-colors shadow-sm"
               >
                 <option value="Event">Event</option>
                 <option value="Task">Task</option>
               </select>
               <div className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-400">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
               </div>
            </div>

            {event.parentType === 'Task' ? (
              <div className="relative w-fit">
                 <select
                   value={event.unit || UNIT_OPTIONS[0]}
                   onChange={(e) => onUpdateEventUnit(event.id, e.target.value)}
                   className="font-bold text-gray-800 bg-transparent border-b border-gray-200 hover:border-gray-400 focus:border-indigo-500 focus:outline-none cursor-pointer p-0 pb-1 pr-5 appearance-none text-sm transition-colors"
                 >
                   {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                 </select>
                 <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                 </div>
              </div>
            ) : (
              <input
                type="text"
                value={event.title || ''}
                onChange={(e) => onUpdateEventTitle(event.id, e.target.value)}
                className="font-bold text-gray-800 bg-transparent border-b border-gray-200 hover:border-gray-400 focus:border-indigo-500 focus:outline-none w-full p-0 pb-1 text-sm transition-colors placeholder:text-gray-300"
                placeholder="Tulis Judul..."
              />
            )}
          </div>
          <button onClick={() => onDeleteEvent(event.id)} className="text-gray-300 hover:text-red-500 bg-white/50 hover:bg-red-50 rounded-lg p-1 transition-colors opacity-0 group-hover:opacity-100 shadow-sm border border-transparent hover:border-red-100" title="Hapus Blok">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <div className="flex gap-1.5 mt-1">
          {EVENT_COLORS.map(color => (
            <button
              key={color.id}
              onClick={() => onUpdateEventColor(event.id, color.id)}
              className={`w-3.5 h-3.5 rounded-full ${color.tab} border-2 border-white shadow-sm transition-transform hover:scale-110 ${event.colorId === color.id ? 'ring-2 ring-offset-1 ring-gray-300 scale-110' : ''}`}
              title={`Pilih Warna`}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col ml-1 mb-3 shadow-sm rounded-lg bg-white border border-gray-200 overflow-hidden">
        {visibleTasks.length === 0 && (
          <div className="text-[11px] text-center p-3 text-gray-400 font-medium bg-gray-50/50">Belum ada tugas</div>
        )}
        
        {visibleTasks.map((task, index) => {
          const isSameAsPrev = index > 0 && visibleTasks[index - 1].assignee === task.assignee;
          const memberStyle = MEMBER_COLORS[task.assignee] || { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };

          return (
            <div key={task.id} className="flex relative group/task border-b border-gray-100 last:border-b-0">
              <button 
                onClick={() => onDeleteTask(event.id, task.id)}
                className="absolute -top-2 -right-2 z-10 bg-white rounded-full p-0.5 text-gray-400 hover:text-red-500 opacity-0 group-hover/task:opacity-100 shadow-md border border-gray-200 transition-all hover:scale-110"
              >
                 <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
              
              <div className={`w-[35%] p-1 border-r border-gray-100 flex flex-col justify-center transition-colors ${memberStyle.bg} ${memberStyle.text}`}>
                <div className="relative w-full flex items-center h-full">
                  <select
                    value={task.assignee}
                    onChange={(e) => onUpdateTask(event.id, task.id, { assignee: e.target.value })}
                    className={`w-full h-full text-[11px] bg-transparent border-none focus:ring-0 font-extrabold outline-none cursor-pointer appearance-none truncate px-2 pr-5 ${isSameAsPrev ? 'opacity-40 hover:opacity-80' : 'opacity-100'}`}
                  >
                    {TEAM_MEMBERS.map(name => <option key={name} value={name}>{name}</option>)}
                  </select>
                  <div className={`absolute right-1 pointer-events-none ${isSameAsPrev ? 'opacity-30' : 'opacity-60'}`}>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              <div className="w-[65%] p-1.5 bg-white flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex-1 w-full min-w-0 mr-1.5">
                  {task.isCustom ? (
                    <div className="flex items-center w-full gap-1">
                      <input
                        type="text"
                        value={task.type}
                        onChange={(e) => onUpdateTask(event.id, task.id, { type: e.target.value })}
                        className="w-full text-[11px] p-1 px-1.5 bg-white border border-indigo-200 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-gray-800 outline-none shadow-inner"
                        placeholder="Ketik manual..."
                        autoFocus
                      />
                      <button
                        onClick={() => onUpdateTask(event.id, task.id, { isCustom: false, type: TASK_TYPES[0] })}
                        className="text-gray-400 hover:text-red-500 p-1 shrink-0 bg-gray-50 hover:bg-red-50 rounded-md transition-colors"
                        title="Batal"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      </button>
                    </div>
                  ) : (
                    <div className="relative w-full">
                      <select
                        value={TASK_TYPES.includes(task.type) ? task.type : (task.type === '' ? '...' : task.type)}
                        onChange={(e) => {
                          if (e.target.value === '...') {
                            onUpdateTask(event.id, task.id, { isCustom: true, type: '' });
                          } else {
                            onUpdateTask(event.id, task.id, { type: e.target.value });
                          }
                        }}
                        className="w-full text-[11px] py-1 px-1.5 bg-transparent border-none focus:ring-0 font-semibold text-gray-700 outline-none cursor-pointer truncate appearance-none pr-5 hover:text-indigo-600 transition-colors"
                      >
                        {TASK_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                        <option value="...">...</option>
                      </select>
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 opacity-60">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => onToggleTaskCompletion(event.id, task.id)}
                  className="w-5 h-5 shrink-0 flex items-center justify-center rounded-md bg-white border border-gray-300 hover:bg-emerald-50 hover:border-emerald-400 text-gray-200 hover:text-emerald-500 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:ring-offset-1"
                  title="Tandai Selesai"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => onAddTask(event.id)}
        className="w-full py-1.5 text-[11px] text-gray-500 font-bold bg-gray-50/80 hover:bg-gray-200/80 rounded-lg transition-colors flex items-center justify-center gap-1.5 ml-1 border border-transparent hover:border-gray-200"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
        Tambah Tugas
      </button>
    </div>
  );
};

export default function MediaPlanner() {
  const [history, setHistory] = useState([{}]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [draggedEventId, setDraggedEventId] = useState(null);
  
  const [user, setUser] = useState(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState('Menghubungkan...');

  const [weekOffset, setWeekOffset] = useState(0);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: 'model', parts: [{ text: 'Halo! Saya WIIBS AI Assistant. Ada yang bisa saya bantu hari ini?\n\n💡 Ketik pertanyaan biasa untuk obrolan umum, atau awali pesan dengan "/konten" untuk mengaktifkan mode Creative Director (pembuatan naskah video/Reels)!' }] }
  ]);
  const chatEndRef = useRef(null);

  const events = history[historyIndex] || {}; 

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth error:", error);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    
    setSyncStatus('Menyinkronkan...');
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'planner', 'events');
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data().events;
        if (data) {
          setHistory(prev => {
            const currentStr = JSON.stringify(prev[historyIndex] || {});
            const newStr = JSON.stringify(data);
            if (currentStr !== newStr) {
               setHistoryIndex(0);
               return [data];
            }
            return prev;
          });
        }
      } else {
        const initialEventId = generateId();
        const currentWeekDays = getWeekDays(0);
        const mondayDateKey = currentWeekDays[1].dateKey;
        const defaultEvent = {
          [initialEventId]: {
            id: initialEventId,
            parentType: 'Event',
            title: 'Konten IG Reels & Story',
            unit: UNIT_OPTIONS[0],
            date: mondayDateKey, 
            colorId: 'medium',
            tasks: [
              { id: generateId(), assignee: 'Rica', type: 'Reporting', isCustom: false, isCompleted: false },
              { id: generateId(), assignee: 'Ersady', type: 'Reels', isCustom: false, isCompleted: false } 
            ]
          }
        };
        setHistory([defaultEvent]);
        setHistoryIndex(0);
        setDoc(docRef, { events: defaultEvent }).catch(console.error);
      }
      setIsDataLoaded(true);
      setSyncStatus('Cloud Aktif');
    }, (error) => {
      console.error("Database sync error:", error);
      setSyncStatus('Offline Mode');
      setIsDataLoaded(true);
    });

    return () => unsubscribe();
  }, [user]);

  const syncToCloud = (eventsToSync) => {
    if (user) {
      setSyncStatus('Menyimpan...');
      const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'planner', 'events');
      setDoc(docRef, { events: eventsToSync })
        .then(() => setSyncStatus('Tersimpan'))
        .catch(() => setSyncStatus('Gagal Simpan'));
    }
  };

  const updateEvents = (updater) => {
    setHistory(prevHistory => {
      const currentEvents = prevHistory[historyIndex];
      const newEvents = typeof updater === 'function' ? updater(currentEvents) : updater;
      
      const newHistory = prevHistory.slice(0, historyIndex + 1);
      newHistory.push(newEvents);
      
      syncToCloud(newEvents);
      
      return newHistory;
    });
    setHistoryIndex(prev => prev + 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      syncToCloud(history[newIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      syncToCloud(history[newIndex]);
    }
  };

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatOpen]);

  const handleSendChatMessage = async () => {
    if (!chatInput.trim()) return;

    const newUserMsg = { role: 'user', parts: [{ text: chatInput }] };
    const newHistory = [...chatMessages, newUserMsg];
    setChatMessages(newHistory);
    setChatInput('');
    setIsChatLoading(true);

    try {
      // 🔑 MASUKKAN API KEY ANDA DI SINI
      const apiKey = "AIzaSyAF7lw8y7cM3AXypyV4LW0di1vtg6xAY5g"; 
      
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

      const isContentMode = chatInput.trim().toLowerCase().startsWith('/konten');

      let systemPrompt = "";

      if (isContentMode) {
        systemPrompt = `Anda adalah Creative Director untuk konten media sosial sekolah Islam Internasional (Salaf).

Setiap pesan dari saya adalah permintaan naskah konten video (Reels).
Tugas Anda adalah merancang **Skenario Drama Pendek/Skit** yang menyentuh hati atau edukatif, bukan sekadar visual kosong.

**IDENTITAS & BATASAN (MUTLAK):**
1.  **Peran:** Saya Kabag Media. Target audiens adalah Wali Santri dan Calon Wali Santri.
2.  **Subjek Utama:** Divisi Banat (Akhwat).
    * **Visual:** Wajib Berniqab/Bercadar.
    * **Talent:** Santriwati atau Ustadzah.
    * **Bahasa:** Dialog talent wajib **Bahasa Arab** atau **Inggris** (tunjukkan kesan International School), sertakan terjemahan Indonesia di naskah.
3.  **Audio:** Tanpa musik. Hanya suara asli (ASMR), Dialog, dan Nasheed Vokal (Acapella).
4.  **Tone:** Berkelas, Syar'i, namun tetap relate dengan kehidupan remaja gen-Z yang islami.

**FORMAT RESPON (WAJIB IKUTI STRUKTUR INI):**

**1. JUDUL & HOOK**
* **Judul:** (Singkat)
* **Hook Visual/Audio:** (Detik pertama yang membuat orang berhenti scroll).

**2. SKENARIO DRAMA (SCENE BY SCENE)**
* Fokus pada *Directing Talent*: Apa yang mereka lakukan dan apa yang mereka katakan.
* **Format:**
    * *Scene 1:* [Deskripsi singkat situasi]
    * *Talent A (Arab/Inggris):* "..." (Terjemahan: ...)
    * *Talent B (Arab/Inggris):* "..." (Terjemahan: ...)
    * *Scene 2:* [Resolusi/Ending]

**3. AUDIO ATMOSPHERE**
* Saran Nasheed (Vokal Only) atau Sound Effect (misal: suara hujan, langkah kaki, bel sekolah).

**4. DRAFT COPYWRITING (3 JENIS)**
* **A. Caption Instagram:** (Lengkap dengan headline dan hashtag).
* **B. Broadcast Pra-Acara/Teaser:** (Teks pendek untuk disebar di grup WA Wali Santri/Internal *sebelum* video tayang/saat proses syuting untuk membangun hype).
* **C. Broadcast Share Link:** (Teks persuasif untuk disebar di grup saat video *sudah* diposting agar orang mau klik).`;
      } else {
        systemPrompt = "Anda adalah Asisten AI khusus untuk departemen media 'MMedia WIIBS'. Gunakan bahasa Indonesia yang asik, gaul, namun tetap profesional. Tugas Anda adalah membantu manajer mengatur jadwal, memberikan ide konten kreatif umum, dan memberi saran produktivitas. Fokus jawaban Anda seputar dunia broadcasting, desain grafis, dan manajemen tim media. Jika pengguna ingin skenario drama/Reels spesifik, beritahu mereka untuk menggunakan perintah '/konten' di awal pesan.";
      }

      const payload = {
        contents: newHistory,
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        }
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      if (result.error) {
         setChatMessages(prev => [...prev, { role: 'model', parts: [{ text: `Error: ${result.error.message || 'API Key mungkin tidak valid atau kosong.'}` }] }]);
      } else if (result.candidates && result.candidates[0].content) {
          setChatMessages(prev => [...prev, result.candidates[0].content]);
      } else {
          setChatMessages(prev => [...prev, { role: 'model', parts: [{ text: 'Maaf, respons dari AI kosong atau tidak sesuai.' }] }]);
      }
    } catch (error) {
      setChatMessages(prev => [...prev, { role: 'model', parts: [{ text: 'Terjadi kesalahan jaringan atau koneksi API. Pastikan API Key sudah dimasukkan dengan benar.' }] }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  useEffect(() => {
    if (history.length === 1 && Object.keys(history[0]).length === 0) {
      const initialEventId = generateId();
      const currentWeekDays = getWeekDays(0);
      const mondayDateKey = currentWeekDays[1].dateKey;

      setHistory([{
        [initialEventId]: {
          id: initialEventId,
          parentType: 'Event',
          title: 'Konten IG Reels & Story',
          unit: UNIT_OPTIONS[0],
          date: mondayDateKey, 
          colorId: 'medium',
          tasks: [
            { id: generateId(), assignee: 'Rica', type: 'Reporting', isCustom: false, isCompleted: false },
            { id: generateId(), assignee: 'Ersady', type: 'Reels', isCustom: false, isCompleted: false } 
          ]
        }
      }]);
    }
  }, []);

  const handleCreateEvent = () => {
    const newId = generateId();
    updateEvents(prev => ({
      ...prev,
      [newId]: {
        id: newId,
        parentType: 'Event',
        title: 'Event Baru',
        unit: UNIT_OPTIONS[0],
        date: null,
        colorId: 'default',
        tasks: []
      }
    }));
  };

  const handleUpdateEventParentType = (eventId, newType) => {
    updateEvents(prev => ({
      ...prev,
      [eventId]: { ...prev[eventId], parentType: newType }
    }));
  };

  const handleUpdateEventTitle = (eventId, newTitle) => {
    updateEvents(prev => ({
      ...prev,
      [eventId]: { ...prev[eventId], title: newTitle }
    }));
  };

  const handleUpdateEventUnit = (eventId, newUnit) => {
    updateEvents(prev => ({
      ...prev,
      [eventId]: { ...prev[eventId], unit: newUnit }
    }));
  };

  const handleUpdateEventColor = (eventId, colorId) => {
    updateEvents(prev => ({
      ...prev,
      [eventId]: { ...prev[eventId], colorId: colorId }
    }));
  };

  const handleDeleteEvent = (eventId) => {
    updateEvents(prev => {
      const newEvents = { ...prev };
      delete newEvents[eventId];
      return newEvents;
    });
  };

  const handleAddTask = (eventId) => {
    updateEvents(prev => {
      const event = prev[eventId];
      return {
        ...prev,
        [eventId]: {
          ...event,
          tasks: [...(event.tasks || []), { id: generateId(), assignee: TEAM_MEMBERS[0], type: TASK_TYPES[0], isCustom: false, isCompleted: false }]
        }
      }
    });
  };

  const handleUpdateTask = (eventId, taskId, updates) => {
    updateEvents(prev => {
      const event = prev[eventId];
      const updatedTasks = event.tasks.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      );
      return {
        ...prev,
        [eventId]: { ...event, tasks: updatedTasks }
      };
    });
  };

  const handleDeleteTask = (eventId, taskId) => {
    updateEvents(prev => {
      const event = prev[eventId];
      const filteredTasks = event.tasks.filter(task => task.id !== taskId);
      return {
        ...prev,
        [eventId]: { ...event, tasks: filteredTasks }
      };
    });
  };

  const handleToggleTaskCompletion = (eventId, taskId) => {
    updateEvents(prev => {
      const event = prev[eventId];
      const updatedTasks = event.tasks.map(task => 
        task.id === taskId ? { ...task, isCompleted: !task.isCompleted } : task
      );
      return {
        ...prev,
        [eventId]: { ...event, tasks: updatedTasks }
      };
    });
  };

  const handleDragStart = (e, eventId) => {
    setDraggedEventId(eventId);
    e.dataTransfer.setData('text/plain', eventId);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
      if(e.target && e.target.classList) {
        e.target.classList.add('opacity-40', 'scale-95');
      }
    }, 0);
  };

  const handleDragEnd = (e) => {
    if(e.target && e.target.classList) {
      e.target.classList.remove('opacity-40', 'scale-95');
    }
    setDraggedEventId(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetDateKey) => {
    e.preventDefault();
    const eventId = draggedEventId || e.dataTransfer.getData('text/plain');
    
    if (eventId && events[eventId]) {
      updateEvents(prev => ({
        ...prev,
        [eventId]: { ...prev[eventId], date: targetDateKey }
      }));
    }
    setDraggedEventId(null);
  };

  const currentWeekDays = getWeekDays(weekOffset);
  const unassignedEvents = Object.values(events).filter(e => !e.date);
  
  const eventsByDate = currentWeekDays.reduce((acc, day) => {
    acc[day.dateKey] = Object.values(events).filter(e => e.date === day.dateKey);
    return acc;
  }, {});

  const completedTasks = [];
  Object.values(events).forEach(event => {
    if (event.tasks) {
      event.tasks.forEach(task => {
        if (task.isCompleted) {
          completedTasks.push({ 
            eventId: event.id, 
            eventTitle: event.parentType === 'Task' ? event.unit : event.title, 
            eventColor: event.colorId, 
            task 
          });
        }
      });
    }
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-3 md:p-5 flex flex-col relative overflow-x-hidden">
      
      <header className="sticky top-2 z-40 bg-white/70 backdrop-blur-xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-3 md:px-5 flex flex-col md:flex-row justify-between items-center mb-6 ring-1 ring-black/5">
        <div className="flex items-center gap-4 mb-4 md:mb-0">
          <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center p-1.5 shrink-0 overflow-hidden drop-shadow-sm">
             <img src="LOGO AL WAFI TV-01.png" alt="Logo Al Wafi TV" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-cyan-400 tracking-tight flex items-center gap-2">
              MMedia WIIBS
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Task Planner</p>
              <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors ${syncStatus === 'Tersimpan' || syncStatus === 'Cloud Aktif' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>
                {syncStatus === 'Tersimpan' || syncStatus === 'Cloud Aktif' ? (
                   <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                ) : syncStatus === 'Offline Mode' ? (
                   <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"></path></svg>
                ) : (
                   <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                )}
                {syncStatus}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-white border border-gray-200 p-1 rounded-xl shadow-sm">
            <button onClick={() => setWeekOffset(prev => prev - 1)} className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors" title="Pekan Lalu">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
            </button>
            <span className="text-xs font-bold text-gray-700 min-w-[90px] text-center tracking-wide">
              {weekOffset === 0 ? 'PEKAN INI' : weekOffset === -1 ? 'PEKAN LALU' : weekOffset === 1 ? 'PEKAN DEPAN' : `PEKAN ${weekOffset > 0 ? '+' : ''}${weekOffset}`}
            </span>
            <button onClick={() => setWeekOffset(prev => prev + 1)} className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors" title="Pekan Depan">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
            </button>
            <div className="w-px h-5 bg-gray-200 mx-1"></div>
            <button onClick={() => setWeekOffset(0)} className="text-[10px] px-2.5 py-1.5 text-teal-700 font-bold bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors uppercase tracking-wider">HARI INI</button>
          </div>

          <div className="flex bg-white rounded-xl p-1 border border-gray-200 shadow-sm">
            <button 
              onClick={handleUndo} 
              disabled={historyIndex === 0}
              className={`px-3 py-1.5 rounded-lg flex items-center justify-center transition-all ${historyIndex === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600'}`}
              title="Undo"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path></svg>
            </button>
            <div className="w-px bg-gray-200 mx-0.5 my-1.5"></div>
            <button 
              onClick={handleRedo} 
              disabled={historyIndex === history.length - 1}
              className={`px-3 py-1.5 rounded-lg flex items-center justify-center transition-all ${historyIndex === history.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600'}`}
              title="Redo"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"></path></svg>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-col xl:flex-row gap-4 flex-1 min-h-0">
        
        <div 
          className="w-full xl:w-64 bg-white rounded-2xl p-4 border border-gray-200 flex flex-col shrink-0 shadow-sm sticky top-[6.5rem] z-30 h-fit" 
          style={{ maxHeight: 'calc(100vh - 8rem)' }}
        >
          <div className="flex justify-between items-center mb-4 sticky top-0 bg-white z-10 py-1">
            <h2 className="font-extrabold text-gray-800 uppercase text-xs tracking-widest flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm"></span> Blok Cadangan
            </h2>
            <button
              onClick={handleCreateEvent}
              className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg flex items-center gap-1 text-xs font-bold px-3"
              title="Buat Event Baru"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
              Baru
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-1 pb-4 custom-scrollbar">
            {unassignedEvents.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 text-gray-400 text-sm font-medium">
                Tidak ada blok.<br/><span className="text-xs opacity-75 mt-2 block">Klik tombol "+ Baru" untuk membuat tugas.</span>
              </div>
            ) : (
              unassignedEvents.map(event => (
                <EventCard
                  key={event.id}
                  event={event}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onUpdateEventParentType={handleUpdateEventParentType}
                  onUpdateEventTitle={handleUpdateEventTitle}
                  onUpdateEventUnit={handleUpdateEventUnit}
                  onUpdateEventColor={handleUpdateEventColor}
                  onDeleteEvent={handleDeleteEvent}
                  onAddTask={handleAddTask}
                  onUpdateTask={handleUpdateTask}
                  onDeleteTask={handleDeleteTask}
                  onToggleTaskCompletion={handleToggleTaskCompletion}
                />
              ))
            )}
          </div>
        </div>

        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col min-w-0 w-full mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-px bg-gray-100 flex-1">
            {currentWeekDays.map((day, index) => {
              
              let headerColorClass = "bg-gray-50 border-gray-200 text-gray-700";
              let dropAreaBgClass = "bg-slate-50/20 hover:bg-slate-50/70";

              if (index >= 0 && index <= 2) {
                headerColorClass = "bg-orange-50 border-orange-100 text-orange-800"; 
                dropAreaBgClass = "bg-orange-50/10 hover:bg-orange-50/40";
              } else if (index === 3) {
                headerColorClass = "bg-red-50 border-red-100 text-red-800";
                dropAreaBgClass = "bg-red-50/10 hover:bg-red-50/40";
              } else if (index === 4) {
                headerColorClass = "bg-green-50 border-green-100 text-green-800";
                dropAreaBgClass = "bg-green-50/10 hover:bg-green-50/40";
              } else if (index === 5) {
                headerColorClass = "bg-blue-50 border-blue-100 text-blue-800";
                dropAreaBgClass = "bg-blue-50/10 hover:bg-blue-50/40";
              } else if (index === 6) {
                headerColorClass = "bg-gray-200 border-gray-300 text-gray-600";
                dropAreaBgClass = "bg-gray-100/30 hover:bg-gray-100/60";
              }

              const isToday = day.dateKey === new Date().toISOString().split('T')[0];

              return (
                <div
                  key={day.dateKey}
                  className="bg-white min-h-[600px] flex flex-col h-full transition-all group/day"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, day.dateKey)}
                >
                  <div className={`p-3 border-b flex justify-center items-center shadow-sm relative ${headerColorClass}`}>
                    {isToday && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    )}
                    <h3 className={`text-[13px] tracking-wide ${isToday ? 'font-extrabold' : 'font-bold'}`}>{day.display}</h3>
                  </div>
                  
                  <div className={`flex-1 p-2 transition-colors flex flex-col h-full ${dropAreaBgClass}`}>
                    {eventsByDate[day.dateKey].map(event => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onUpdateEventParentType={handleUpdateEventParentType}
                        onUpdateEventTitle={handleUpdateEventTitle}
                        onUpdateEventUnit={handleUpdateEventUnit}
                        onUpdateEventColor={handleUpdateEventColor}
                        onDeleteEvent={handleDeleteEvent}
                        onAddTask={handleAddTask}
                        onUpdateTask={handleUpdateTask}
                        onDeleteTask={handleDeleteTask}
                        onToggleTaskCompletion={handleToggleTaskCompletion}
                      />
                    ))}
                    
                    {eventsByDate[day.dateKey].length === 0 && (
                      <div className="flex-1 flex items-center justify-center text-[11px] font-medium text-gray-300 p-4 text-center pointer-events-none min-h-[150px] border-2 border-dashed border-transparent group-hover/day:border-gray-200 rounded-xl m-2 transition-all">
                        Tarik ke sini
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div 
          className="w-full xl:w-[16rem] bg-slate-50/80 rounded-2xl p-4 border border-slate-200 flex flex-col shrink-0 shadow-inner sticky top-[6.5rem] z-30 h-fit"
          style={{ maxHeight: 'calc(100vh - 8rem)' }}
        >
          <div className="flex justify-between items-center mb-4 sticky top-0 bg-slate-50/80 py-2 z-10 border-b border-slate-200 backdrop-blur-sm">
            <h2 className="font-extrabold text-slate-700 uppercase text-xs tracking-widest flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm animate-pulse"></span> Selesai
            </h2>
            <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-lg border border-emerald-200 shadow-sm">
              {completedTasks.length} Tugas
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-1 pb-4 flex flex-col gap-2.5 custom-scrollbar">
            {completedTasks.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-[11px] font-medium bg-white/50">
                Belum ada tugas selesai.<br/><span className="text-[10px] opacity-75 mt-1 block">Centang tugas di kalender.</span>
              </div>
            ) : (
              completedTasks.map(({ eventId, eventTitle, eventColor, task }) => {
                const colorTab = EVENT_COLORS.find(c => c.id === eventColor)?.tab || 'bg-gray-400';
                const member = MEMBER_COLORS[task.assignee] || MEMBER_COLORS['Doni'];
                return (
                  <div key={task.id} className="bg-white p-2.5 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-2 group relative overflow-hidden transition-all hover:shadow-md hover:border-emerald-200">
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${colorTab}`}></div>
                    
                    <div className="flex justify-between items-start pl-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate pr-6" title={eventTitle}>
                        {eventTitle || 'Tanpa Judul'}
                      </span>
                      <button
                        onClick={() => handleToggleTaskCompletion(eventId, task.id)}
                        className="text-slate-300 hover:text-amber-600 bg-slate-50 hover:bg-amber-50 border border-transparent hover:border-amber-200 rounded p-1 opacity-0 group-hover:opacity-100 transition-all absolute right-2 top-2 shadow-sm"
                        title="Batal Selesai (Kembalikan)"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path></svg>
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-2 pl-2">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${member.bg} ${member.text} border ${member.border}`}>
                        {task.assignee}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 line-through decoration-slate-300 truncate">
                        {task.type || 'Tugas kustom'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      <button
        onClick={() => setIsChatOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all flex items-center justify-center z-40 group ${isChatOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
        title="Buka Asisten AI"
      >
        <svg className="w-7 h-7 text-white drop-shadow-md group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v.01M12 21v.01M3 12h.01M21 12h.01"></path>
        </svg>
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-cyan-500 border-2 border-white"></span>
        </span>
      </button>

      <div className={`fixed bottom-6 right-6 w-80 sm:w-96 bg-white/90 backdrop-blur-xl border border-blue-100 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right ${isChatOpen ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-0 opacity-0 pointer-events-none'}`} style={{ height: '500px', maxHeight: '80vh' }}>
        
        <div className="px-4 py-3 bg-gradient-to-r from-blue-700 to-cyan-500 flex justify-between items-center shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center p-1.5 backdrop-blur-sm border border-white/30">
               <svg className="w-full h-full text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
            <div>
              <h3 className="font-extrabold text-white text-sm">WIIBS AI Assistant</h3>
              <p className="text-[10px] text-blue-100 font-medium">Asisten Cerdas MMedia</p>
            </div>
          </div>
          <button onClick={() => setIsChatOpen(false)} className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="flex-1 p-4 overflow-y-auto bg-slate-50/50 flex flex-col gap-3 custom-scrollbar">
          {chatMessages.map((msg, idx) => (
            <div key={idx} className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'self-end items-end' : 'self-start items-start'}`}>
              <span className="text-[10px] font-bold text-gray-400 mb-1 px-1">{msg.role === 'user' ? 'Anda' : 'WIIBS AI'}</span>
              <div className={`px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white border border-gray-200 text-gray-700 rounded-tl-sm'}`}>
                {msg.parts[0].text}
              </div>
            </div>
          ))}
          {isChatLoading && (
            <div className="self-start items-start max-w-[85%] flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 mb-1 px-1">WIIBS AI</span>
              <div className="px-4 py-3 bg-white border border-gray-200 rounded-2xl rounded-tl-sm shadow-sm flex gap-1.5 items-center h-10">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="p-3 bg-white border-t border-gray-100">
          <div className="relative flex items-center">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
              placeholder="Tanya WIIBS AI..."
              className="w-full pl-4 pr-12 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all shadow-inner"
            />
            <button
              onClick={handleSendChatMessage}
              disabled={!chatInput.trim() || isChatLoading}
              className={`absolute right-1.5 p-1.5 rounded-lg flex items-center justify-center transition-all ${chatInput.trim() && !isChatLoading ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700 hover:scale-105' : 'bg-gray-200 text-gray-400'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
            </button>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background-color: #94a3b8; }
      `}} />
    </div>
  );
}
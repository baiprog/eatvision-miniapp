import { useEffect, useState, useRef } from "react";
import { db } from "./firebase";
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from "firebase/firestore";
import { Menu, Plus } from "lucide-react";

export default function AiAssistant({ user }) {
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();
  const messagesRef = useRef();

  // Чаты пользователя
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, "users", user.uid, "chats"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setChats(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [user]);

  // Сообщения текущего чата
  useEffect(() => {
    if (!user?.uid || !currentChatId) return setMessages([]);
    const q = query(collection(db, "users", user.uid, "chats", currentChatId, "messages"), orderBy("createdAt"));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(doc => doc.data()));
    });
    return () => unsub();
  }, [user, currentChatId]);

  // Скролл вниз при новых сообщениях
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, currentChatId]);

  // Новый чат
  const createNewChat = async () => {
    if (!user?.uid) return;
    const docRef = await addDoc(collection(db, "users", user.uid, "chats"), {
      title: "Новый чат",
      createdAt: serverTimestamp(),
    });
    setCurrentChatId(docRef.id);
    setShowSidebar(false);
  };

  // Отправка сообщения (через proxy backend!)
  const sendMessage = async () => {
    if (!input.trim() || !user?.uid || !currentChatId) return;
    setLoading(true);

    await addDoc(collection(db, "users", user.uid, "chats", currentChatId, "messages"), {
      role: "user",
      content: input,
      createdAt: serverTimestamp(),
    });

    setInput("");

    try {
      // Контекст: последние 6 сообщений
      const prevMessages = messages.slice(-6).map(m => ({ role: m.role, content: m.content }));

      // === ЗАПРОС К ПРОКСИ ===
      const response = await fetch("https://gpt4-vision-proxy.onrender.com/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...prevMessages,
            { role: "user", content: input }
          ]
        })
      });
      const data = await response.json();
      const aiText = data.choices?.[0]?.message?.content || "Нет ответа";
      await addDoc(collection(db, "users", user.uid, "chats", currentChatId, "messages"), {
        role: "assistant",
        content: aiText,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      await addDoc(collection(db, "users", user.uid, "chats", currentChatId, "messages"), {
        role: "assistant",
        content: "❌ Ошибка при обращении к ИИ",
        createdAt: serverTimestamp(),
      });
    }
    setLoading(false);
  };

  // Сделать первый чат активным, если текущий не выбран
  useEffect(() => {
    if (!currentChatId && chats.length > 0) setCurrentChatId(chats[0].id);
  }, [chats, currentChatId]);

  return (
    <div className="flex h-full">
      {/* Сайдбар чатов */}
      <div className={`fixed left-0 top-0 bottom-0 z-50 bg-white border-r transition-all duration-200 ${showSidebar ? 'w-72' : 'w-0'} overflow-x-hidden`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center px-4 py-2 border-b">
            <span className="font-bold text-lg flex-1">Чаты</span>
            <button onClick={() => setShowSidebar(false)} className="text-lg">✕</button>
          </div>
          <div className="overflow-y-auto flex-1">
            <button
              className="flex items-center px-4 py-2 hover:bg-gray-100 w-full"
              onClick={createNewChat}
            >
              <Plus className="mr-2" /> Новый чат
            </button>
            {chats.map(chat => (
              <div
                key={chat.id}
                className={`px-4 py-3 border-b cursor-pointer hover:bg-gray-100 ${currentChatId === chat.id ? "bg-gray-50 font-bold" : ""}`}
                onClick={() => { setCurrentChatId(chat.id); setShowSidebar(false); }}
              >
                {chat.title || "Без названия"}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Контент чата */}
      <div className="flex-1 flex flex-col h-full relative bg-white">
        {/* sticky header */}
        <div className="flex items-center px-4 py-2 border-b shadow-sm sticky top-0 bg-white z-10">
          <button onClick={() => setShowSidebar(true)} className="mr-2">
            <Menu size={28} />
          </button>
          <span className="text-lg font-semibold flex-1">EatVision Ai</span>
        </div>

        {/* scrollable messages */}
        <div
          className="flex-1 overflow-y-auto p-4"
          ref={messagesRef}
          style={{ minHeight: 0, maxHeight: "calc(100vh - 120px)" }}
        >
          {messages.length === 0 && (
            <div className="text-gray-400 text-center mt-24">
              <div>Задайте вопрос ИИ или выберите чат</div>
            </div>
          )}
          {messages.map((m, idx) => (
            <div key={idx} className={`my-2 flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${m.role === "user" ? "bg-black text-white" : "bg-gray-100 text-gray-800"} shadow-sm`}>
                {m.content}
              </div>
            </div>
          ))}
        </div>

        {/* форма ввода */}
        <form
          className="bg-white border-t flex items-center p-2"
          style={{ boxShadow: "0 -2px 8px #eee" }}
          onSubmit={e => { e.preventDefault(); sendMessage(); }}
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Спросите что-нибудь"
            className="flex-1 border-none bg-gray-50 rounded-full px-4 py-2 text-base focus:outline-none"
            disabled={loading}
          />
          <button
            type="submit"
            className="ml-2 bg-black text-white rounded-full w-10 h-10 flex items-center justify-center text-lg"
            disabled={loading || !input.trim()}
          >
            ➤
          </button>
        </form>
      </div>
    </div>
  );
}
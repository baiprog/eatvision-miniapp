import { useState, useRef, useEffect } from 'react';
import ProfileView from './ProfileView';
import LoginRegister from './LoginRegister';
import { Home, Plus, User, Flame, Drumstick, Wheat, Droplets, Bot, BarChart2, Heart } from "lucide-react";
import { db } from './firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, doc, getDoc, onSnapshot } from "firebase/firestore";
import AiAssistant from './AiAssistant';

// --- Базовые списки для определения названия блюда ---
const banWords = [ /* ... твой массив ... */ ];
const foodList = [ /* ... твой массив ... */ ];
function capitalizeFirst(str) { if (!str) return ''; return str.charAt(0).toUpperCase() + str.slice(1); }
function findFoodWord(text) { /* ... */ }
function extractDishTitle(gptText) { /* ... */ }
function parseMacrosFromText(text) { /* ... */ }

// --- Круглый прогрессбар ---
function MacroCircle({ value, total, label, color }) { /* ... */ }

// --- Модальное превью блюда ---
function FoodPreview({ item, onClose }) { /* ... */ }

// --- Карточка Истории блюд ---
function HistoryList({ user, onPreview }) { /* ... */ }

const Button = ({ children, ...props }) => (
  <button className="px-4 py-2 bg-black text-white rounded-xl" {...props}>{children}</button>
);
const Card = ({ children }) => (
  <div className="border border-gray-200 rounded-xl bg-gray-50 p-4 my-2">{children}</div>
);
const CardContent = ({ children }) => <div>{children}</div>;

export default function MiniApp() {
  const [tab, setTab] = useState("home");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [splash, setSplash] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [generations, setGenerations] = useState([]);
  const [previewItem, setPreviewItem] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user?.uid) {
      getDoc(doc(db, "users", user.uid)).then(docSnap => {
        if (docSnap.exists()) setProfile(docSnap.data());
      });
    }
  }, [user]);

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, "users", user.uid, "generations"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setGenerations(snapshot.docs.map(doc => doc.data()));
    });
    return () => unsubscribe();
  }, [user]);

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const todayGenerations = generations.filter(g => {
    const d = g.createdAt?.toDate?.();
    if (!d) return false;
    return d.toISOString().slice(0, 10) === todayStr;
  });
  let sumCalories = 0, sumProtein = 0, sumFats = 0, sumCarbs = 0;
  todayGenerations.forEach(gen => {
    const parsed = parseMacrosFromText(gen.resultText || "");
    sumCalories += parsed.calories;
    sumProtein  += parsed.protein;
    sumFats     += parsed.fats;
    sumCarbs    += parsed.carbs;
  });
  const caloriesTotal = profile?.calories || 2000;
  const proteinTotal = profile?.macros?.protein || 150;
  const fatsTotal = profile?.macros?.fats || 70;
  const carbsTotal = profile?.macros?.carbs || 220;
  const caloriesLeft = Math.max(0, caloriesTotal - sumCalories);

  useEffect(() => {
    const timer = setTimeout(() => setSplash(false), 1800);
    return () => clearTimeout(timer);
  }, []);
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setResult("");
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result.split(",")[1];
      try {
        const PROMPT = `
Всегда начинай ответ с названия блюда на одной строке строго в формате:
Блюдо: [название блюда]
Затем дай описание блюда, состав, калории, белки, жиры и углеводы.
        `;
        const response = await fetch("https://gpt4-vision-proxy.onrender.com/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: `data:image/jpeg;base64,${base64}`, prompt: PROMPT })
        });
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || "GPT не дал ответ 🙁";
        setResult(text);
        if (user) {
          await addDoc(collection(db, "users", user.uid, "generations"), {
            resultText: text,
            createdAt: serverTimestamp(),
            image: `data:image/jpeg;base64,${base64}`,
          });
        }
      } catch (err) {
        console.error("GPT ошибка:", err);
        setResult(`❌ Ошибка при анализе изображения:\n${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };
  const openFilePicker = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  if (!user) return <LoginRegister onLogin={(u) => setUser(u)} />;
  if (splash) {
    return (
      <div className="flex items-center justify-center h-screen bg-white flex-col">
        <img src="/img/logo.svg" alt="logo" className="h-16 w-16 mb-2 animate-pulse" />
        <p className="text-sm text-gray-500">from EatVision</p>
      </div>
    );
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <div className="h-screen overflow-hidden flex flex-col justify-between bg-white">
        <div className="flex-1 overflow-y-auto p-2 pb-20">
          {tab === "home" && (
            <div>
              <div className="flex justify-between items-center px-2 pt-2">
                <div className="text-xl font-bold flex items-center gap-2">
                  <span role="img" aria-label="apple">🍏</span> EatVision
                </div>
                <div className="flex items-center gap-3">
                  <button className="text-sm text-gray-700 font-semibold border-b-2 border-black">Сегодня</button>
                  <button className="text-sm text-gray-400">Вчера</button>
                  <div className="ml-2">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14V11a6 6 0 10-12 0v3c0 .386-.149.735-.405 1.005L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                    </svg>
                  </div>
                </div>
              </div>
              {/* Ккал, белки, углеводы, жиры — КРУГИ */}
              <div className="flex justify-center my-4">
                <div className="bg-white rounded-2xl shadow-md p-4 flex items-center gap-6 w-11/12 max-w-md">
                  <MacroCircle value={sumCalories} total={caloriesTotal} label="Ккал" color="#fdba74" />
                  <div>
                    <div className="text-3xl font-bold">{caloriesLeft}</div>
                    <div className="text-gray-500 text-md">Ккал осталось</div>
                  </div>
                </div>
              </div>
              <div className="flex justify-around my-2 max-w-md mx-auto">
                <MacroCircle value={sumProtein} total={proteinTotal} label="Белки" color="#e57373" />
                <MacroCircle value={sumCarbs} total={carbsTotal} label="Углеводы" color="#fbc02d" />
                <MacroCircle value={sumFats} total={fatsTotal} label="Жиры" color="#64b5f6" />
              </div>
              {/* История */}
              <div className="px-2 mt-4">
                <h2 className="font-bold text-lg mb-2">Последние блюда</h2>
                <HistoryList user={user} onPreview={setPreviewItem} />
              </div>
            </div>
          )}
          {tab === "upload" && (
            <div className="flex flex-col items-center gap-4">
              <h1 className="text-2xl font-bold">🥗 Анализ еды</h1>
              <div className="w-full max-w-md">
                <img src="/img/checkmain.png" alt="Еда" className="rounded-xl w-full object-cover mb-2" />
                <p className="text-center text-sm text-gray-600 font-medium">🍽 Посчитай калории</p>
              </div>
              <Button onClick={openFilePicker}>📷 Выбрать фото</Button>
              {loading && <p className="text-sm text-gray-500 animate-pulse">⏳ Анализируем изображение...</p>}
              {result && (
                <Card className="w-full max-w-md border border-green-200 shadow-md bg-green-50">
                  <CardContent className="p-4 whitespace-pre-wrap text-sm text-gray-700">
                    {result}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
          {tab === "analytics" && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <BarChart2 size={64} className="mb-4" />
              <div className="text-xl font-semibold">Раздел "Аналитика" в разработке</div>
            </div>
          )}
          {tab === "assistant" && (
            <AiAssistant user={user} />
          )}
          {tab === "profile" && <ProfileView user={user} />}
        </div>
        {/* Нижнее меню с центральным + */}
        <div className="fixed left-0 right-0 bottom-0 border-t flex justify-between items-end bg-white shadow-xl z-10 rounded-t-2xl px-2 h-[72px]">
          {/* Домой */}
          <button onClick={() => setTab("home")} className={`flex flex-col items-center text-gray-700 w-1/5 ${tab === "home" ? "text-black" : ""}`}>
            <Home size={24} />
            <span className="text-xs mt-1">Домой</span>
          </button>
          {/* Аналитика */}
          <button onClick={() => setTab("analytics")} className={`flex flex-col items-center text-gray-700 w-1/5 ${tab === "analytics" ? "text-black" : ""}`}>
            <BarChart2 size={24} />
            <span className="text-xs mt-1">Аналитика</span>
          </button>
          {/* Spacer для центральной кнопки */}
          <div className="w-16"></div>
          {/* ИИ-ассистент */}
          <button onClick={() => setTab("assistant")} className={`flex flex-col items-center text-gray-700 w-1/5 ${tab === "assistant" ? "text-black" : ""}`}>
            <Bot size={24} />
            <span className="text-xs mt-1">ИИ-ассистент</span>
          </button>
          {/* Профиль */}
          <button onClick={() => setTab("profile")} className={`flex flex-col items-center text-gray-700 w-1/5 ${tab === "profile" ? "text-black" : ""}`}>
            <User size={24} />
            <span className="text-xs mt-1">Профиль</span>
          </button>
          {/* Floating Action "+" */}
          <button
            onClick={() => {
              setTab("upload");
              setTimeout(() => openFilePicker(), 100);
            }}
            className="absolute left-1/2 -translate-x-1/2 -top-8 z-20 w-16 h-16 rounded-full bg-black border-4 border-white flex items-center justify-center shadow-xl"
            style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}
          >
            <Plus size={36} className="text-white" />
          </button>
        </div>
        {previewItem && <FoodPreview item={previewItem} onClose={() => setPreviewItem(null)} />}
      </div>
    </>
  );
}
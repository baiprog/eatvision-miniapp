import { useState, useRef, useEffect } from 'react';
import ProfileView from './ProfileView';
import LoginRegister from './LoginRegister';
import WeightControl from './WeightControl';
import { Home, Plus, User } from "lucide-react";
import { db } from './firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, doc, getDoc, onSnapshot } from "firebase/firestore";

// ===== Парсер макросов из текста ответа GPT (можно улучшить под твой реальный формат) =====
function parseMacrosFromText(text) {
  // Находит "Калории: 500 ккал", "Белки: 20 г", "Жиры: 10 г", "Углеводы: 40 г"
  const cals = Number((text.match(/Кал[оа]р[ии][иы]?:?\s*(\d+)/i) || [])[1]) || 0;
  const prot = Number((text.match(/Белк[иов]:?\s*(\d+)/i) || [])[1]) || 0;
  const fats = Number((text.match(/Жир[ыа]:?\s*(\d+)/i) || [])[1]) || 0;
  const carb = Number((text.match(/Углевод[ыа]:?\s*(\d+)/i) || [])[1]) || 0;
  return { calories: cals, protein: prot, fats: fats, carbs: carb };
}

// Индикатор для макроэлементов
function MacroBox({ name, value, total }) {
  const isOver = value < 0;
  const percent = Math.max(0, Math.min(1, (total - value) / total));
  const color =
    name === "Protein" ? (isOver ? "text-red-500" : "text-red-700")
    : name === "Carbs" ? (isOver ? "text-yellow-600" : "text-yellow-700")
    : (isOver ? "text-blue-600" : "text-blue-700");
  return (
    <div className="flex flex-col items-center bg-white rounded-xl p-2 min-w-[80px] relative">
      <span className="text-xs text-gray-400">{name}</span>
      <span className={`text-lg font-semibold ${color}`}>
        {Math.abs(value)}g {isOver ? "over" : "left"}
      </span>
      {/* Прогресс-полоска снизу */}
      <div className="absolute bottom-1 left-2 right-2 h-1 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${name === "Protein" ? "bg-red-300" : name === "Carbs" ? "bg-yellow-200" : "bg-blue-200"}`}
          style={{ width: `${Math.min(100, percent * 100)}%` }}
        ></div>
      </div>
    </div>
  );
}

// Кольцевой прогрессбар калорий
function CalorieProgressBar({ caloriesLeft, caloriesTotal }) {
  const used = caloriesTotal - caloriesLeft;
  const percent = Math.max(0, Math.min(1, used / caloriesTotal));
  const radius = 36, stroke = 6, circ = 2 * Math.PI * radius;
  return (
    <svg width="80" height="80" className="mr-2">
      <circle cx="40" cy="40" r={radius} stroke="#eee" strokeWidth={stroke} fill="none"/>
      <circle
        cx="40"
        cy="40"
        r={radius}
        stroke="#fdba74"
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - percent)}
        strokeLinecap="round"
      />
      <text x="50%" y="55%" textAnchor="middle" fontSize="1.3em" fontWeight="bold" fill="#fdba74">{caloriesLeft}</text>
    </svg>
  );
}

// Функция для извлечения чистого названия блюда из ответа GPT
function extractDishTitle(gptText) {
  if (!gptText) return '';
  const match = gptText.match(/(?:На фотографии (?:изображен[ао]?|показано):?\s*|Изображено:?\s*)(.*?)(\.|$)/i);
  if (match && match[1]) return match[1].trim();
  const match2 = gptText.match(/Блюдо:?\s*(.*)/i);
  if (match2 && match2[1]) return match2[1].split('.')[0].trim();
  return gptText.replace(/^На фотографии.*?:?\s*/i, '').split('\n')[0].split('.')[0].trim();
}

// История загрузок еды (только названия блюд)
function HistoryList({ user }) {
  const [docs, setDocs] = useState([]);
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, "users", user.uid, "generations"),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDocs(snapshot.docs);
    });
    return () => unsubscribe();
  }, [user]);
  if (!docs?.length) return <div className="text-gray-400 text-center">Пока нет загрузок</div>;
  return (
    <div className="space-y-3">
      {docs.map((doc) => {
        const item = doc.data();
        return (
          <div key={doc.id} className="flex items-center bg-white rounded-xl shadow-sm p-3">
            <img src={item.image} alt="Food" className="w-14 h-14 rounded-lg object-cover mr-3"/>
            <div className="flex-1">
              <div className="font-semibold truncate">
                {extractDishTitle(item.resultText) || "Еда"}
              </div>
              <div className="text-xs text-gray-400">
                {item.createdAt?.toDate?.().toLocaleTimeString?.() || ""}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

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
  const fileInputRef = useRef(null);

  // Загрузка профиля пользователя
  useEffect(() => {
    if (user?.uid) {
      getDoc(doc(db, "users", user.uid)).then(docSnap => {
        if (docSnap.exists()) setProfile(docSnap.data());
      });
    }
  }, [user]);

  // Загрузка генераций
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, "users", user.uid, "generations"),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setGenerations(snapshot.docs.map(doc => doc.data()));
    });
    return () => unsubscribe();
  }, [user]);

  // Считаем сегодняшние показатели
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

  // Нормы из профиля (по расчету в профиле!)
  const caloriesTotal = profile?.calories || 2000;
  const proteinTotal = profile?.macros?.protein || 150;
  const fatsTotal = profile?.macros?.fats || 70;
  const carbsTotal = profile?.macros?.carbs || 220;

  // Остатки
  const caloriesLeft = Math.max(0, caloriesTotal - sumCalories);
  const proteinLeft = Math.max(0, proteinTotal - sumProtein);
  const fatsLeft = Math.max(0, fatsTotal - sumFats);
  const carbsLeft = Math.max(0, carbsTotal - sumCarbs);

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
        const response = await fetch("https://gpt4-vision-proxy.onrender.com/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: `data:image/jpeg;base64,${base64}` })
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
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  if (!user) {
    return <LoginRegister onLogin={(u) => setUser(u)} />;
  }

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
          {/* Главный новый экран */}
          {tab === "home" && (
            <div>
              {/* Header */}
              <div className="flex justify-between items-center px-2 pt-2">
                <div className="text-xl font-bold flex items-center gap-2">
                  <span role="img" aria-label="apple">🍏</span> Cal AI
                </div>
                <div className="flex items-center gap-3">
                  <button className="text-sm text-gray-700 font-semibold border-b-2 border-black">Today</button>
                  <button className="text-sm text-gray-400">Yesterday</button>
                  <div className="ml-2">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14V11a6 6 0 10-12 0v3c0 .386-.149.735-.405 1.005L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                    </svg>
                  </div>
                </div>
              </div>
              {/* Calories left + прогрессбар */}
              <div className="flex justify-center my-4">
                <div className="bg-white rounded-2xl shadow-md p-4 flex items-center gap-4 w-11/12 max-w-md">
                  <CalorieProgressBar caloriesLeft={caloriesLeft} caloriesTotal={caloriesTotal} />
                  <div>
                    <div className="text-4xl font-bold">{caloriesLeft}</div>
                    <div className="text-gray-500 text-lg">Calories left</div>
                  </div>
                </div>
              </div>
              {/* Макросы */}
              <div className="flex justify-around my-2 max-w-md mx-auto">
                <MacroBox name="Protein" value={proteinLeft} total={proteinTotal} />
                <MacroBox name="Carbs" value={carbsLeft} total={carbsTotal} />
                <MacroBox name="Fats" value={fatsLeft} total={fatsTotal} />
              </div>
              {/* История */}
              <div className="px-2 mt-4">
                <h2 className="font-bold text-lg mb-2">Recently uploaded</h2>
                <HistoryList user={user} />
              </div>
            </div>
          )}

          {/* Анализ еды (фото) */}
          {tab === "upload" && (
            <div className="flex flex-col items-center gap-4">
              <h1 className="text-2xl font-bold">🥗 Анализ еды</h1>
              <div className="w-full max-w-md">
                <img
                  src="/img/checkmain.png"
                  alt="Еда"
                  className="rounded-xl w-full object-cover mb-2"
                />
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

          {/* Профиль */}
          {tab === "profile" && <ProfileView user={user} />}
        </div>

        {/* Нижняя навигация */}
        <div className="fixed left-0 right-0 bottom-0 border-t p-2 flex justify-around bg-white shadow-xl z-10 rounded-t-2xl">
          <button onClick={() => setTab("home")} className={`flex flex-col items-center text-gray-700 ${tab === "home" ? "text-black" : ""}`}>
            <Home size={24} />
            <span className="text-xs">Домой</span>
          </button>
          <button
            onClick={() => {
              setTab("upload");
              setTimeout(() => openFilePicker(), 100);
            }}
            className={`flex flex-col items-center text-gray-700 ${tab === "upload" ? "text-black" : ""}`}
          >
            <Plus size={24} />
            <span className="text-xs">Загрузить Фото</span>
          </button>
          <button onClick={() => setTab("profile")} className={`flex flex-col items-center text-gray-700 ${tab === "profile" ? "text-black" : ""}`}>
            <User size={24} />
            <span className="text-xs">Профиль</span>
          </button>
        </div>
      </div>
    </>
  );
}
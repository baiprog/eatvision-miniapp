import { useState, useRef, useEffect } from 'react';
const Button = ({ children, ...props }) => (
  <button className="px-4 py-2 bg-black text-white rounded-xl" {...props}>{children}</button>
);
const Card = ({ children }) => (
  <div className="border border-gray-200 rounded-xl bg-gray-50 p-4 my-2">{children}</div>
);
const CardContent = ({ children }) => <div>{children}</div>;
import { Home, Plus, User } from "lucide-react";

export default function MiniApp() {
  const [tab, setTab] = useState("upload");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [splash, setSplash] = useState(true);
  const fileInputRef = useRef(null);

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
        const text = data.choices?.[0]?.message?.content;
        setResult(text || "GPT не дал ответ 🙁");
} catch (err) { console.error("GPT ошибка:", err); setResult(❌ Ошибка при анализе изображения:\n${err.message}); }
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

  if (splash) {
    return (
      <div className="flex items-center justify-center h-screen bg-white flex-col">
        <img src="/logo.svg" alt="logo" className="h-16 w-16 mb-2 animate-pulse" />
        <p className="text-sm text-gray-500">from EatVision</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-white">
      <div className="flex-1 p-4">
        {tab === "home" && (
          <div className="text-center text-gray-500">Лента будет позже</div>
        )}

        {tab === "upload" && (
          <div className="flex flex-col items-center gap-4">
            <h1 className="text-2xl font-bold">🥗 Анализ еды</h1>

            <div className="w-full max-w-md">
              <img
                src="https://images.unsplash.com/photo-1606788075761-964cc2fe67d5?w=800"
                alt="Еда"
                className="rounded-xl w-full object-cover mb-2"
              />
              <p className="text-center text-sm text-gray-600 font-medium">🍽 Посчитай калории</p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
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

        {tab === "profile" && (
          <div className="text-center text-gray-500">История генераций будет здесь</div>
        )}
      </div>

      <div className="border-t p-2 flex justify-around bg-white shadow-xl">
        <button onClick={() => setTab("home")} className={`flex flex-col items-center text-gray-700 ${tab === "home" ? "text-black" : ""}`}>
          <Home size={24} />
          <span className="text-xs">Домой</span>
        </button>
        <button onClick={() => setTab("upload")} className={`flex flex-col items-center text-gray-700 ${tab === "upload" ? "text-black" : ""}`}>
          <Plus size={24} />
          <span className="text-xs">+</span>
        </button>
        <button onClick={() => setTab("profile")} className={`flex flex-col items-center text-gray-700 ${tab === "profile" ? "text-black" : ""}`}>
          <User size={24} />
          <span className="text-xs">Профиль</span>
        </button>
      </div>
    </div>
  );
}
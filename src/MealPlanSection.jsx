import { useState, useEffect } from "react";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import Modal from "./Modal";

// Функция генерации картинки через бэкенд
async function getFoodPhoto(dishName) {
  try {
    const response = await fetch('https://ТВОЙ-БЭКЕНД/generate-food-photo', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dishName }),
    });
    const data = await response.json();
    return data.imageUrl;
  } catch (error) {
    console.error("Ошибка генерации фото блюда:", error);
    return null;
  }
}

const Card = ({ children }) => (
  <div className="bg-white rounded-2xl shadow p-4 mb-4">{children}</div>
);

const MealCard = ({ image, title, kcal, onClick }) => (
  <div className="flex items-center gap-3 border rounded-xl p-2">
    <img
      src={image}
      alt={title}
      className="w-12 h-12 rounded-lg object-cover"
    />
    <div className="flex-1">
      <div className="font-semibold text-sm">{title}</div>
      <div className="text-xs text-gray-500">
        {kcal ? `${kcal} ккал` : "— ккал"}
      </div>
    </div>
    <button className="text-xs text-blue-500 font-medium" onClick={onClick}>
      Подробнее
    </button>
  </div>
);

export default function MealPlanSection({ user }) {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null);

  const fetchPlan = async (regenerate = false) => {
    if (!user?.uid) return;

    const ref = doc(db, "users", user.uid, "mealPlan", "today");
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    const userInfo = userSnap.data();

    if (!regenerate) {
      const saved = await getDoc(ref);
      if (saved.exists()) {
        const savedData = saved.data().plan;
        if (Array.isArray(savedData)) {
          setMeals(savedData);
          return;
        }
      }
    }

    const prompt = `Составь план питания на день для человека с параметрами: вес ${userInfo.weight} кг, рост ${userInfo.height} см, возраст ${userInfo.age}, активность: ${userInfo.activity}, цель: ${userInfo.goal}. Верни в формате JSON массив с блюдами, каждое содержит: title, kcal.`;

    try {
      setLoading(true);
      const res = await fetch("https://gpt4-vision-proxy.onrender.com/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || "";
      const match = content.match(/```json\s*([\s\S]*?)```/i);
      const jsonText = match ? match[1] : content;
      const parsed = JSON.parse(jsonText);

      if (!Array.isArray(parsed)) {
        throw new Error("Результат GPT не является массивом");
      }

      // Теперь для каждого блюда получаем изображение
      const mealsWithImages = await Promise.all(parsed.map(async (meal, index) => {
        const photo = await getFoodPhoto(meal.title);
        return {
          ...meal,
          image: photo || `https://source.unsplash.com/100x100/?food,${encodeURIComponent(meal.title)}&sig=${index}`
        };
      }));

      setMeals(mealsWithImages);

      await setDoc(ref, {
        plan: mealsWithImages,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("❌ Ошибка обработки JSON:", err);
      setMeals([]);
      alert("⚠️ Не удалось сгенерировать план питания. Попробуй позже.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan();
  }, [user]);

  return (
    <>
      <Card>
        <div className="flex justify-between items-center mb-2">
          <div className="font-bold text-lg">🍽 План питания</div>
          <button
            className="text-sm text-blue-500"
            onClick={() => fetchPlan(true)}
          >
            🔄 Обновить
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">⏳ Генерируем план питания...</p>
        ) : Array.isArray(meals) && meals.length > 0 ? (
          meals.map((meal, i) => (
            <MealCard
              key={i}
              title={meal.title}
              kcal={meal.kcal}
              image={meal.image}
              onClick={() => setSelectedMeal(meal)}
            />
          ))
        ) : (
          <p className="text-sm text-gray-400">План питания не найден</p>
        )}
      </Card>

      <Modal isOpen={!!selectedMeal} onClose={() => setSelectedMeal(null)}>
        {selectedMeal && (
          <div className="space-y-2">
            <h2 className="text-lg font-bold">{selectedMeal.title}</h2>
            <p className="text-sm text-gray-600">{selectedMeal.kcal} ккал</p>
            <p className="text-sm text-gray-500">
              Здесь можно добавить описание, ссылку на продукт и сравнение по цене.
            </p>
          </div>
        )}
      </Modal>
    </>
  );
}
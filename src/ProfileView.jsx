import { useState } from "react";
import { Pencil } from "lucide-react";

const Card = ({ children }) => (
  <div className="bg-white rounded-2xl shadow p-4 mb-4">{children}</div>
);

const MealCard = ({ image, title, kcal }) => (
  <div className="flex items-center gap-3 border rounded-xl p-2">
    <img src={image} alt={title} className="w-12 h-12 rounded-lg object-cover" />
    <div className="flex-1">
      <div className="font-semibold text-sm">{title}</div>
      <div className="text-xs text-gray-500">{kcal} ккал</div>
    </div>
    <button className="text-xs text-blue-500 font-medium">Подробнее</button>
  </div>
);

export default function ProfileView() {
  const [user] = useState({
    weight: 76,
    height: 173,
    age: 24,
    activity: "Умеренная активность",
    goal: "Похудеть"
  });

  return (
    <div className="max-w-md mx-auto">
      {/* Параметры */}
      <Card>
        <div className="flex justify-between items-center mb-2">
          <div className="font-bold text-lg">🎯 Цель и параметры</div>
          <button className="text-gray-400 hover:text-black">
            <Pencil size={18} />
          </button>
        </div>
        <div className="text-sm text-gray-700 leading-relaxed">
          Вес: <b>{user.weight} кг</b><br />
          Рост: <b>{user.height} см</b><br />
          Возраст: <b>{user.age}</b><br />
          Активность: <b>{user.activity}</b><br />
          Цель: <b>{user.goal}</b>
        </div>
      </Card>

      {/* План питания */}
      <Card>
        <div className="font-bold text-lg mb-2">🍽 План питания</div>
        <MealCard
          image="https://source.unsplash.com/100x100/?salad"
          title="Овощной салат с курицей"
          kcal={320}
        />
        <MealCard
          image="https://source.unsplash.com/100x100/?oatmeal"
          title="Овсянка с фруктами"
          kcal={280}
        />
        <MealCard
          image="https://source.unsplash.com/100x100/?steak"
          title="Говядина с рисом"
          kcal={450}
        />
      </Card>

      {/* История генераций */}
      <Card>
        <div className="flex justify-between items-center mb-2">
          <div className="font-bold text-lg">🕓 История</div>
          <button className="text-blue-500 text-sm font-medium">Все</button>
        </div>
        <div className="flex gap-2 overflow-x-auto">
          <img src="/img/sample1.jpg" className="w-20 h-20 rounded-xl object-cover" alt="sample" />
          <img src="/img/sample2.jpg" className="w-20 h-20 rounded-xl object-cover" alt="sample" />
        </div>
      </Card>
    </div>
  );
}

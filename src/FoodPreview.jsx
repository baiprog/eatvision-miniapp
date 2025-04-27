import { Flame, Drumstick, Wheat, Droplets, Heart } from "lucide-react";

export default function FoodPreview({ item, onClose }) {
  if (!item) return null;

  // --- Парсим макросы и название
  const parseMacrosFromText = (text) => {
    const cals = Number((text.match(/Кал[оа]р[ии][иы]?:?\s*(\d+)/i) || [])[1]) || 0;
    const prot = Number((text.match(/Белк[иов]:?\s*(\d+)/i) || [])[1]) || 0;
    const fats = Number((text.match(/Жир[ыа]:?\s*(\d+)/i) || [])[1]) || 0;
    const carb = Number((text.match(/Углевод[ыа]:?\s*(\d+)/i) || [])[1]) || 0;
    return { calories: cals, protein: prot, fats: fats, carbs: carb };
  };
  const macros = parseMacrosFromText(item.resultText || "");
  const name = (item.title || "Блюдо");

  // Состояние количества
  const [count, setCount] = React.useState(1);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-3xl shadow-xl p-5 max-w-sm w-full relative">
        <button className="absolute top-4 right-4 text-gray-400" onClick={onClose}>✕</button>
        <img src={item.image} alt={name} className="w-full h-52 rounded-xl object-cover mb-4" />
        <div className="text-xs mb-1">Приём пищи</div>
        <div className="font-bold text-xl mb-1">{name}</div>
        {/* Количество */}
        <div className="flex items-center gap-2 mb-3">
          <button className="w-8 h-8 bg-gray-100 rounded-full text-lg" onClick={() => setCount(Math.max(1, count - 1))}>-</button>
          <span className="text-lg font-semibold">{count}</span>
          <button className="w-8 h-8 bg-gray-100 rounded-full text-lg" onClick={() => setCount(count + 1)}>+</button>
        </div>
        {/* КБЖУ карточки */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div className="flex items-center bg-gray-50 rounded-xl p-3">
            <Flame className="mr-2 text-orange-500" size={22} />
            <div>
              <div className="text-xs text-gray-400">Calories</div>
              <div className="font-bold">{macros.calories * count}</div>
            </div>
          </div>
          <div className="flex items-center bg-gray-50 rounded-xl p-3">
            <Wheat className="mr-2 text-yellow-600" size={22} />
            <div>
              <div className="text-xs text-gray-400">Carbs</div>
              <div className="font-bold">{macros.carbs * count}g</div>
            </div>
          </div>
          <div className="flex items-center bg-gray-50 rounded-xl p-3">
            <Drumstick className="mr-2 text-red-500" size={22} />
            <div>
              <div className="text-xs text-gray-400">Protein</div>
              <div className="font-bold">{macros.protein * count}g</div>
            </div>
          </div>
          <div className="flex items-center bg-gray-50 rounded-xl p-3">
            <Droplets className="mr-2 text-blue-500" size={22} />
            <div>
              <div className="text-xs text-gray-400">Fats</div>
              <div className="font-bold">{macros.fats * count}g</div>
            </div>
          </div>
        </div>
        {/* Health Score */}
        <div className="flex items-center bg-gray-50 rounded-xl p-3 mb-3">
          <Heart className="mr-2 text-pink-500" size={22} />
          <div>
            <div className="text-xs text-gray-400">Health score</div>
            <div className="font-bold">7/10</div>
          </div>
          <div className="ml-3 w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-green-400 rounded-full" style={{ width: '70%' }}></div>
          </div>
        </div>
        {/* Кнопки */}
        <div className="flex gap-2 mt-4">
          <button className="flex-1 border border-gray-300 rounded-xl py-2 font-semibold">Fix Results</button>
          <button className="flex-1 bg-black text-white rounded-xl py-2 font-semibold" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
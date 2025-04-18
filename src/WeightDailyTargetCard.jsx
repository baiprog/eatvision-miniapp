import { useState } from "react";

export default function WeightDailyTargetCard({ data = [], currentWeight, startWeight, goalWeight }) {
  const [showAll, setShowAll] = useState(false);

  const getStatus = (expected, actual) => {
    if (!actual) return "neutral";
    const diff = actual - expected;
    if (Math.abs(diff) <= 0.2) return "good";        // в пределах нормы
    if (diff < -0.2) return "tooFast";               // худеет быстрее
    return "slow";                                   // отстаёт
  };

  const statusColor = {
    good: "bg-green-50 border-green-300",
    slow: "bg-yellow-50 border-yellow-300",
    tooFast: "bg-red-50 border-red-300",
    neutral: "bg-gray-50 border-gray-200",
  };

  const progress = Math.max(
    0,
    Math.min(100, (((startWeight - currentWeight) / (startWeight - goalWeight)) * 100).toFixed(1))
  );

  return (
    <div className="bg-white rounded-2xl shadow p-4 mb-4">
      <div className="flex justify-between items-center mb-2">
        <div className="font-bold text-lg">📊 Прогресс</div>
        <button
          onClick={() => setShowAll((p) => !p)}
          className="text-sm text-blue-500"
        >
          {showAll ? "Свернуть" : "Показать всё"}
        </button>
      </div>

      <div className="mb-4">
        <div className="text-sm mb-1">
          Сброшено: <b>{(startWeight - currentWeight).toFixed(1)} кг</b> из {startWeight - goalWeight} кг
        </div>
        <div className="w-full bg-gray-200 h-2 rounded-full">
          <div
            className="bg-green-500 h-2 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-xs text-right mt-1 text-gray-500">{progress}%</div>
      </div>

      {(showAll ? data : data.slice(0, 1)).map((entry, i) => {
        const status = getStatus(entry.expected, entry.actual);
        return (
          <div
            key={i}
            className={`p-3 rounded-xl border ${statusColor[status]} mb-2`}
          >
            <div className="text-sm font-semibold mb-1">🗓 {entry.date}</div>
            <div className="text-sm text-gray-700">
              🎯 План: <b>{entry.expected.toFixed(1)} кг</b>
              <br />
              ⚖️ Факт: <b>{entry.actual ? entry.actual.toFixed(1) + " кг" : "—"}</b>
              <br />
              💡 {status === "tooFast"
                ? "Слишком быстро, добавь перекус или снизь темп"
                : status === "slow"
                ? "Идёт отставание от цели, проверь активность"
                : status === "good"
                ? "Ты в графике! 👌"
                : "Ожидается взвешивание"}
            </div>
          </div>
        );
      })}
    </div>
  );
}
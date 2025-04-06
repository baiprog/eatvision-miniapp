import { useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { db } from "./firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

export default function EditProfileModal({ user, isOpen, onClose }) {
  const [form, setForm] = useState({
    weight: "",
    height: "",
    age: "",
    activity: "",
    goal: ""
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.uid) return;
      const docRef = doc(db, "users", user.uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setForm((prev) => ({ ...prev, ...snap.data() }));
      }
    };
    fetchData();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!user?.uid) return;
    await setDoc(doc(db, "users", user.uid), form, { merge: true });
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title className="text-lg font-bold text-gray-900 mb-4">
                  ✏️ Редактировать параметры
                </Dialog.Title>

                <div className="space-y-4">
                  <Input label="Вес (кг)" name="weight" value={form.weight} onChange={handleChange} />
                  <Input label="Рост (см)" name="height" value={form.height} onChange={handleChange} />
                  <Input label="Возраст" name="age" value={form.age} onChange={handleChange} />
                  <Select
                    label="Активность"
                    name="activity"
                    value={form.activity}
                    onChange={handleChange}
                    options={[
                      "Низкая активность",
                      "Умеренная активность",
                      "Высокая активность"
                    ]}
                  />
                  <Select
                    label="Цель"
                    name="goal"
                    value={form.goal}
                    onChange={handleChange}
                    options={["Похудеть", "Поддерживать вес", "Набрать массу"]}
                  />
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-100"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 rounded-xl bg-black text-white text-sm"
                  >
                    Сохранить
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Child>
  );
}

function Input({ label, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        {...props}
        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
      />
    </div>
  );
}

function Select({ label, options, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select
        {...props}
        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
      >
        <option value="">Выберите...</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}
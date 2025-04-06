import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState, useEffect } from "react";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

export default function EditProfileModal({ isOpen, onClose, user, onSaved }) {
  const [form, setForm] = useState({
    weight: "",
    height: "",
    age: "",
    activity: "Умеренная активность",
    goal: "Похудеть",
  });

  useEffect(() => {
    if (user?.uid) {
      const ref = doc(db, "users", user.uid);
      getDoc(ref).then((docSnap) => {
        if (docSnap.exists()) {
          setForm({ ...form, ...docSnap.data() });
        }
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!user?.uid) return;
    const ref = doc(db, "users", user.uid);
    await setDoc(ref, form);
    onSaved(form);
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title className="text-lg font-bold text-gray-900 mb-4">
                  ✏️ Редактировать параметры
                </Dialog.Title>

                <div className="space-y-3">
                  <input name="weight" placeholder="Вес (кг)" type="number" value={form.weight} onChange={handleChange} className="w-full p-2 border rounded-xl" />
                  <input name="height" placeholder="Рост (см)" type="number" value={form.height} onChange={handleChange} className="w-full p-2 border rounded-xl" />
                  <input name="age" placeholder="Возраст" type="number" value={form.age} onChange={handleChange} className="w-full p-2 border rounded-xl" />
                  
                  <select name="activity" value={form.activity} onChange={handleChange} className="w-full p-2 border rounded-xl">
                    <option>Малоподвижный образ жизни</option>
                    <option>Умеренная активность</option>
                    <option>Высокая активность</option>
                  </select>

                  <select name="goal" value={form.goal} onChange={handleChange} className="w-full p-2 border rounded-xl">
                    <option>Похудеть</option>
                    <option>Поддерживать вес</option>
                    <option>Набрать массу</option>
                  </select>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                  <button onClick={onClose} className="px-4 py-2 text-gray-600">Отмена</button>
                  <button onClick={handleSave} className="px-4 py-2 bg-black text-white rounded-xl">Сохранить</button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
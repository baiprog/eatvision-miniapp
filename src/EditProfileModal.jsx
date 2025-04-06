import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export default function EditProfileModal({ user, isOpen, onClose }) {
  const [formData, setFormData] = useState({
    weight: '',
    height: '',
    age: '',
    goal: '',
    activity: ''
  });

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const ref = doc(db, 'users', user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setFormData({ ...formData, ...snap.data() });
      }
    };
    fetchData();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    const ref = doc(db, 'users', user.uid);
    await setDoc(ref, formData, { merge: true });
    onClose();
  };

  return (
    <Transition show={isOpen} as={Fragment}>
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
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl">
              <Dialog.Title className="text-lg font-bold">Редактировать профиль</Dialog.Title>

              <div className="mt-4 flex flex-col gap-3">
                {['weight', 'height', 'age', 'goal', 'activity'].map((field) => (
                  <div key={field}>
                    <label className="block text-sm text-gray-600 capitalize">{field}</label>
                    <input
                      type="text"
                      name={field}
                      value={formData[field] || ''}
                      onChange={handleChange}
                      className="w-full rounded-xl border px-3 py-2 text-sm"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-gray-600 rounded-xl hover:text-black"
                >
                  Отмена
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 text-sm bg-black text-white rounded-xl"
                >
                  Сохранить
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
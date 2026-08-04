import type { ReactNode } from "react";

interface ModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}

export default function Modal({ open, title, children, onClose }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6">
        <div className="flex justify-between mb-4">
          <h2 className="text-xl font-bold">{title}</h2>

          <button onClick={onClose} className="text-gray-500">
            ✕
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

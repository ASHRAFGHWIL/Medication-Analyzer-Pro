import React, { useEffect, useState } from 'react';
import { AlertIcon } from './icons/AlertIcon';

interface DisclaimerModalProps {
  onClose: () => void;
  t: {
    disclaimerTitle: string;
    disclaimerP1: string;
    disclaimerP2: string;
    disclaimerP3: string;
    disclaimerButton: string;
  }
}

const DisclaimerModal: React.FC<DisclaimerModalProps> = ({ onClose, t }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Delay showing the modal slightly for a smoother transition
    const timer = setTimeout(() => setShow(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}>
      <div className={`bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full transform transition-all duration-300 ${show ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        <div className="p-8">
          <div className="flex flex-col items-center text-center">
            <AlertIcon className="h-16 w-16 text-accent-red mb-4" />
            <h2 className="text-2xl font-extrabold text-brand-dark dark:text-slate-100">{t.disclaimerTitle}</h2>
          </div>
          <div className="mt-6 text-slate-600 dark:text-slate-400 space-y-4 text-start">
            <p>
              {t.disclaimerP1}
            </p>
            <p className="font-bold text-brand-dark dark:text-slate-200">
              {t.disclaimerP2}
            </p>
            <p>
              {t.disclaimerP3}
            </p>
          </div>
          <div className="mt-8">
            <button
              onClick={onClose}
              className="w-full bg-brand-primary hover:bg-brand-dark dark:bg-brand-secondary dark:hover:bg-opacity-80 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200"
            >
              {t.disclaimerButton}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisclaimerModal;
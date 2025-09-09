import React from 'react';
import { HistoryItem } from '../types';
import { HistoryIcon } from './icons/HistoryIcon';

interface HistoryPanelProps {
    history: HistoryItem[];
    onLoadHistory: (item: HistoryItem) => void;
    onClearHistory: () => void;
    t: {
        historyTitle: string;
        clearAll: string;
    }
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onLoadHistory, onClearHistory, t }) => {
    if (history.length === 0) {
        return null;
    }

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg animate-fade-in">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <HistoryIcon className="h-6 w-6 text-brand-primary dark:text-brand-secondary" />
                    <h3 className="text-lg font-semibold text-brand-dark dark:text-slate-100">{t.historyTitle}</h3>
                </div>
                <button
                    onClick={onClearHistory}
                    className="text-sm text-slate-500 dark:text-slate-400 hover:text-brand-dark dark:hover:text-white hover:underline"
                >
                    {t.clearAll}
                </button>
            </div>
            <div className="max-h-80 overflow-y-auto pe-2 space-y-2">
                {history.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onLoadHistory(item)}
                        className="w-full text-start p-3 bg-slate-50 dark:bg-slate-700 hover:bg-brand-light dark:hover:bg-slate-600 rounded-lg transition-colors group"
                        aria-label={`Load analysis for ${item.medications.join(', ')} from ${new Date(item.timestamp).toLocaleDateString()}`}
                    >
                        <p className="font-semibold text-sm text-brand-dark dark:text-slate-200 group-hover:text-brand-primary dark:group-hover:text-brand-secondary truncate">
                            {item.medications.join(', ')}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {new Date(item.timestamp).toLocaleString()}
                        </p>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default HistoryPanel;
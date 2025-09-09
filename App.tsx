
import React, { useState, useCallback, useEffect } from 'react';
import { AnalysisResult, MedicationInfo, LoadingState, HistoryItem } from './types';
import { analyzeMedications, generateMedicationImage } from './services/geminiService';
import DisclaimerModal from './components/DisclaimerModal';
import HistoryPanel from './components/HistoryPanel';
import { PillIcon } from './components/icons/PillIcon';
import { ScienceIcon } from './components/icons/ScienceIcon';
import { AlertIcon } from './components/icons/AlertIcon';
import { InfoIcon } from './components/icons/InfoIcon';
import { LanguageIcon } from './components/icons/LanguageIcon';
import { SunIcon } from './components/icons/SunIcon';
import { MoonIcon } from './components/icons/MoonIcon';

const severityColorMap: { [key: string]: string } = {
  'Minor': 'bg-accent-green/20 text-accent-green',
  'Moderate': 'bg-accent-yellow/20 text-accent-yellow-700',
  'Major': 'bg-accent-red/20 text-accent-red',
  'Life-threatening': 'bg-red-700/30 text-red-700 font-bold',
};

const LOCAL_STORAGE_KEY = 'medicationAnalysisHistory';
const LANGUAGE_KEY = 'medicationAnalyzerLanguage';
const THEME_KEY = 'medicationAnalyzerTheme';

const COMMON_MEDICATIONS = [
  "Lisinopril", "Atorvastatin", "Levothyroxine", "Metformin", "Amlodipine",
  "Metoprolol", "Albuterol", "Omeprazole", "Losartan", "Gabapentin",
  "Hydrochlorothiazide", "Sertraline", "Simvastatin", "Montelukast",
  "Escitalopram", "Acetaminophen", "Ibuprofen", "Aspirin", "Furosemide",
  "Pantoprazole", "Tamsulosin", "Citalopram", "Prednisone", "Warfarin",
  "Clopidogrel", "Apixaban", "Rivaroxaban", "Insulin Glargine"
];

const translations = {
    en: {
        headerTitle: "Medication Analyzer Pro",
        headerSubtitle: "AI-Powered Insights by a Virtual Physician",
        medicationInputTitle: "Enter Medications",
        medicationInputSubtitle: "Type a medication name to add it for analysis.",
        medicationInputPlaceholder: "Type or select a medication...",
        addButton: "Add",
        analyzeButton: "Analyze Medications",
        startNewAnalysis: "Start New Analysis",
        interactionsTab: "Interactions",
        medicationDetailsPlaceholder: "View Medication Details...",
        noInteractionsTitle: "No Interactions Found",
        noInteractionsBody: "Based on the provided list, no significant interactions were identified. Always consult a healthcare professional.",
        indicationsTitle: "Indications for Use",
        methodOfUseTitle: "Method of Use",
        sideEffectsTitle: "Common Side Effects",
        dosageTitle: "Dosage Information",
        noSideEffects: "No common side effects listed.",
        loadingAnalysis: "Consulting virtual physician for analysis...",
        loadingImages: "Generating medication visuals...",
        loadingSubtext: "This may take a moment. Thank you for your patience.",
        welcomeTitle: "Welcome to the Analysis Center",
        welcomeBody: "Add medications on the left and click \"Analyze\" to get a detailed, AI-powered report from our virtual physician.",
        imageLoading: "Loading Image...",
        imageNotAvailable: "Image not available",
        historyTitle: "Analysis History",
        clearAll: "Clear All",
        switchToArabic: "العربية",
        switchToEnglish: "English",
        disclaimerTitle: "Important Medical Disclaimer",
        disclaimerP1: "This tool uses a generative AI model to provide information about medications and their interactions.",
        disclaimerP2: "The information provided is for educational and informational purposes ONLY and is NOT a substitute for professional medical advice, diagnosis, or treatment.",
        disclaimerP3: "Never disregard professional medical advice or delay in seeking it because of something you have read on this application. Always consult with your doctor or another qualified healthcare provider with any questions you may have regarding a medical condition or treatment.",
        disclaimerButton: "I Understand and Accept"
    },
    ar: {
        headerTitle: "محلل الأدوية الاحترافي",
        headerSubtitle: "رؤى مدعومة بالذكاء الاصطناعي من طبيب افتراضي",
        medicationInputTitle: "أدخل الأدوية",
        medicationInputSubtitle: "اكتب اسم الدواء لإضافته للتحليل.",
        medicationInputPlaceholder: "اكتب أو اختر دواء...",
        addButton: "إضافة",
        analyzeButton: "تحليل الأدوية",
        startNewAnalysis: "بدء تحليل جديد",
        interactionsTab: "التفاعلات",
        medicationDetailsPlaceholder: "عرض تفاصيل الدواء...",
        noInteractionsTitle: "لم يتم العثور على تفاعلات",
        noInteractionsBody: "بناءً على القائمة المقدمة، لم يتم تحديد أي تفاعلات دوائية مهمة. استشر دائمًا أخصائي رعاية صحية.",
        indicationsTitle: "دواعي الاستعمال",
        methodOfUseTitle: "طريقة الاستخدام",
        sideEffectsTitle: "الآثار الجانبية الشائعة",
        dosageTitle: "معلومات الجرعة",
        noSideEffects: "لا توجد آثار جانبية شائعة مدرجة.",
        loadingAnalysis: "جاري استشارة الطبيب الافتراضي للتحليل...",
        loadingImages: "جاري إنشاء صور الأدوية...",
        loadingSubtext: "قد يستغرق هذا بعض الوقت. شكرا لك على صبرك.",
        welcomeTitle: "مرحبًا بك في مركز التحليل",
        welcomeBody: "أضف الأدوية على اليسار وانقر على \"تحليل\" للحصول على تقرير مفصل مدعوم بالذكاء الاصطناعي من طبيبنا الافتراضي.",
        imageLoading: "جاري تحميل الصورة...",
        imageNotAvailable: "الصورة غير متوفرة",
        historyTitle: "سجل التحليلات",
        clearAll: "مسح الكل",
        switchToEnglish: "English",
        switchToArabic: "العربية",
        disclaimerTitle: "إخلاء مسؤولية طبي مهم",
        disclaimerP1: "تستخدم هذه الأداة نموذج ذكاء اصطناعي توليدي لتقديم معلومات حول الأدوية وتفاعلاتها.",
        disclaimerP2: "المعلومات المقدمة هي لأغراض تعليمية وإعلامية فقط وليست بديلاً عن الاستشارة الطبية المتخصصة أو التشخيص أو العلاج.",
        disclaimerP3: "لا تتجاهل أبدًا المشورة الطبية المتخصصة أو تتأخر في طلبها بسبب شيء قرأته في هذا التطبيق. استشر دائمًا طبيبك أو مقدم رعاية صحية مؤهل آخر بشأن أي أسئلة قد تكون لديك بخصوص حالة طبية أو علاج.",
        disclaimerButton: "أفهم وأوافق"
    }
};

const Header: React.FC<{
    language: 'en' | 'ar';
    onLanguageChange: () => void;
    theme: 'light' | 'dark';
    onThemeChange: () => void;
}> = ({ language, onLanguageChange, theme, onThemeChange }) => {
    const t = language === 'ar' ? translations.ar : translations.en;

    return (
        <header className="bg-white dark:bg-slate-800 shadow-md">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <div className="bg-brand-primary p-2 rounded-full text-white">
                            <PillIcon className="h-6 w-6" />
                        </div>
                        <h1 className="text-2xl font-bold text-brand-dark dark:text-slate-100">{t.headerTitle}</h1>
                    </div>
                    <div className="flex items-center space-x-4 rtl:space-x-reverse">
                       <p className="text-sm text-slate-500 dark:text-slate-400 hidden md:block">{t.headerSubtitle}</p>
                       <button onClick={onLanguageChange} className="flex items-center space-x-2 rtl:space-x-reverse text-sm font-medium text-brand-primary hover:text-brand-dark dark:text-brand-secondary dark:hover:text-white transition-colors">
                           <LanguageIcon className="h-5 w-5"/>
                           <span>{language === 'en' ? t.switchToArabic : t.switchToEnglish}</span>
                       </button>
                       <button onClick={onThemeChange} className="flex items-center text-sm font-medium text-brand-primary hover:text-brand-dark dark:text-brand-secondary dark:hover:text-white transition-colors" aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
                          {theme === 'light' ? <MoonIcon className="h-5 w-5"/> : <SunIcon className="h-5 w-5" />}
                       </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

const MedicationTag: React.FC<{ med: string, onRemove: (med: string) => void }> = ({ med, onRemove }) => (
  <span className="inline-flex items-center bg-brand-light dark:bg-brand-dark text-brand-primary dark:text-brand-light text-sm font-medium px-3 py-1 rounded-full animate-fade-in">
    {med}
    <button onClick={() => onRemove(med)} className="ms-2 text-brand-primary dark:text-brand-light hover:text-brand-dark dark:hover:text-white focus:outline-none">
      &times;
    </button>
  </span>
);

const MedicationInput: React.FC<{
  medications: string[];
  setMedications: React.Dispatch<React.SetStateAction<string[]>>;
  t: typeof translations.en;
}> = ({ medications, setMedications, t }) => {
  const [inputValue, setInputValue] = useState('');

  const handleAddMedication = useCallback(() => {
    const medToAdd = inputValue.trim();
    if (medToAdd && !medications.some(m => m.toLowerCase() === medToAdd.toLowerCase())) {
      setMedications([...medications, medToAdd]);
      setInputValue(''); // Reset input
    }
  }, [inputValue, medications, setMedications]);

  const handleRemoveMedication = (medToRemove: string) => {
    setMedications(medications.filter(med => med !== medToRemove));
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddMedication();
    }
  };

  const isAddDisabled = !inputValue.trim() || medications.some(m => m.toLowerCase() === inputValue.trim().toLowerCase());

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
      <label htmlFor="medication-input" className="block text-lg font-semibold text-brand-dark dark:text-slate-100 mb-2">{t.medicationInputTitle}</label>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">{t.medicationInputSubtitle}</p>
      <div className="flex items-center border-2 border-brand-secondary/50 dark:border-brand-secondary/30 rounded-lg focus-within:ring-2 focus-within:ring-brand-secondary focus-within:border-brand-secondary transition-all">
        <input
          id="medication-input"
          list="medication-suggestions"
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t.medicationInputPlaceholder}
          className="w-full p-3 border-none rounded-s-lg focus:outline-none bg-white dark:bg-slate-800 dark:text-slate-100"
          aria-label="Medication name input"
        />
        <datalist id="medication-suggestions">
          {COMMON_MEDICATIONS
            .filter(med => !medications.some(m => m.toLowerCase() === med.toLowerCase()))
            .sort()
            .map(med => (
              <option key={med} value={med} />
            ))}
        </datalist>
        <button
          onClick={handleAddMedication}
          className="bg-brand-secondary text-white font-semibold px-6 py-3 rounded-e-md hover:bg-opacity-90 transition-colors disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
          disabled={isAddDisabled}
          aria-label="Add medication"
        >
          {t.addButton}
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 min-h-[3rem]">
        {medications.map(med => <MedicationTag key={med} med={med} onRemove={handleRemoveMedication} />)}
      </div>
    </div>
  );
};

const AnalysisDisplay: React.FC<{ result: AnalysisResult; t: typeof translations.en }> = ({ result, t }) => {
  const [activeTab, setActiveTab] = useState('interactions');

  useEffect(() => {
    setActiveTab('interactions');
  }, [result]);
  
  const isMedicationActive = result.medications.some(m => m.name === activeTab);

  return (
    <div className="animate-fade-in mt-8">
      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="-mb-px flex items-center space-x-4 rtl:space-x-reverse" aria-label="Analysis Navigation">
          <button
            onClick={() => setActiveTab('interactions')}
            className={`whitespace-nowrap py-4 px-2 border-b-2 font-medium text-lg transition-colors ${activeTab === 'interactions' ? 'border-brand-primary dark:border-brand-secondary text-brand-primary dark:text-brand-secondary' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'}`}
          >
            {t.interactionsTab}
          </button>
          
          <div className="h-6 border-l border-slate-300 dark:border-slate-600"></div>

          <div className="relative">
             <label htmlFor="medication-details-select" className="sr-only">View Medication Details</label>
            <select
              id="medication-details-select"
              value={isMedicationActive ? activeTab : ''}
              onChange={(e) => setActiveTab(e.target.value)}
              className={`py-4 pe-8 ps-2 border-b-2 font-medium text-lg appearance-none bg-transparent focus:outline-none focus:ring-0 transition-colors cursor-pointer ${
                isMedicationActive
                  ? 'border-brand-primary dark:border-brand-secondary text-brand-primary dark:text-brand-secondary'
                  : 'border-transparent text-slate-500 dark:text-slate-400'
              }`}
              aria-label="Select a medication to view details"
            >
              <option value="" disabled>{t.medicationDetailsPlaceholder}</option>
              {result.medications.map(med => (
                <option key={med.name} value={med.name}>
                  {med.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center px-2 text-slate-500 dark:text-slate-400">
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </nav>
      </div>
      <div className="mt-6">
        {activeTab === 'interactions' ? <InteractionPanel interactions={result.interactions} t={t} /> : result.medications.map(med => activeTab === med.name && <MedicationPanel key={med.name} med={med} t={t} />)}
      </div>
    </div>
  );
};


const InteractionPanel: React.FC<{ interactions: AnalysisResult['interactions'], t: typeof translations.en }> = ({ interactions, t }) => (
  <div className="space-y-6 animate-slide-up">
    {interactions.length > 0 ? (
      interactions.map((interaction, index) => (
        <div key={index} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
          <div className={`p-4 flex items-center space-x-4 rtl:space-x-reverse border-s-8 ${severityColorMap[interaction.severity] || 'bg-slate-200 text-slate-800'} border-transparent`}>
             <AlertIcon className="h-8 w-8 text-current" />
            <div>
              <h3 className="text-xl font-bold text-brand-dark dark:text-slate-100">{interaction.medications.join(' & ')}</h3>
              <p className="font-semibold">{interaction.severity} Interaction</p>
            </div>
          </div>
          <div className="p-6 text-slate-700 dark:text-slate-300">
            <p>{interaction.description}</p>
          </div>
        </div>
      ))
    ) : (
      <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg text-center">
        <InfoIcon className="h-12 w-12 text-accent-green mx-auto" />
        <h3 className="mt-4 text-xl font-semibold text-brand-dark dark:text-slate-100">{t.noInteractionsTitle}</h3>
        <p className="mt-2 text-slate-600 dark:text-slate-400">{t.noInteractionsBody}</p>
      </div>
    )}
  </div>
);

const MedicationPanel: React.FC<{ med: MedicationInfo, t: typeof translations.en }> = ({ med, t }) => {
    const sideEffectSeverityMap: { [key: string]: string } = {
        'Common': 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300',
        'Rare': 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
        'Severe': 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
        'default': 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-xl shadow-lg animate-slide-up">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                    <h2 className="text-3xl font-extrabold text-brand-dark dark:text-white mb-1">{med.name}</h2>
                    <p className="text-lg text-brand-secondary font-semibold">{med.form}</p>
                    {med.imageLoading && <div className="mt-4 w-full aspect-square bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse-subtle flex items-center justify-center text-slate-400 dark:text-slate-500">{t.imageLoading}</div>}
                    {med.imageUrl && !med.imageLoading && <img src={med.imageUrl} alt={`Box of ${med.name}`} className="mt-4 w-full object-cover rounded-lg shadow-md" />}
                    {!med.imageUrl && !med.imageLoading && <div className="mt-4 w-full aspect-square bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">{t.imageNotAvailable}</div>}
                    <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">{med.description}</p>
                </div>
                <div className="md:col-span-2 space-y-6">
                    <InfoSection title={t.indicationsTitle} items={med.indications} />
                    <InfoSection title={t.methodOfUseTitle}>
                        <p className="text-slate-700 dark:text-slate-300">{med.methodOfUse}</p>
                    </InfoSection>
                    <InfoSection title={t.sideEffectsTitle}>
                        <div className="space-y-3">
                            {med.sideEffects.length > 0 ? (
                                med.sideEffects.map((effect, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                        <span className="text-sm text-slate-800 dark:text-slate-300">{effect.symptom}</span>
                                        <span className={
                                            `px-2.5 py-0.5 rounded-full text-xs font-semibold
                                            ${sideEffectSeverityMap[effect.severity] || sideEffectSeverityMap['default']}`
                                        }>
                                            {effect.severity}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-500 dark:text-slate-400 italic">{t.noSideEffects}</p>
                            )}
                        </div>
                    </InfoSection>
                    <InfoSection title={t.dosageTitle}>
                        <div className="bg-brand-light dark:bg-slate-700 p-4 rounded-lg">
                            <p className="font-bold text-brand-primary dark:text-brand-secondary">{med.dosage.recommendation}</p>
                            <p className="mt-2 text-sm text-brand-dark dark:text-slate-300">{med.dosage.reasoning}</p>
                        </div>
                    </InfoSection>
                </div>
            </div>
        </div>
    );
};

const InfoSection: React.FC<{ title: string; items?: string[]; children?: React.ReactNode }> = ({ title, items, children }) => (
    <div>
        <h4 className="text-lg font-bold text-brand-dark dark:text-slate-100 border-b-2 border-brand-light dark:border-slate-700 pb-2 mb-3">{title}</h4>
        {items && (
            <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
                {items.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
        )}
        {children}
    </div>
);

const LoadingIndicator: React.FC<{ loadingState: LoadingState; t: typeof translations.en }> = ({ loadingState, t }) => {
    const messages: { [key in LoadingState]?: string } = {
        [LoadingState.ANALYZING_TEXT]: t.loadingAnalysis,
        [LoadingState.GENERATING_IMAGES]: t.loadingImages,
    };

    const message = messages[loadingState];
    if (!message) return null;

    return (
        <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-xl shadow-lg">
            <ScienceIcon className="h-12 w-12 text-brand-primary dark:text-brand-secondary mx-auto animate-spin" />
            <p className="mt-4 text-lg font-semibold text-brand-dark dark:text-slate-100">{message}</p>
            <p className="mt-2 text-slate-500 dark:text-slate-400">{t.loadingSubtext}</p>
        </div>
    );
};

export default function App() {
  const [medications, setMedications] = useState<string[]>(['Lisinopril', 'Metformin', 'Aspirin']);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [language, setLanguage] = useState<'en' | 'ar'>(
    (localStorage.getItem(LANGUAGE_KEY) as 'en' | 'ar') || 'en'
  );
  const [theme, setTheme] = useState<'light' | 'dark'>(
    (localStorage.getItem(THEME_KEY) as 'light' | 'dark') || 'light'
  );

  const t = language === 'ar' ? translations.ar : translations.en;

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const handleThemeChange = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem(LANGUAGE_KEY, language);
  }, [language]);
  
  const handleLanguageChange = () => {
      setLanguage(prev => prev === 'en' ? 'ar' : 'en');
      // We clear the results as they are language-specific
      setAnalysisResult(null);
      setError(null);
      setLoadingState(LoadingState.IDLE);
  };

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error("Failed to load history from localStorage", error);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (medications.length === 0) {
      setError("Please add at least one medication to analyze.");
      return;
    }
    setError(null);
    setAnalysisResult(null);
    setLoadingState(LoadingState.ANALYZING_TEXT);

    try {
      const result = await analyzeMedications(medications, language);
      const medsWithLoading = result.medications.map(med => ({ ...med, imageUrl: undefined, imageLoading: true }));
      setAnalysisResult({ ...result, medications: medsWithLoading });
      setLoadingState(LoadingState.GENERATING_IMAGES);

      let updatedMeds = [...medsWithLoading];
      for (let i = 0; i < updatedMeds.length; i++) {
        const med = updatedMeds[i];
        try {
          const imageUrl = await generateMedicationImage(med.name, med.form);
          updatedMeds[i] = { ...med, imageUrl, imageLoading: false };
        } catch (imgError) {
          console.error(`Failed to generate image for ${med.name}:`, imgError);
          updatedMeds[i] = { ...med, imageLoading: false };
        }
        setAnalysisResult(prev => prev ? { ...prev, medications: [...updatedMeds] } : null);
      }
      
      const finalResultForHistory: AnalysisResult = { ...result, medications: updatedMeds.map(m => ({...m, imageLoading: false})) };
      const newHistoryItem: HistoryItem = {
          id: new Date().toISOString(),
          timestamp: Date.now(),
          medications: medications,
          result: finalResultForHistory,
      };

      setHistory(prevHistory => {
          const updatedHistory = [newHistoryItem, ...prevHistory];
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedHistory));
          return updatedHistory;
      });

      setLoadingState(LoadingState.DONE);
    } catch (err) {
      console.error(err);
      setError("An error occurred during analysis. The AI may be experiencing high traffic. Please try again later.");
      setLoadingState(LoadingState.IDLE);
    }
  }, [medications, language]);
  
  const handleStartOver = () => {
      setMedications([]);
      setAnalysisResult(null);
      setError(null);
      setLoadingState(LoadingState.IDLE);
  };

  const handleLoadFromHistory = (item: HistoryItem) => {
    setMedications(item.medications);
    setAnalysisResult(item.result);
    setError(null);
    setLoadingState(LoadingState.DONE);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  return (
    <>
      {showDisclaimer && <DisclaimerModal onClose={() => setShowDisclaimer(false)} t={t} />}
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <Header language={language} onLanguageChange={handleLanguageChange} theme={theme} onThemeChange={handleThemeChange} />
        <main className="container mx-auto p-4 sm:p-6 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-1 space-y-6">
              <MedicationInput medications={medications} setMedications={setMedications} t={t} />
              <button
                onClick={handleAnalyze}
                disabled={medications.length === 0 || loadingState !== LoadingState.IDLE}
                className="w-full bg-brand-primary text-white font-bold py-4 px-6 rounded-lg text-lg hover:bg-brand-dark dark:bg-brand-secondary dark:hover:bg-opacity-80 transition-all disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center space-x-2 rtl:space-x-reverse"
              >
                <ScienceIcon className="h-6 w-6" />
                <span>{t.analyzeButton}</span>
              </button>
               {analysisResult && (
                  <button
                    onClick={handleStartOver}
                    className="w-full bg-slate-600 text-white font-bold py-3 px-6 rounded-lg text-md hover:bg-slate-700 dark:hover:bg-slate-500 transition-all"
                  >
                    {t.startNewAnalysis}
                  </button>
                )}
              <HistoryPanel history={history} onLoadHistory={handleLoadFromHistory} onClearHistory={handleClearHistory} t={t} />
            </div>
            <div className="lg:col-span-2">
              {loadingState !== LoadingState.IDLE && loadingState !== LoadingState.DONE && <LoadingIndicator loadingState={loadingState} t={t} />}
              {error && <div className="p-4 bg-red-100 text-red-700 rounded-lg shadow">{error}</div>}
              {!analysisResult && loadingState === LoadingState.IDLE && !error && (
                <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-xl shadow-lg border-2 border-dashed border-slate-300 dark:border-slate-600">
                    <PillIcon className="h-16 w-16 text-brand-secondary/50 dark:text-brand-secondary/70 mx-auto" />
                    <h2 className="mt-4 text-2xl font-bold text-brand-dark dark:text-slate-100">{t.welcomeTitle}</h2>
                    <p className="mt-2 text-slate-600 dark:text-slate-400">{t.welcomeBody}</p>
                </div>
              )}
              {analysisResult && <AnalysisDisplay result={analysisResult} t={t} />}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

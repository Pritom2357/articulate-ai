import { createContext, useContext, useState, useEffect } from 'react';

const ThemeLanguageContext = createContext();

const dictionary = {
  en: {
    // Navigation & Layout
    nav_curriculum: "Curriculum",
    nav_flashcards: "Flashcards",
    nav_progress: "My Progress",
    nav_leaderboard: "Leaderboard",
    nav_vocabulary: "My Vocabulary",
    nav_placement: "Placement Test",
    nav_ai_chat: "AI Chat",
    nav_tests: "Tests",
    nav_sign_out: "Sign out",
    nav_sign_in: "Sign in",
    nav_active_tutor: "Active Tutor:",
    nav_change: "Change",
    nav_search: "Search lessons, words...",
    nav_tutor_female: "Female Guide",
    nav_tutor_male: "Male Guide",
    nav_notifications: "Notifications",
    nav_profile: "Profile",

    // Curriculum Page
    curr_title: "Learning Curriculum",
    curr_subtitle: "Select your desired chapter and start practicing English vocabulary and speaking.",
    curr_chapter: "Chapter",
    curr_lessons: "Lessons",
    curr_lessons_completed: "lessons completed",
    curr_view_lessons: "View lessons",
    curr_completed: "Completed ✅",
    curr_in_progress: "In Progress 📈",
    curr_empty: "No chapters available",
    curr_empty_sub: "Please visit again later.",
    curr_loading: "Loading curriculum...",

    // Chapter Details
    chap_details: "Chapter Details",
    chap_subtitle: "Complete the lessons in this chapter to improve your speaking skills.",
    chap_start_lesson: "Start Lesson ▶",
    chap_play_again: "Play Again 🔄",
    chap_completed: "Completed ✅",
    chap_start_test: "Start Test ▶",
    chap_test_title: "IELTS Open Conversation Test",
    chap_test_subtitle: "At the end of the chapter, take an IELTS-style conversation test with your AI tutor guide. The AI tutor will assess keywords from your answers and generate your next RAG study plan.",
    chap_evaluation: "Chapter Evaluation Test",
    chap_empty: "No lessons found in this chapter",
    chap_empty_sub: "Please visit again later.",
    chap_loading: "Loading chapter content...",

    // Lesson Details
    step_vocab: "Vocabulary",
    step_flash: "Flashcards Practice",
    step_word: "Word Test",
    step_sentence: "Sentence Test",
    step_complete: "Lesson Completed! 🎉",
    lesson_tutor: "Guide",
    lesson_loading: "Loading lesson...",
    vocab_listen: "Listen",
    vocab_playing: "Playing...",
    btn_prev_words: "◀ Previous 3 Words",
    btn_next_words: "Next 3 Words ▶",
    btn_next_step_flash: "Next: Flashcards Practice ▶",
    flash_tap_to_flip: "Click to Flip 🔄",
    flash_page: "Page",
    btn_next_2_words: "Next 2 Words ▶",
    btn_next_step_word: "Next: Word Test ▶",
    mic_hold_to_record: "Press and hold button to record",
    mic_release_to_evaluate: "Release to evaluate pronunciation",
    mic_evaluating: "Tutor Guide is analyzing your pronunciation...",
    mic_accuracy: "AI Pronunciation Accuracy:",
    mic_recognized: "Recognized word:",
    mic_tips: "Phonemic Analysis (where you went wrong):",
    mic_correct_pron: "Correct Pronunciation",
    mic_your_recording: "Your Recording",
    mic_next_word: "Next Word",
    mic_next_sentence: "Next Sentence",
    mic_retry: "*Please try again. Minimum 60% accuracy is required to pass.",
    cel_title: "Lesson Completed Successfully!",
    cel_desc: "You have completed today's lesson. With this, you are one step closer to mastering English pronunciation.",
    cel_xp_reward: "XP Reward",
    cel_result: "Your Result",
    cel_pass: "Pass ✅",
    cel_back_curr: "Back to Curriculum",
    cel_view_prog: "View Progress 📈",

    // Progress Dashboard
    prog_title: "Progress Dashboard",
    prog_subtitle: "Check your learning progress, XP earnings, and active screen time at a glance.",
    prog_xp_earned: "Total XP Earned",
    prog_level: "Current Level",
    prog_streak: "Active Streak",
    prog_days: "Days",
    prog_points: "Points",
    prog_placement: "Placement Test Assessment",
    prog_placed_lvl: "Placed Level",
    prog_placed_chapter: "Placed at Chapter",
    chart_title: "Weekly Screen Time & Progress Analysis",
    chart_desc: "Comparison chart of daily XP earned and active app screen time over the last 7 days.",
    chart_today_use: "Today's Usage:",
    chart_minutes: "minutes",
    chart_xp_bar: "XP Gained (Progress)",
    chart_screentime_line: "Screen Time (min)",
    cal_title: "Streak Calendar",
    cal_subtitle: "Your active learning days during this month.",
    cal_legend: "Progress Legend:",
    cal_legend_none: "No activity",
    cal_legend_low: "Light (1-49 XP)",
    cal_legend_mid: "Medium (50-99 XP)",
    cal_legend_high: "High (100+ XP)",
    cal_selected_details: "Selected Day Details",
    cal_no_activity: "No learning activity recorded for this day. Complete a lesson to boost your progress!",
    cal_activity_logs: "Activity Logs:",
    cal_streak_summary: "Active Days Calendar",
    prog_loading: "Analyzing progress dashboard...",
  },
  bn: {
    // Navigation & Layout
    nav_curriculum: "কারিকুলাম",
    nav_flashcards: "ফ্ল্যাশকার্ড",
    nav_progress: "আমার অগ্রগতি",
    nav_leaderboard: "লিডারবোর্ড",
    nav_vocabulary: "আমার ভোকাবুলারি",
    nav_placement: "প্লেসমেন্ট পরীক্ষা",
    nav_ai_chat: "এআই চ্যাট",
    nav_tests: "পরীক্ষাসমূহ",
    nav_sign_out: "লগ আউট",
    nav_sign_in: "লগ ইন",
    nav_active_tutor: "সক্রিয় গাইড:",
    nav_change: "পরিবর্তন",
    nav_search: "লেসন, শব্দ খুঁজুন...",
    nav_tutor_female: "নারী গাইড",
    nav_tutor_male: "পুরুষ গাইড",
    nav_notifications: "নোটিফিকেশন",
    nav_profile: "প্রোফাইল",

    // Curriculum Page
    curr_title: "লার্নিং কারিকুলাম (Curriculum)",
    curr_subtitle: "আপনার কাঙ্ক্ষিত চ্যাপ্টার নির্বাচন করুন এবং ইংরেজি ভোকাবুলারি ও স্পিকিং অনুশীলন শুরু করুন।",
    curr_chapter: "চ্যাপ্টার",
    curr_lessons: "লেসন",
    curr_lessons_completed: "লেসন সম্পন্ন",
    curr_view_lessons: "লেসনগুলো দেখুন",
    curr_completed: "সম্পন্ন ✅",
    curr_in_progress: "চলমান 📈",
    curr_empty: "কোনো চ্যাপ্টার উপলব্ধ নেই",
    curr_empty_sub: "অনুগ্রহ করে পরবর্তীতে আবার ঘুরে আসুন।",
    curr_loading: "কারিকুলাম লোড হচ্ছে...",

    // Chapter Details
    chap_details: "চ্যাপ্টার বিবরণ",
    chap_subtitle: "চ্যাপ্টারের অধীনে থাকা লেসনগুলো শেষ করে আপনার স্পিকিং দক্ষতা বৃদ্ধি করুন।",
    chap_start_lesson: "লেসন শুরু করুন ▶",
    chap_play_again: "আবার চেষ্টা করুন 🔄",
    chap_completed: "সম্পন্ন ✅",
    chap_start_test: "পরীক্ষা শুরু করুন ▶",
    chap_test_title: "IELTS ওপেন কনভারসেশন পরীক্ষা",
    chap_test_subtitle: "চ্যাপ্টারের পড়া শেষে আপনার এআই গাইড টিউটরের সাথে একটি IELTS স্টাইলের কথপোকথন পরীক্ষা দিন। এআই টিউটর আপনার উত্তরগুলো থেকে গুরুত্বপূর্ণ কিওয়ার্ড পরিমাপ করবে এবং আপনার পরবর্তী আরএজি (RAG) স্টাডি প্ল্যান তৈরি করে দেবে।",
    chap_evaluation: "চ্যাপ্টার মূল্যায়ন পরীক্ষা (Chapter Evaluation)",
    chap_empty: "এই চ্যাপ্টারে কোনো লেসন পাওয়া যায়নি",
    chap_empty_sub: "অনুগ্রহ করে পরবর্তীতে আবার ঘুরে আসুন।",
    chap_loading: "চ্যাপ্টার কন্টেন্ট লোড হচ্ছে...",

    // Lesson Details
    step_vocab: "শব্দভান্ডার (Vocabulary)",
    step_flash: "ফ্ল্যাশ-কার্ড প্র্যাকটিস",
    step_word: "শব্দ উচ্চারণ পরীক্ষা",
    step_sentence: "বাক্য উচ্চারণ পরীক্ষা",
    step_complete: "লেসন সম্পন্ন! 🎉",
    lesson_tutor: "গাইড",
    lesson_loading: "লেসন লোড হচ্ছে...",
    vocab_listen: "উচ্চারণ শুনুন",
    vocab_playing: "বাজছে...",
    btn_prev_words: "◀ পূর্ববর্তী ৩টি শব্দ",
    btn_next_words: "পরবর্তী ৩টি শব্দ ▶",
    btn_next_step_flash: "পরবর্তী ধাপ: ফ্ল্যাশ-কার্ড প্র্যাকটিস ▶",
    flash_tap_to_flip: "ক্লিক করুন 🔄",
    flash_page: "পেইজ",
    btn_next_2_words: "পরবর্তী ২টি শব্দ ▶",
    btn_next_step_word: "পরবর্তী ধাপ: শব্দ টেস্ট ▶",
    mic_hold_to_record: "রেকর্ড করতে বাটনে চেপে ধরে রাখুন",
    mic_release_to_evaluate: "ছেড়ে দিলে মূল্যায়িত হবে",
    mic_evaluating: "Tutor Guide আপনার উচ্চারণ বিশ্লেষণ করছে...",
    mic_accuracy: "AI উচ্চারণ নির্ভুলতা:",
    mic_recognized: "শনাক্ত শব্দ:",
    mic_tips: "ধ্বনি বিশ্লেষণ (কোথায় ভুল হয়েছে):",
    mic_correct_pron: "সঠিক উচ্চারণ",
    mic_your_recording: "আপনার রেকর্ডিং",
    mic_next_word: "পরবর্তী শব্দ",
    mic_next_sentence: "পরবর্তী বাক্য",
    mic_retry: "*দয়া করে আবার বলুন। পাশ করতে কমপক্ষে ৬০% স্কোর প্রয়োজন।",
    cel_title: "লেসন সফলভাবে সম্পন্ন হয়েছে!",
    cel_desc: "আপনি আজকের লেসন সম্পূর্ণ করেছেন। এর মাধ্যমে আপনি ইংরেজি উচ্চারণে আরও এক ধাপ এগিয়ে গেলেন।",
    cel_xp_reward: "এক্সপি পুরস্কার",
    cel_result: "আপনার ফলাফল",
    cel_pass: "পাস ✅",
    cel_back_curr: "কারিকুলামে ফিরে যান",
    cel_view_prog: "প্রোগ্রেস দেখুন 📈",

    // Progress Dashboard
    prog_title: "অগ্রগতি ড্যাশবোর্ড (My Progress)",
    prog_subtitle: "আপনার শেখার অগ্রগতি, এক্সপি অর্জন এবং স্ক্রিন টাইম বিশ্লেষণ একনজরে দেখুন।",
    prog_xp_earned: "XP অর্জিত (Total XP)",
    prog_level: "আপনার লেভেল (Current Level)",
    prog_streak: "অধ্যবসায় (Active Streak)",
    prog_days: "দিন",
    prog_points: "পয়েন্ট",
    prog_placement: "প্লেসমেন্ট পরীক্ষার মূল্যায়ন (Placement Assessment)",
    prog_placed_lvl: "নির্ধারিত লেভেল",
    prog_placed_chapter: "চ্যাপ্টার এ প্লেস করা হয়েছে",
    chart_title: "সাপ্তাহিক স্ক্রিন টাইম ও অগ্রগতি বিশ্লেষণ",
    chart_desc: "গত ৭ দিনে প্রতিদিনের অর্জিত XP এবং অ্যাপ ব্যবহারের সক্রিয় সময়ের তুলনামূলক চার্ট।",
    chart_today_use: "আজকের ব্যবহার:",
    chart_minutes: "মিনিট",
    chart_xp_bar: "XP অর্জিত (Progress)",
    chart_screentime_line: "স্ক্রিন টাইম (মিনিট)",
    cal_title: "ধারাবাহিকতা ক্যালেন্ডার (Streak Calendar)",
    cal_subtitle: "এই মাসে আপনার শেখার সক্রিয় দিনগুলো।",
    cal_legend: "অগ্রগতি সূচক:",
    cal_legend_none: "নিষ্ক্রিয়",
    cal_legend_low: "সামান্য অর্জন (১-৪৯ XP)",
    cal_legend_mid: "মাঝারি অর্জন (৫০-৯৯ XP)",
    cal_legend_high: "উচ্চ অর্জন (১০০+ XP)",
    cal_selected_details: "Selected Day Details",
    cal_no_activity: "এই দিনটিতে কোনো পড়াশোনার তথ্য নেই। অগ্রগতি বাড়াতে আজই একটি লেসন সম্পন্ন করুন!",
    cal_activity_logs: "অর্জনের বিবরণ:",
    cal_streak_summary: "সক্রিয় দিনগুলোর ক্যালেন্ডার",
    prog_loading: "অগ্রগতি বিশ্লেষণ করা হচ্ছে...",
  }
};

export function ThemeLanguageProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('articulate_theme') || 'dark');
  const [language, setLanguage] = useState(() => localStorage.getItem('articulate_language') || 'bn');

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
    localStorage.setItem('articulate_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('articulate_language', language);
  }, [language]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'bn' ? 'en' : 'bn');
  };

  const t = (key) => {
    const trans = dictionary[language][key] || dictionary['en'][key] || key;
    return trans;
  };

  return (
    <ThemeLanguageContext.Provider value={{ theme, language, toggleTheme, toggleLanguage, t }}>
      {children}
    </ThemeLanguageContext.Provider>
  );
}

export function useThemeLanguage() {
  const context = useContext(ThemeLanguageContext);
  if (!context) {
    throw new Error('useThemeLanguage must be used within a ThemeLanguageProvider');
  }
  return context;
}

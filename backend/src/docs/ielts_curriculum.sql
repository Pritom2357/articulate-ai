-- =============================================================================
-- IELTS CURRICULUM SEED DATA
-- Articulate AI — Comprehensive IELTS Preparation (Listening, Reading, Speaking)
-- Writing is excluded from this curriculum.
-- =============================================================================
-- Run this file against your PostgreSQL database AFTER tables are created.
-- It uses ON CONFLICT (id) DO UPDATE so it is safe to re-run (idempotent).
-- =============================================================================


-- ─────────────────────────────────────────────────────────────
-- 1. CHAPTERS  (8 chapters, covering all three skills)
-- ─────────────────────────────────────────────────────────────
INSERT INTO chapters (id, title, title_bn, order_num, skill_type, description, conversation_key_points)
VALUES
  -- ── CHAPTER 1 ── Listening Foundations ──
  (1,
   'Listening Foundations — Everyday Conversations',
   'শ্রবণ ভিত্তি — দৈনন্দিন কথোপকথন',
   1,
   'LISTENING',
   'Build your ear for natural English. Listen to simple conversations about greetings, introductions, directions, and daily activities. Learn to catch names, numbers, times, and key facts — exactly what IELTS Listening Section 1 tests.',
   '["greetings", "introductions", "numbers", "phone numbers", "dates", "times", "directions", "spelling names", "daily activities", "appointments"]'
  ),

  -- ── CHAPTER 2 ── Listening for Academic & Social Contexts ──
  (2,
   'Listening in Context — Academic & Social Situations',
   'প্রসঙ্গে শ্রবণ — একাডেমিক ও সামাজিক পরিস্থিতি',
   2,
   'LISTENING',
   'Move beyond basic conversations. Practice understanding monologues about campus tours, library orientations, course registrations, and social events — reflecting IELTS Listening Sections 2 and 3.',
   '["campus", "library", "registration", "timetable", "lecture", "seminar", "social events", "accommodation", "facilities", "instructions"]'
  ),

  -- ── CHAPTER 3 ── Advanced Listening — Lectures & Discussions ──
  (3,
   'Advanced Listening — Lectures & Group Discussions',
   'উন্নত শ্রবণ — লেকচার ও গ্রুপ আলোচনা',
   3,
   'LISTENING',
   'Tackle the hardest listening tasks. Follow academic lectures on science, history, and environment. Understand group discussions with multiple speakers, opinions, and supporting arguments — matching IELTS Listening Section 4.',
   '["academic lecture", "discussion", "opinion", "argument", "research", "environment", "globalisation", "technology impact", "cause and effect", "conclusion"]'
  ),

  -- ── CHAPTER 4 ── Reading Basics — Skimming & Scanning ──
  (4,
   'Reading Essentials — Skimming, Scanning & Vocabulary',
   'পঠন মূলনীতি — স্কিমিং, স্ক্যানিং ও শব্দভাণ্ডার',
   4,
   'READING',
   'Master the two most important speed-reading techniques: skimming for the main idea and scanning for specific details. Build your IELTS reading vocabulary with common academic and general training word families.',
   '["skimming", "scanning", "main idea", "topic sentence", "keyword", "synonym", "paraphrase", "heading", "paragraph", "vocabulary"]'
  ),

  -- ── CHAPTER 5 ── Reading Comprehension — Question Types ──
  (5,
   'Reading Mastery — IELTS Question Types',
   'পঠন দক্ষতা — আইইএলটিএস প্রশ্নের ধরন',
   5,
   'READING',
   'Practise every IELTS Reading question type: True/False/Not Given, matching headings, sentence completion, multiple choice, and summary completion. Learn strategies for each format with real-style passages.',
   '["true false not given", "yes no not given", "matching headings", "matching information", "sentence completion", "summary completion", "multiple choice", "diagram labelling", "short answer", "list selection"]'
  ),

  -- ── CHAPTER 6 ── Reading — Academic Passages & Critical Thinking ──
  (6,
   'Academic Reading — Complex Texts & Critical Analysis',
   'একাডেমিক পঠন — জটিল পাঠ্য ও সমালোচনামূলক বিশ্লেষণ',
   6,
   'READING',
   'Read and analyse full-length academic passages on topics like climate change, urbanisation, medicine, and technology. Develop inference, logical reasoning, and time-management skills for the actual IELTS test.',
   '["inference", "logical reasoning", "author opinion", "implication", "paraphrase", "reference", "climate change", "urbanisation", "health", "technology"]'
  ),

  -- ── CHAPTER 7 ── Speaking Foundations — Part 1 & Fluency ──
  (7,
   'Speaking Foundations — Part 1 & Everyday Fluency',
   'কথন ভিত্তি — পার্ট ১ ও দৈনন্দিন সাবলীলতা',
   7,
   'SPEAKING',
   'Prepare for IELTS Speaking Part 1. Answer personal questions about yourself, your home, studies, work, hobbies, and daily life confidently. Focus on pronunciation, natural rhythm, and avoiding common errors Bangladeshi learners make.',
   '["self introduction", "hometown", "home", "studies", "work", "hobbies", "daily routine", "food", "weather", "transport", "family", "friends", "pronunciation"]'
  ),

  -- ── CHAPTER 8 ── Speaking Advanced — Part 2 Cue Cards & Part 3 Discussions ──
  (8,
   'Speaking Mastery — Cue Cards & In-Depth Discussions',
   'কথন দক্ষতা — কিউ কার্ড ও গভীর আলোচনা',
   8,
   'SPEAKING',
   'Master IELTS Speaking Parts 2 and 3. Practise 2-minute monologues on cue card topics (describe a person, place, event, or object). Then engage in abstract discussions — give opinions, compare ideas, and use advanced vocabulary and grammar.',
   '["cue card", "describe a person", "describe a place", "describe an event", "describe an object", "opinion", "compare", "advantage disadvantage", "agree disagree", "future prediction", "abstract idea"]'
  )

ON CONFLICT (id) DO UPDATE SET
  title                  = EXCLUDED.title,
  title_bn               = EXCLUDED.title_bn,
  order_num              = EXCLUDED.order_num,
  skill_type             = EXCLUDED.skill_type,
  description            = EXCLUDED.description,
  conversation_key_points = EXCLUDED.conversation_key_points;


-- ─────────────────────────────────────────────────────────────
-- 2. LESSONS  (4-5 lessons per chapter = 37 total lessons)
-- ─────────────────────────────────────────────────────────────

INSERT INTO lessons (id, chapter_id, title, title_bn, order_num, type, objective_bn)
VALUES

  -- ════════════════════════════════════════════════════════════
  -- CHAPTER 1: Listening Foundations
  -- ════════════════════════════════════════════════════════════
  (1,  1, 'Catching Key Details — Names, Numbers & Dates',
       'মূল তথ্য ধরা — নাম, সংখ্যা ও তারিখ',
       1, 'LEARN',
       'ইংরেজিতে নাম, ফোন নম্বর, তারিখ ও সময় শোনার কৌশল শিখুন। আইইএলটিএস লিসেনিং সেকশন ১-এর জন্য প্রস্তুতি নিন।'),

  (2,  1, 'Everyday Dialogues — Appointments & Enquiries',
       'দৈনন্দিন সংলাপ — অ্যাপয়েন্টমেন্ট ও জিজ্ঞাসা',
       2, 'LEARN',
       'ডাক্তারের অ্যাপয়েন্টমেন্ট, হোটেল বুকিং ও দোকানে কেনাকাটা সংক্রান্ত কথোপকথন বুঝতে শিখুন।'),

  (3,  1, 'Listen & Complete — Gap-Fill Practice',
       'শুনুন ও পূরণ করুন — গ্যাপ-ফিল অনুশীলন',
       3, 'PRACTICE',
       'শ্রবণ থেকে তথ্য নিয়ে ফর্ম, টেবিল ও নোট পূরণ করার অনুশীলন করুন।'),

  (4,  1, 'Listening Section 1 Mock Test',
       'লিসেনিং সেকশন ১ মক টেস্ট',
       4, 'TEST',
       'একটি সম্পূর্ণ আইইএলটিএস লিসেনিং সেকশন ১ স্টাইল পরীক্ষা দিন।'),

  (5,  1, 'Error Patterns & Review',
       'ভুলের ধরন ও পুনর্মূল্যায়ন',
       5, 'REVIEW',
       'আপনার সাধারণ ভুলগুলো চিহ্নিত করুন এবং দুর্বল জায়গাগুলো পুনরায় অনুশীলন করুন।'),


  -- ════════════════════════════════════════════════════════════
  -- CHAPTER 2: Listening in Context
  -- ════════════════════════════════════════════════════════════
  (6,  2, 'Campus & Orientation Talks',
       'ক্যাম্পাস ও ওরিয়েন্টেশন বক্তৃতা',
       1, 'LEARN',
       'বিশ্ববিদ্যালয়ের ক্যাম্পাস ট্যুর, লাইব্রেরি নিয়ম ও ছাত্রাবাসের তথ্য সম্পর্কিত মনোলগ বুঝতে শিখুন।'),

  (7,  2, 'Understanding Instructions & Announcements',
       'নির্দেশনা ও ঘোষণা বোঝা',
       2, 'LEARN',
       'পাবলিক ঘোষণা, ক্লাস নির্দেশনা ও ইভেন্ট সূচি থেকে মূল তথ্য ধরতে শিখুন।'),

  (8,  2, 'Map & Diagram Labelling from Audio',
       'অডিও থেকে মানচিত্র ও ডায়াগ্রাম লেবেলিং',
       3, 'PRACTICE',
       'শোনা তথ্য ব্যবহার করে মানচিত্রে স্থান চিহ্নিত করা ও ডায়াগ্রামে লেবেল দেওয়ার অনুশীলন করুন।'),

  (9,  2, 'Listening Sections 2 & 3 Mock Test',
       'লিসেনিং সেকশন ২ ও ৩ মক টেস্ট',
       4, 'TEST',
       'সেকশন ২ (মনোলগ) ও সেকশন ৩ (গ্রুপ কথোপকথন) স্টাইলে পরীক্ষা দিন।'),

  (10, 2, 'Vocabulary Building — Academic Word List',
       'শব্দভাণ্ডার তৈরি — একাডেমিক শব্দ তালিকা',
       5, 'REVIEW',
       'এই অধ্যায়ের কঠিন শব্দগুলো পুনরায় অনুশীলন করুন এবং একাডেমিক শব্দভাণ্ডার বাড়ান।'),


  -- ════════════════════════════════════════════════════════════
  -- CHAPTER 3: Advanced Listening
  -- ════════════════════════════════════════════════════════════
  (11, 3, 'Following Academic Lectures',
       'একাডেমিক লেকচার অনুসরণ',
       1, 'LEARN',
       'বিজ্ঞান, ইতিহাস ও পরিবেশ বিষয়ক লেকচার শুনে মূল যুক্তি, উদাহরণ ও উপসংহার ধরতে শিখুন।'),

  (12, 3, 'Multiple Speakers — Group Discussion Skills',
       'একাধিক বক্তা — গ্রুপ আলোচনা দক্ষতা',
       2, 'LEARN',
       'একাধিক বক্তার কণ্ঠস্বর আলাদা করে চিনতে এবং তাদের মতামত ও যুক্তি বুঝতে শিখুন।'),

  (13, 3, 'Note Completion & Summary Practice',
       'নোট পূরণ ও সারাংশ অনুশীলন',
       3, 'PRACTICE',
       'দীর্ঘ লেকচার থেকে নোট নেওয়া ও সারাংশ পূরণের অনুশীলন করুন।'),

  (14, 3, 'Full Listening Mock Test (All 4 Sections)',
       'সম্পূর্ণ লিসেনিং মক টেস্ট (৪টি সেকশন)',
       4, 'TEST',
       'চারটি সেকশনসহ একটি সম্পূর্ণ আইইএলটিএস লিসেনিং পরীক্ষা দিন এবং সময় ব্যবস্থাপনা অনুশীলন করুন।'),


  -- ════════════════════════════════════════════════════════════
  -- CHAPTER 4: Reading Essentials
  -- ════════════════════════════════════════════════════════════
  (15, 4, 'Skimming — Finding the Main Idea Fast',
       'স্কিমিং — দ্রুত মূল ভাব খোঁজা',
       1, 'LEARN',
       'প্রতিটি অনুচ্ছেদের মূল ভাব দ্রুত বের করার কৌশল শিখুন। টপিক সেনটেন্স ও কী-ওয়ার্ড চেনার অনুশীলন।'),

  (16, 4, 'Scanning — Locating Specific Information',
       'স্ক্যানিং — নির্দিষ্ট তথ্য খুঁজে বের করা',
       2, 'LEARN',
       'সংখ্যা, নাম, তারিখ ও বিশেষ শব্দ দ্রুত খুঁজে বের করার স্ক্যানিং কৌশল আয়ত্ত করুন।'),

  (17, 4, 'Vocabulary in Context — Synonyms & Paraphrasing',
       'প্রসঙ্গে শব্দভাণ্ডার — সমার্থক শব্দ ও প্যারাফ্রেজিং',
       3, 'PRACTICE',
       'আইইএলটিএস রিডিং-এ সবচেয়ে গুরুত্বপূর্ণ দক্ষতা — প্রশ্নের শব্দ ও প্যাসেজের সমার্থক শব্দ মেলানোর অনুশীলন করুন।'),

  (18, 4, 'Timed Reading Practice — Short Passages',
       'সময়ভিত্তিক পঠন অনুশীলন — ছোট প্যাসেজ',
       4, 'TEST',
       'ছোট প্যাসেজ পড়ে সময়ের মধ্যে প্রশ্নের উত্তর দেওয়ার পরীক্ষা দিন।'),

  (19, 4, 'Word Families & Collocations Review',
       'শব্দ পরিবার ও কলোকেশন পুনর্মূল্যায়ন',
       5, 'REVIEW',
       'এই অধ্যায়ের শব্দ পরিবার (noun, verb, adjective, adverb ফর্ম) ও সাধারণ কলোকেশন পুনরায় অনুশীলন করুন।'),


  -- ════════════════════════════════════════════════════════════
  -- CHAPTER 5: Reading Mastery — Question Types
  -- ════════════════════════════════════════════════════════════
  (20, 5, 'True / False / Not Given — Strategy & Practice',
       'সত্য / মিথ্যা / উল্লেখ নেই — কৌশল ও অনুশীলন',
       1, 'LEARN',
       'আইইএলটিএস রিডিং-এর সবচেয়ে কঠিন প্রশ্নের ধরন — True/False/Not Given বোঝার কৌশল শিখুন।'),

  (21, 5, 'Matching Headings & Information',
       'শিরোনাম ও তথ্য মেলানো',
       2, 'LEARN',
       'অনুচ্ছেদের সাথে সঠিক শিরোনাম মেলানো এবং নির্দিষ্ট তথ্য কোন প্যারাগ্রাফে আছে খুঁজে বের করার কৌশল শিখুন।'),

  (22, 5, 'Sentence & Summary Completion',
       'বাক্য ও সারাংশ পূরণ',
       3, 'PRACTICE',
       'প্যাসেজ থেকে সঠিক শব্দ বেছে বাক্য ও সারাংশ পূরণ করার অনুশীলন করুন।'),

  (23, 5, 'Mixed Question Types — Full Passage Practice',
       'মিশ্র প্রশ্নের ধরন — সম্পূর্ণ প্যাসেজ অনুশীলন',
       4, 'TEST',
       'একটি সম্পূর্ণ প্যাসেজে বিভিন্ন ধরনের প্রশ্ন মিলিয়ে পরীক্ষা দিন।'),

  (24, 5, 'Common Traps & Mistakes Review',
       'সাধারণ ফাঁদ ও ভুলের পুনর্মূল্যায়ন',
       5, 'REVIEW',
       'আইইএলটিএস রিডিং-এ বাংলাদেশি শিক্ষার্থীদের সবচেয়ে সাধারণ ভুলগুলো চিহ্নিত করুন এবং সেগুলো এড়ানোর উপায় শিখুন।'),


  -- ════════════════════════════════════════════════════════════
  -- CHAPTER 6: Academic Reading — Complex Texts
  -- ════════════════════════════════════════════════════════════
  (25, 6, 'Reading About Science & Technology',
       'বিজ্ঞান ও প্রযুক্তি বিষয়ক পঠন',
       1, 'LEARN',
       'কৃত্রিম বুদ্ধিমত্তা, মহাকাশ গবেষণা ও চিকিৎসা বিজ্ঞান সংক্রান্ত একাডেমিক প্যাসেজ পড়ে মূল যুক্তি বুঝতে শিখুন।'),

  (26, 6, 'Reading About Society & Environment',
       'সমাজ ও পরিবেশ বিষয়ক পঠন',
       2, 'LEARN',
       'নগরায়ণ, জলবায়ু পরিবর্তন ও সামাজিক সমস্যা নিয়ে দীর্ঘ প্যাসেজ পড়ে লেখকের মতামত ও ইঙ্গিত বুঝতে শিখুন।'),

  (27, 6, 'Inference & Logical Reasoning Practice',
       'অনুমান ও যৌক্তিক বিচার অনুশীলন',
       3, 'PRACTICE',
       'প্যাসেজে সরাসরি না বলা তথ্য বুঝতে অনুমান ক্ষমতা ও যৌক্তিক বিচার দক্ষতার অনুশীলন করুন।'),

  (28, 6, 'Full Academic Reading Mock Test (3 Passages)',
       'সম্পূর্ণ একাডেমিক রিডিং মক টেস্ট (৩টি প্যাসেজ)',
       4, 'TEST',
       '৬০ মিনিটে ৩টি প্যাসেজ পড়ে ৪০টি প্রশ্নের উত্তর দেওয়ার পূর্ণাঙ্গ মক টেস্ট দিন।'),


  -- ════════════════════════════════════════════════════════════
  -- CHAPTER 7: Speaking Foundations — Part 1
  -- ════════════════════════════════════════════════════════════
  (29, 7, 'Introducing Yourself — Home, Studies & Work',
       'নিজের পরিচয় — বাড়ি, পড়াশোনা ও কাজ',
       1, 'LEARN',
       'আইইএলটিএস স্পিকিং পার্ট ১-এর সবচেয়ে সাধারণ প্রশ্নগুলোর উত্তর দেওয়ার কৌশল শিখুন — বাড়ি, শহর, পড়াশোনা ও চাকরি নিয়ে।'),

  (30, 7, 'Talking About Interests — Hobbies, Food & Travel',
       'আগ্রহ সম্পর্কে কথা বলা — শখ, খাবার ও ভ্রমণ',
       2, 'LEARN',
       'আপনার শখ, প্রিয় খাবার, ভ্রমণের অভিজ্ঞতা ও অবসর সময়ের কাজ নিয়ে সাবলীলভাবে কথা বলার অনুশীলন করুন।'),

  (31, 7, 'Pronunciation Clinic — Common Errors for Bangla Speakers',
       'উচ্চারণ ক্লিনিক — বাংলাভাষীদের সাধারণ ভুল',
       3, 'PRACTICE',
       'বাংলাভাষীদের ইংরেজি উচ্চারণে সবচেয়ে সাধারণ ভুলগুলো (th, v/w, r/l, word stress) সংশোধন করুন।'),

  (32, 7, 'Part 1 Speaking Mock Interview',
       'পার্ট ১ স্পিকিং মক ইন্টারভিউ',
       4, 'TEST',
       '৪-৫ মিনিটের একটি পূর্ণাঙ্গ পার্ট ১ স্পিকিং মক ইন্টারভিউ দিন এবং AI থেকে ফিডব্যাক নিন।'),

  (33, 7, 'Fluency & Coherence Review',
       'সাবলীলতা ও সামঞ্জস্যতা পুনর্মূল্যায়ন',
       5, 'REVIEW',
       'আপনার কথা বলার সাবলীলতা, সংযোগকারী শব্দের ব্যবহার ও উত্তরের কাঠামো পুনর্মূল্যায়ন করুন।'),


  -- ════════════════════════════════════════════════════════════
  -- CHAPTER 8: Speaking Mastery — Parts 2 & 3
  -- ════════════════════════════════════════════════════════════
  (34, 8, 'Cue Card Mastery — How to Structure a 2-Minute Talk',
       'কিউ কার্ড দক্ষতা — ২ মিনিটের বক্তৃতা কাঠামো',
       1, 'LEARN',
       'আইইএলটিএস স্পিকিং পার্ট ২-এর কিউ কার্ড দেখে ১ মিনিটে প্রস্তুতি নিয়ে ২ মিনিট কথা বলার কৌশল শিখুন।'),

  (35, 8, 'Describing People, Places & Experiences',
       'মানুষ, স্থান ও অভিজ্ঞতা বর্ণনা করা',
       2, 'PRACTICE',
       'বিভিন্ন কিউ কার্ড টপিক (একজন মানুষ, একটি স্থান, একটি ঘটনা, একটি বস্তু) নিয়ে ২ মিনিটের বক্তৃতা অনুশীলন করুন।'),

  (36, 8, 'Part 3 — Expressing Opinions & Abstract Ideas',
       'পার্ট ৩ — মতামত ও বিমূর্ত ধারণা প্রকাশ',
       3, 'PRACTICE',
       'পার্ট ৩-এর গভীর আলোচনার জন্য প্রস্তুত হোন — তুলনা করা, সুবিধা-অসুবিধা বলা, ভবিষ্যৎ নিয়ে মতামত দেওয়া শিখুন।'),

  (37, 8, 'Full Speaking Mock Test (Parts 1 + 2 + 3)',
       'সম্পূর্ণ স্পিকিং মক টেস্ট (পার্ট ১ + ২ + ৩)',
       4, 'TEST',
       '১১-১৪ মিনিটের একটি পূর্ণাঙ্গ আইইএলটিএস স্পিকিং পরীক্ষা দিন — তিনটি পার্ট একসাথে। AI এক্সামিনারের কাছ থেকে ব্যান্ড স্কোর ও ফিডব্যাক নিন।')

ON CONFLICT (id) DO UPDATE SET
  chapter_id   = EXCLUDED.chapter_id,
  title        = EXCLUDED.title,
  title_bn     = EXCLUDED.title_bn,
  order_num    = EXCLUDED.order_num,
  type         = EXCLUDED.type,
  objective_bn = EXCLUDED.objective_bn;


-- ─────────────────────────────────────────────────────────────
-- 3. PHRASES  (Realistic speaking prompts & listening sentences)
-- ─────────────────────────────────────────────────────────────

DELETE FROM lesson_phrases;
DELETE FROM phrases;

INSERT INTO phrases (id, phrase_en, phrase_bn, difficulty) VALUES
  -- ── Beginner (Chapters 1 & 7) ──
  (1,  'Hello, my name is Rahim and I come from Dhaka.',
       'হ্যালো, আমার নাম রহিম এবং আমি ঢাকা থেকে এসেছি।', 'BEGINNER'),
  (2,  'Could you spell your surname for me, please?',
       'আপনার পদবি বানান করে বলবেন, প্লিজ?', 'BEGINNER'),
  (3,  'The appointment is at half past ten on Monday morning.',
       'অ্যাপয়েন্টমেন্টটি সোমবার সকাল সাড়ে দশটায়।', 'BEGINNER'),
  (4,  'I live in a small apartment near the city centre.',
       'আমি শহরের কেন্দ্রের কাছে একটি ছোট অ্যাপার্টমেন্টে থাকি।', 'BEGINNER'),
  (5,  'I usually take the bus to my university every day.',
       'আমি সাধারণত প্রতিদিন বাসে করে বিশ্ববিদ্যালয়ে যাই।', 'BEGINNER'),
  (6,  'My favourite hobby is reading novels and playing cricket.',
       'আমার প্রিয় শখ হলো উপন্যাস পড়া এবং ক্রিকেট খেলা।', 'BEGINNER'),

  -- ── Intermediate (Chapters 2, 4, 5) ──
  (7,  'The library is open from nine a.m. to eight p.m. on weekdays.',
       'লাইব্রেরি সপ্তাহের দিনগুলোতে সকাল ৯টা থেকে রাত ৮টা পর্যন্ত খোলা।', 'INTERMEDIATE'),
  (8,  'Students who wish to enrol must complete the registration form online.',
       'যে শিক্ষার্থীরা ভর্তি হতে চান তাদের অনলাইনে রেজিস্ট্রেশন ফর্ম পূরণ করতে হবে।', 'INTERMEDIATE'),
  (9,  'The main advantage of public transport is that it reduces traffic congestion.',
       'গণপরিবহনের প্রধান সুবিধা হলো এটি যানজট কমায়।', 'INTERMEDIATE'),
  (10, 'According to the passage, deforestation has led to a significant loss of biodiversity.',
       'প্যাসেজ অনুযায়ী, বন উজাড় জীববৈচিত্র্যের উল্লেখযোগ্য ক্ষতি করেছে।', 'INTERMEDIATE'),
  (11, 'You should always skim the passage first before attempting the questions.',
       'প্রশ্নের উত্তর দেওয়ার আগে সবসময় প্যাসেজটি প্রথমে স্কিম করা উচিত।', 'INTERMEDIATE'),
  (12, 'In my hometown, the weather is usually hot and humid during the summer.',
       'আমার শহরে গ্রীষ্মকালে আবহাওয়া সাধারণত গরম ও আর্দ্র থাকে।', 'INTERMEDIATE'),
  (13, 'I would describe my best friend as someone who is reliable and kind-hearted.',
       'আমি আমার সেরা বন্ধুকে একজন নির্ভরযোগ্য ও দয়ালু মানুষ হিসেবে বর্ণনা করব।', 'INTERMEDIATE'),
  (14, 'The seminar will be held in the main auditorium on the ground floor.',
       'সেমিনারটি নিচতলার মূল অডিটোরিয়ামে অনুষ্ঠিত হবে।', 'INTERMEDIATE'),

  -- ── Advanced (Chapters 3, 6, 8) ──
  (15, 'Research suggests that urbanisation has both positive and negative impacts on public health.',
       'গবেষণায় দেখা গেছে যে নগরায়ণ জনস্বাস্থ্যের ওপর ইতিবাচক ও নেতিবাচক উভয় প্রভাব ফেলে।', 'ADVANCED'),
  (16, 'While some argue that technology isolates individuals, others believe it strengthens global connections.',
       'কেউ কেউ মনে করেন প্রযুক্তি ব্যক্তিকে একা করে দেয়, আবার অন্যরা বিশ্বাস করেন এটি বৈশ্বিক সংযোগ শক্তিশালী করে।', 'ADVANCED'),
  (17, 'The lecturer emphasised that climate change is the most pressing issue of our generation.',
       'প্রভাষক জোর দিয়ে বলেছিলেন যে জলবায়ু পরিবর্তন আমাদের প্রজন্মের সবচেয়ে জরুরি সমস্যা।', 'ADVANCED'),
  (18, 'I would like to describe an experience that had a profound impact on my perspective.',
       'আমি এমন একটি অভিজ্ঞতা বর্ণনা করতে চাই যা আমার দৃষ্টিভঙ্গিতে গভীর প্রভাব ফেলেছিল।', 'ADVANCED'),
  (19, 'In conclusion, the evidence clearly demonstrates that renewable energy is both feasible and necessary.',
       'উপসংহারে, প্রমাণ স্পষ্টভাবে দেখায় যে নবায়নযোগ্য শক্তি সম্ভব এবং প্রয়োজনীয় উভয়ই।', 'ADVANCED'),
  (20, 'Comparing the two approaches, I believe the community-based model is more sustainable in the long run.',
       'দুটি পদ্ধতির তুলনা করলে, আমি মনে করি সম্প্রদায়ভিত্তিক মডেলটি দীর্ঘমেয়াদে বেশি টেকসই।', 'ADVANCED'),
  (21, 'One of the significant challenges facing developing countries is the lack of access to quality education.',
       'উন্নয়নশীল দেশগুলোর সম্মুখীন একটি উল্লেখযোগ্য চ্যালেঞ্জ হলো মানসম্মত শিক্ষায় প্রবেশাধিকারের অভাব।', 'ADVANCED'),
  (22, 'To be honest, I had never really thought about that before, but if I had to give my opinion, I would say...',
       'সত্যি বলতে, আমি আগে কখনো এই বিষয়ে ভাবিনি, তবে আমাকে মতামত দিতে হলে আমি বলব...', 'ADVANCED')
ON CONFLICT (id) DO UPDATE SET
  phrase_en  = EXCLUDED.phrase_en,
  phrase_bn  = EXCLUDED.phrase_bn,
  difficulty = EXCLUDED.difficulty;


-- ─────────────────────────────────────────────────────────────
-- 4. LESSON ↔ PHRASE LINKS
-- ─────────────────────────────────────────────────────────────

-- Ch1 lessons (Listening Foundations)
INSERT INTO lesson_phrases (lesson_id, phrase_id) VALUES
  (1, 1), (1, 2), (1, 3),        -- Lesson 1: names, numbers, dates
  (2, 4), (2, 5),                 -- Lesson 2: everyday dialogues
  (3, 1), (3, 2), (3, 3), (3, 4), (3, 5),  -- Lesson 3: practice (gap-fill)
  (4, 1), (4, 2), (4, 3), (4, 4), (4, 5), (4, 6)  -- Lesson 4: test
ON CONFLICT DO NOTHING;

-- Ch2 lessons (Listening in Context)
INSERT INTO lesson_phrases (lesson_id, phrase_id) VALUES
  (6, 7), (6, 8), (6, 14),       -- Lesson 6: campus talks
  (7, 7), (7, 14),               -- Lesson 7: instructions
  (8, 7), (8, 8), (8, 14),       -- Lesson 8: map labelling practice
  (9, 7), (9, 8), (9, 9), (9, 14)  -- Lesson 9: test
ON CONFLICT DO NOTHING;

-- Ch3 lessons (Advanced Listening)
INSERT INTO lesson_phrases (lesson_id, phrase_id) VALUES
  (11, 15), (11, 17),            -- Lesson 11: academic lectures
  (12, 15), (12, 16),            -- Lesson 12: multiple speakers
  (13, 15), (13, 17), (13, 19),  -- Lesson 13: note completion practice
  (14, 15), (14, 16), (14, 17), (14, 19)  -- Lesson 14: test
ON CONFLICT DO NOTHING;

-- Ch7 lessons (Speaking Foundations)
INSERT INTO lesson_phrases (lesson_id, phrase_id) VALUES
  (29, 1), (29, 4), (29, 5),     -- Lesson 29: introducing yourself
  (30, 6), (30, 12),             -- Lesson 30: hobbies, food, travel
  (31, 1), (31, 4), (31, 5), (31, 6), (31, 12),  -- Lesson 31: pronunciation clinic
  (32, 1), (32, 4), (32, 5), (32, 6), (32, 12), (32, 13)  -- Lesson 32: mock interview
ON CONFLICT DO NOTHING;

-- Ch8 lessons (Speaking Mastery)
INSERT INTO lesson_phrases (lesson_id, phrase_id) VALUES
  (34, 18), (34, 13),            -- Lesson 34: cue card structure
  (35, 13), (35, 18),            -- Lesson 35: describing people/places
  (36, 16), (36, 20), (36, 21), (36, 22),  -- Lesson 36: Part 3 opinions
  (37, 13), (37, 16), (37, 18), (37, 20), (37, 21), (37, 22)  -- Lesson 37: full mock
ON CONFLICT DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- 5. TESTS  (one test per TEST-type lesson)
-- ─────────────────────────────────────────────────────────────

DELETE FROM test_attempts;
DELETE FROM pronunciation_attempts;
DELETE FROM test_progress;
DELETE FROM test_questions;
DELETE FROM tests;

INSERT INTO tests (id, lesson_id, title, skill_type, difficulty_level, total_marks, time_limit_seconds) VALUES
  -- Listening tests
  (1,  4,  'Listening Section 1 — Everyday Conversation Test',  'LISTENING', 1, 10, 600),
  (2,  9,  'Listening Sections 2 & 3 — Contextual Listening Test', 'LISTENING', 3, 20, 900),
  (3,  14, 'Full IELTS Listening Practice Test',                 'LISTENING', 5, 40, 1800),

  -- Reading tests
  (4,  18, 'Reading Essentials — Short Passage Test',            'READING', 2, 13, 1200),
  (5,  23, 'Reading Question Types — Mixed Format Test',         'READING', 4, 13, 1200),
  (6,  28, 'Full Academic Reading Mock Test',                    'READING', 5, 40, 3600),

  -- Speaking tests
  (7,  32, 'Speaking Part 1 — Personal Interview Test',          'SPEAKING', 2, 25, 300),
  (8,  37, 'Full Speaking Mock Test (Parts 1 + 2 + 3)',          'SPEAKING', 5, 25, 840)
ON CONFLICT (id) DO UPDATE SET
  title         = EXCLUDED.title,
  skill_type    = EXCLUDED.skill_type,
  difficulty_level = EXCLUDED.difficulty_level,
  total_marks   = EXCLUDED.total_marks,
  time_limit_seconds = EXCLUDED.time_limit_seconds;


-- ─────────────────────────────────────────────────────────────
-- 6. TEST QUESTIONS (sample questions per test)
-- ─────────────────────────────────────────────────────────────

-- ═══ Test 1: Listening Section 1 ═══
INSERT INTO test_questions (test_id, question_text, question_text_bn, question_type, options, correct_answer, marks, order_num, difficulty_level)
VALUES
  (1, 'What is the caller''s surname?',
      'কলকারীর পদবি কী?',
      'SHORT ANSWER', '[]', '"Rahman"', 1, 1, 1),

  (1, 'The appointment is scheduled for ___.',
      'অ্যাপয়েন্টমেন্টের সময় হলো ___।',
      'GAP FILLING', '[]', '"10:30 AM Monday"', 1, 2, 1),

  (1, 'What is the caller''s contact number?',
      'কলকারীর যোগাযোগ নম্বর কত?',
      'SHORT ANSWER', '[]', '"01712345678"', 1, 3, 1),

  (1, 'The caller lives near which area?',
      'কলকারী কোন এলাকার কাছে থাকেন?',
      'MCQ',
      '["Gulshan", "Dhanmondi", "Mirpur", "Uttara"]',
      '"Dhanmondi"', 1, 4, 1),

  (1, 'The purpose of the call is to book a ___.',
      'কলের উদ্দেশ্য হলো একটি ___ বুক করা।',
      'GAP FILLING', '[]', '"doctor''s appointment"', 1, 5, 1),

  (1, 'True or False: The clinic is open on Sundays.',
      'সত্য না মিথ্যা: ক্লিনিকটি রবিবারে খোলা থাকে।',
      'TRUE/FALSE', '["True", "False"]', '"False"', 1, 6, 1),

  (1, 'The caller needs to bring a ___ and their ___ to the appointment.',
      'কলকারীকে অ্যাপয়েন্টমেন্টে একটি ___ এবং তাদের ___ আনতে হবে।',
      'GAP FILLING', '[]', '"photo ID, insurance card"', 1, 7, 1),

  (1, 'How long has the caller been experiencing the problem?',
      'কলকারী কতদিন ধরে সমস্যাটি অনুভব করছেন?',
      'MCQ',
      '["2 days", "1 week", "2 weeks", "1 month"]',
      '"2 weeks"', 1, 8, 1),

  (1, 'What is the name of the doctor the caller will see?',
      'কলকারী কোন ডাক্তারের কাছে যাবেন?',
      'SHORT ANSWER', '[]', '"Dr. Hasan"', 1, 9, 1),

  (1, 'The clinic is located on ___ Road.',
      'ক্লিনিকটি ___ রোডে অবস্থিত।',
      'GAP FILLING', '[]', '"Green"', 1, 10, 1);


-- ═══ Test 2: Listening Sections 2 & 3 ═══
INSERT INTO test_questions (test_id, question_text, question_text_bn, question_type, options, correct_answer, marks, order_num, difficulty_level)
VALUES
  (2, 'The library is located on which floor of the main building?',
      'লাইব্রেরি মূল ভবনের কোন তলায় অবস্থিত?',
      'MCQ', '["Ground floor", "First floor", "Second floor", "Third floor"]',
      '"Second floor"', 1, 1, 3),

  (2, 'The maximum number of books a student can borrow at one time is ___.',
      'একজন শিক্ষার্থী একবারে সর্বোচ্চ ___ টি বই ধার নিতে পারেন।',
      'GAP FILLING', '[]', '"6"', 1, 2, 3),

  (2, 'Students must return borrowed books within ___ days.',
      'শিক্ষার্থীদের ধার নেওয়া বই ___ দিনের মধ্যে ফেরত দিতে হবে।',
      'GAP FILLING', '[]', '"14"', 1, 3, 3),

  (2, 'True or False: The library offers free printing for all students.',
      'সত্য না মিথ্যা: লাইব্রেরি সব শিক্ষার্থীদের জন্য বিনামূল্যে প্রিন্টিং সেবা দেয়।',
      'TRUE/FALSE', '["True", "False"]', '"False"', 1, 4, 3),

  (2, 'To access the online journal database, students need their ___ and ___.',
      'অনলাইন জার্নাল ডাটাবেসে প্রবেশ করতে শিক্ষার্থীদের ___ এবং ___ প্রয়োজন।',
      'GAP FILLING', '[]', '"student ID, password"', 1, 5, 3),

  (2, 'In the group discussion, Sarah argues that online learning is ___.',
      'গ্রুপ আলোচনায়, সারাহ যুক্তি দেন যে অনলাইন শিক্ষা ___ ।',
      'MCQ',
      '["more flexible than traditional classes", "completely ineffective", "only suitable for advanced students", "too expensive"]',
      '"more flexible than traditional classes"', 1, 6, 3),

  (2, 'Michael disagrees because he believes students need ___ interaction.',
      'মাইকেল একমত নন কারণ তিনি মনে করেন শিক্ষার্থীদের ___ মিথস্ক্রিয়া প্রয়োজন।',
      'GAP FILLING', '[]', '"face-to-face"', 1, 7, 3),

  (2, 'The tutor suggests that a ___ approach would be the most effective solution.',
      'টিউটর পরামর্শ দেন যে একটি ___ পদ্ধতি সবচেয়ে কার্যকর সমাধান হবে।',
      'MCQ',
      '["blended", "online-only", "lecture-based", "self-study"]',
      '"blended"', 1, 8, 3),

  (2, 'What percentage of students in the survey preferred online classes?',
      'সমীক্ষায় কত শতাংশ শিক্ষার্থী অনলাইন ক্লাস পছন্দ করেছে?',
      'SHORT ANSWER', '[]', '"42%"', 1, 9, 3),

  (2, 'The group must submit their research project by the end of ___.',
      'গ্রুপকে ___ শেষের মধ্যে তাদের গবেষণা প্রকল্প জমা দিতে হবে।',
      'GAP FILLING', '[]', '"November"', 1, 10, 3);


-- ═══ Test 4: Reading Short Passage ═══
INSERT INTO test_questions (test_id, question_text, question_text_bn, question_type, options, correct_answer, marks, order_num, difficulty_level)
VALUES
  (4, 'What is the main topic of the passage?',
      'প্যাসেজের মূল বিষয় কী?',
      'MCQ',
      '["The history of public transport", "Benefits of cycling in cities", "Environmental pollution in Dhaka", "Modern architecture trends"]',
      '"Benefits of cycling in cities"', 1, 1, 2),

  (4, 'According to the passage, cycling reduces ___ by up to 50%.',
      'প্যাসেজ অনুসারে, সাইক্লিং ___ ৫০% পর্যন্ত কমায়।',
      'GAP FILLING', '[]', '"carbon emissions"', 1, 2, 2),

  (4, 'True or False: The author states that cycling infrastructure costs more than road expansion.',
      'সত্য না মিথ্যা: লেখক বলেছেন যে সাইক্লিং অবকাঠামো রাস্তা সম্প্রসারণের চেয়ে বেশি খরচ হয়।',
      'TRUE/FALSE', '["True", "False"]', '"False"', 1, 3, 2),

  (4, 'The word "feasible" in paragraph 2 is closest in meaning to ___.',
      'অনুচ্ছেদ ২-এ "feasible" শব্দের অর্থ ___ এর সবচেয়ে কাছাকাছি।',
      'MCQ',
      '["expensive", "practical", "dangerous", "temporary"]',
      '"practical"', 1, 4, 2),

  (4, 'List TWO health benefits of cycling mentioned in the passage.',
      'প্যাসেজে উল্লিখিত সাইক্লিংয়ের দুটি স্বাস্থ্য উপকারিতা লিখুন।',
      'SHORT ANSWER', '[]', '"improved cardiovascular health, reduced stress levels"', 1, 5, 2),

  (4, 'The city of Amsterdam is mentioned as an example of ___.',
      'আমস্টারডাম শহরকে ___ এর উদাহরণ হিসেবে উল্লেখ করা হয়েছে।',
      'GAP FILLING', '[]', '"successful cycling infrastructure"', 1, 6, 2),

  (4, 'Which paragraph discusses the economic impact of cycling?',
      'কোন অনুচ্ছেদে সাইক্লিংয়ের অর্থনৈতিক প্রভাব আলোচনা করা হয়েছে?',
      'MCQ', '["Paragraph 1", "Paragraph 2", "Paragraph 3", "Paragraph 4"]',
      '"Paragraph 3"', 1, 7, 2);


-- ═══ Test 5: Reading Mixed Format ═══
INSERT INTO test_questions (test_id, question_text, question_text_bn, question_type, options, correct_answer, marks, order_num, difficulty_level)
VALUES
  (5, 'The passage states that social media has transformed the way people communicate. — True / False / Not Given',
      'প্যাসেজে বলা হয়েছে যে সোশ্যাল মিডিয়া মানুষের যোগাযোগের পদ্ধতি পরিবর্তন করেছে। — সত্য / মিথ্যা / উল্লেখ নেই',
      'TRUE/FALSE', '["True", "False", "Not Given"]', '"True"', 1, 1, 4),

  (5, 'The author claims that face-to-face communication is becoming obsolete. — True / False / Not Given',
      'লেখক দাবি করেন যে সামনাসামনি যোগাযোগ অচল হয়ে যাচ্ছে। — সত্য / মিথ্যা / উল্লেখ নেই',
      'TRUE/FALSE', '["True", "False", "Not Given"]', '"Not Given"', 1, 2, 4),

  (5, 'Match the correct heading for Paragraph A:',
      'অনুচ্ছেদ A-এর জন্য সঠিক শিরোনাম মেলান:',
      'MCQ',
      '["The Rise of Digital Communication", "Traditional Media in Decline", "Government Regulation of Internet", "History of Postal Services"]',
      '"The Rise of Digital Communication"', 1, 3, 4),

  (5, 'Complete the sentence: Research conducted in 2023 revealed that ___ percent of teenagers spend more than 3 hours daily on social platforms.',
      'বাক্যটি পূরণ করুন: ২০২৩ সালে পরিচালিত গবেষণায় দেখা গেছে যে ___ শতাংশ কিশোর প্রতিদিন ৩ ঘণ্টার বেশি সোশ্যাল প্ল্যাটফর্মে সময় কাটায়।',
      'GAP FILLING', '[]', '"67"', 1, 4, 4),

  (5, 'According to the author, the most significant negative impact of social media is ___.',
      'লেখকের মতে, সোশ্যাল মিডিয়ার সবচেয়ে উল্লেখযোগ্য নেতিবাচক প্রভাব হলো ___।',
      'MCQ',
      '["addiction to screens", "decline in mental health among youth", "spread of misinformation", "loss of traditional values"]',
      '"decline in mental health among youth"', 1, 5, 4),

  (5, 'In which paragraph does the author discuss potential solutions?',
      'কোন অনুচ্ছেদে লেখক সম্ভাব্য সমাধান আলোচনা করেছেন?',
      'MCQ', '["Paragraph B", "Paragraph C", "Paragraph D", "Paragraph E"]',
      '"Paragraph D"', 1, 6, 4),

  (5, 'The word "detrimental" in the passage can be replaced by ___.',
      'প্যাসেজে "detrimental" শব্দটি ___ দ্বারা প্রতিস্থাপন করা যায়।',
      'MCQ', '["beneficial", "harmful", "neutral", "surprising"]',
      '"harmful"', 1, 7, 4);


-- ═══ Test 7: Speaking Part 1 (Spoken prompts) ═══
INSERT INTO test_questions (test_id, question_text, question_text_bn, question_type, marks, order_num, difficulty_level)
VALUES
  (7, 'Tell me about your hometown. What do you like about it?',
      'আপনার শহর সম্পর্কে বলুন। এটির কোন বিষয়টি আপনার পছন্দ?',
      'SPOKEN PROMPT', 5, 1, 2),

  (7, 'Do you work or are you a student? Describe what you do.',
      'আপনি কি চাকরি করেন নাকি পড়াশোনা করেন? আপনি কী করেন বর্ণনা করুন।',
      'SPOKEN PROMPT', 5, 2, 2),

  (7, 'What kind of food do you enjoy? Do you prefer home-cooked meals or restaurant food?',
      'আপনি কোন ধরনের খাবার পছন্দ করেন? আপনি ঘরে রান্না করা খাবার পছন্দ করেন নাকি রেস্তোরাঁর খাবার?',
      'SPOKEN PROMPT', 5, 3, 2),

  (7, 'How do you usually spend your weekends?',
      'আপনি সাধারণত সাপ্তাহিক ছুটি কীভাবে কাটান?',
      'SPOKEN PROMPT', 5, 4, 2),

  (7, 'Do you think public transport in your city is good? Why or why not?',
      'আপনি কি মনে করেন আপনার শহরের গণপরিবহন ভালো? কেন বা কেন নয়?',
      'SPOKEN PROMPT', 5, 5, 2);


-- ═══ Test 8: Full Speaking (Parts 1 + 2 + 3) ═══
INSERT INTO test_questions (test_id, question_text, question_text_bn, question_type, marks, order_num, difficulty_level)
VALUES
  -- Part 1 Questions
  (8, 'Let''s talk about where you live. Can you describe your neighbourhood?',
      'আপনি যেখানে থাকেন সে সম্পর্কে বলুন। আপনার পাড়া বর্ণনা করতে পারবেন?',
      'SPOKEN PROMPT', 3, 1, 2),

  (8, 'What do you enjoy doing in your free time?',
      'অবসর সময়ে আপনি কী করতে উপভোগ করেন?',
      'SPOKEN PROMPT', 3, 2, 2),

  -- Part 2 Cue Card
  (8, 'Describe a person who has influenced you greatly. You should say: who this person is, how you know them, what they have done that influenced you, and explain why they had such a strong influence on you. You have 1 minute to prepare and should speak for 1-2 minutes.',
      'এমন একজন ব্যক্তি বর্ণনা করুন যিনি আপনাকে ব্যাপকভাবে প্রভাবিত করেছেন। আপনার বলা উচিত: এই ব্যক্তি কে, আপনি কীভাবে তাকে চেনেন, তিনি কী করেছেন যা আপনাকে প্রভাবিত করেছে, এবং ব্যাখ্যা করুন কেন তার এত শক্তিশালী প্রভাব ছিল। আপনার প্রস্তুতির জন্য ১ মিনিট আছে এবং ১-২ মিনিট কথা বলতে হবে।',
      'SPOKEN PROMPT', 7, 3, 4),

  -- Part 3 Discussion Questions
  (8, 'In general, do you think young people are more influenced by their parents or by their friends? Why?',
      'সাধারণভাবে, আপনি কি মনে করেন তরুণরা তাদের বাবা-মায়ের দ্বারা বেশি প্রভাবিত হয় নাকি বন্ধুদের দ্বারা? কেন?',
      'SPOKEN PROMPT', 4, 4, 4),

  (8, 'How has the role of teachers changed compared to the past?',
      'অতীতের তুলনায় শিক্ষকদের ভূমিকা কীভাবে পরিবর্তিত হয়েছে?',
      'SPOKEN PROMPT', 4, 5, 4),

  (8, 'Some people believe that famous people have too much influence on young people. Do you agree or disagree? Why?',
      'কিছু মানুষ বিশ্বাস করেন যে বিখ্যাত ব্যক্তিরা তরুণদের ওপর অতিরিক্ত প্রভাব ফেলেন। আপনি কি একমত নাকি দ্বিমত? কেন?',
      'SPOKEN PROMPT', 4, 6, 5);


-- ─────────────────────────────────────────────────────────────
-- 7. LESSON ↔ WORD LINKS  (using real word IDs from words table)
--    Each lesson gets 8–15 thematically relevant words.
-- ─────────────────────────────────────────────────────────────

DELETE FROM lesson_words;

-- ════════════════════════════════════════════════════════════
-- CHAPTER 1: Listening Foundations — Everyday Conversations
-- Words: greetings, names, numbers, dates, daily objects
-- ════════════════════════════════════════════════════════════

-- Lesson 1: Catching Key Details — Names, Numbers & Dates
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (3868, 1),  -- name
  (3862, 1),  -- number
  (4523, 1),  -- date
  (3554, 1),  -- time
  (4280, 1),  -- morning
  (4350, 1),  -- phone
  (4641, 1),  -- hello
  (3318, 1),  -- ten
  (3363, 1),  -- eight
  (4404, 1),  -- street
  (3295, 1),  -- sir
  (3868, 1)   -- (duplicate skipped by ON CONFLICT)
ON CONFLICT DO NOTHING;

-- Lesson 2: Everyday Dialogues — Appointments & Enquiries
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (6001, 2),  -- appointment
  (3763, 2),  -- doctor
  (3564, 2),  -- hotel
  (3876, 2),  -- shop
  (4292, 2),  -- buy
  (4155, 2),  -- pay
  (4504, 2),  -- price
  (3852, 2),  -- money
  (4022, 2),  -- open
  (4225, 2),  -- close
  (3307, 2),  -- offer
  (3323, 2)   -- card
ON CONFLICT DO NOTHING;

-- Lesson 3: Listen & Complete — Gap-Fill Practice
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (3868, 3),  -- name
  (3862, 3),  -- number
  (4523, 3),  -- date
  (6001, 3),  -- appointment
  (3763, 3),  -- doctor
  (4350, 3),  -- phone
  (4404, 3),  -- street
  (3852, 3),  -- money
  (4280, 3),  -- morning
  (3375, 3)   -- tomorrow
ON CONFLICT DO NOTHING;

-- Lesson 4: Listening Section 1 Mock Test
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (3868, 4),  -- name
  (3862, 4),  -- number
  (6001, 4),  -- appointment
  (3763, 4),  -- doctor
  (4350, 4),  -- phone
  (4404, 4),  -- street
  (4280, 4),  -- morning
  (3852, 4),  -- money
  (4504, 4),  -- price
  (4022, 4),  -- open
  (4225, 4),  -- close
  (3323, 4)   -- card
ON CONFLICT DO NOTHING;

-- Lesson 5: Error Patterns & Review
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (3554, 5),  -- time
  (3868, 5),  -- name
  (3862, 5),  -- number
  (4523, 5),  -- date
  (6001, 5),  -- appointment
  (4350, 5),  -- phone
  (4404, 5),  -- street
  (4280, 5),  -- morning
  (3943, 5)   -- evening
ON CONFLICT DO NOTHING;


-- ════════════════════════════════════════════════════════════
-- CHAPTER 2: Listening in Context — Academic & Social
-- Words: campus, university, student, library, class, study
-- ════════════════════════════════════════════════════════════

-- Lesson 6: Campus & Orientation Talks
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (4178, 6),  -- university
  (3374, 6),  -- student
  (3953, 6),  -- library
  (4223, 6),  -- class
  (4091, 6),  -- book
  (3607, 6),  -- floor
  (4173, 6),  -- room
  (3331, 6),  -- note
  (4441, 6),  -- study
  (3428, 6)   -- section
ON CONFLICT DO NOTHING;

-- Lesson 7: Understanding Instructions & Announcements
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (4241, 7),  -- question
  (4663, 7),  -- answer
  (3420, 7),  -- message
  (3397, 7),  -- radio
  (3554, 7),  -- time
  (4022, 7),  -- open
  (4225, 7),  -- close
  (3668, 7),  -- right
  (3860, 7),  -- left
  (3335, 7)   -- straight
ON CONFLICT DO NOTHING;

-- Lesson 8: Map & Diagram Labelling from Audio
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (4423, 8),  -- map
  (4259, 8),  -- north
  (4159, 8),  -- south
  (4702, 8),  -- east
  (4382, 8),  -- west
  (3668, 8),  -- right
  (3860, 8),  -- left
  (3335, 8),  -- straight
  (3607, 8),  -- floor
  (4963, 8),  -- door
  (4482, 8),  -- road
  (4404, 8)   -- street
ON CONFLICT DO NOTHING;

-- Lesson 9: Listening Sections 2 & 3 Mock Test
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (4178, 9),  -- university
  (3374, 9),  -- student
  (3953, 9),  -- library
  (4091, 9),  -- book
  (3607, 9),  -- floor
  (4223, 9),  -- class
  (4441, 9),  -- study
  (4173, 9),  -- room
  (3332, 9),  -- percent
  (4171, 9)   -- research
ON CONFLICT DO NOTHING;

-- Lesson 10: Vocabulary Building — Academic Word List
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (3298, 10), -- access
  (3379, 10), -- addition
  (3382, 10), -- association
  (3387, 10), -- conference
  (3310, 10), -- professional
  (3355, 10), -- standard
  (3406, 10), -- content
  (3407, 10), -- credit
  (3349, 10), -- response
  (4171, 10), -- research
  (3341, 10), -- growth
  (4317, 10)  -- development
ON CONFLICT DO NOTHING;


-- ════════════════════════════════════════════════════════════
-- CHAPTER 3: Advanced Listening — Lectures & Discussions
-- Words: academic, research, opinion, argument, environment
-- ════════════════════════════════════════════════════════════

-- Lesson 11: Following Academic Lectures
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (4171, 11), -- research
  (4752, 11), -- evidence
  (4949, 11), -- technology
  (3394, 11), -- population
  (3341, 11), -- growth
  (3362, 11), -- effect
  (4233, 11), -- cause
  (3893, 11), -- government
  (4075, 11), -- health
  (4317, 11), -- development
  (3688, 11), -- impact
  (6658, 11)  -- conclusion
ON CONFLICT DO NOTHING;

-- Lesson 12: Multiple Speakers — Group Discussion Skills
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (3619, 12), -- opinion
  (5047, 12), -- argument
  (3481, 12), -- agree
  (9037, 12), -- disagree
  (4934, 12), -- discuss
  (3975, 12), -- believe
  (4118, 12), -- social
  (3339, 12), -- culture
  (3562, 12), -- global
  (4416, 12)  -- experience
ON CONFLICT DO NOTHING;

-- Lesson 13: Note Completion & Summary Practice
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (4171, 13), -- research
  (3713, 13), -- analysis
  (4752, 13), -- evidence
  (6658, 13), -- conclusion
  (3921, 13), -- therefore
  (3889, 13), -- however
  (4335, 13), -- although
  (3937, 13), -- complex
  (4437, 13), -- process
  (4053, 13)  -- structure
ON CONFLICT DO NOTHING;

-- Lesson 14: Full Listening Mock Test
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (4171, 14), -- research
  (3619, 14), -- opinion
  (5047, 14), -- argument
  (4752, 14), -- evidence
  (6658, 14), -- conclusion
  (3688, 14), -- impact
  (3362, 14), -- effect
  (3921, 14), -- therefore
  (3889, 14), -- however
  (4949, 14), -- technology
  (3394, 14), -- population
  (4075, 14)  -- health
ON CONFLICT DO NOTHING;


-- ════════════════════════════════════════════════════════════
-- CHAPTER 4: Reading Essentials — Skimming, Scanning & Vocab
-- Words: reading strategy vocabulary, synonyms, academic words
-- ════════════════════════════════════════════════════════════

-- Lesson 15: Skimming — Finding the Main Idea Fast
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (4079, 15), -- important
  (4414, 15), -- example
  (3881, 15), -- different
  (4558, 15), -- similar
  (4214, 15), -- probably
  (3889, 15), -- however
  (3371, 15), -- recently
  (4384, 15), -- available
  (4437, 15), -- process
  (4317, 15)  -- development
ON CONFLICT DO NOTHING;

-- Lesson 16: Scanning — Locating Specific Information
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (3862, 16), -- number
  (4523, 16), -- date
  (3868, 16), -- name
  (3332, 16), -- percent
  (4974, 16), -- increase
  (8389, 16), -- decrease
  (3334, 16), -- recent
  (4423, 16), -- particular
  (3428, 16), -- section
  (3427, 16)  -- region
ON CONFLICT DO NOTHING;

-- Lesson 17: Vocabulary in Context — Synonyms & Paraphrasing
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (4079, 17), -- important
  (4558, 17), -- similar
  (3881, 17), -- different
  (3388, 17), -- difference
  (4304, 17), -- advantage
  (4125, 17), -- benefit
  (4047, 17), -- solution
  (3853, 17), -- challenge
  (3638, 17), -- approach
  (4234, 17), -- method
  (4598, 17), -- reduce
  (4287, 17)  -- improve
ON CONFLICT DO NOTHING;

-- Lesson 18: Timed Reading Practice — Short Passages
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (4880, 18), -- transport
  (4974, 18), -- increase
  (4598, 18), -- reduce
  (4075, 18), -- health
  (3362, 18), -- effect
  (4079, 18), -- important
  (4384, 18), -- available
  (3394, 18), -- population
  (3864, 18), -- city
  (4053, 18)  -- structure
ON CONFLICT DO NOTHING;

-- Lesson 19: Word Families & Collocations Review
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (4317, 19), -- development
  (4466, 19), -- develop
  (4974, 19), -- increase
  (8389, 19), -- decrease
  (4287, 19), -- improve
  (4598, 19), -- reduce
  (3361, 19), -- create
  (4079, 19), -- important
  (4558, 19), -- similar
  (3881, 19), -- different
  (3388, 19)  -- difference
ON CONFLICT DO NOTHING;


-- ════════════════════════════════════════════════════════════
-- CHAPTER 5: Reading Mastery — IELTS Question Types
-- Words: T/F/NG terms, matching, completion vocabulary
-- ════════════════════════════════════════════════════════════

-- Lesson 20: True / False / Not Given
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (3319, 20), -- truth
  (4752, 20), -- evidence
  (4499, 20), -- suggest
  (3808, 20), -- explain
  (3975, 20), -- believe
  (3619, 20), -- opinion
  (4335, 20), -- although
  (3409, 20), -- despite
  (3889, 20), -- however
  (4404, 20), -- certainly
  (5261, 20)  -- relevant
ON CONFLICT DO NOTHING;

-- Lesson 21: Matching Headings & Information
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (4414, 21), -- example
  (3873, 21), -- purpose
  (4322, 21), -- function
  (4053, 21), -- structure
  (3428, 21), -- section
  (4437, 21), -- process
  (4079, 21), -- important
  (3362, 21), -- effect
  (4233, 21), -- cause
  (5261, 21)  -- relevant
ON CONFLICT DO NOTHING;

-- Lesson 22: Sentence & Summary Completion
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (4974, 22), -- increase
  (8389, 22), -- decrease
  (4598, 22), -- reduce
  (4287, 22), -- improve
  (4317, 22), -- development
  (4171, 22), -- research
  (4752, 22), -- evidence
  (4047, 22), -- solution
  (3853, 22), -- challenge
  (4118, 22)  -- social
ON CONFLICT DO NOTHING;

-- Lesson 23: Mixed Question Types — Full Passage Practice
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (4949, 23), -- technology
  (4118, 23), -- social
  (4334, 23), -- influence
  (3688, 23), -- impact
  (4146, 23), -- generation
  (3371, 23), -- recently
  (3937, 23), -- complex
  (6216, 23), -- contrast
  (6285, 23), -- compare
  (3921, 23), -- therefore
  (3889, 23), -- however
  (7896, 23)  -- furthermore
ON CONFLICT DO NOTHING;

-- Lesson 24: Common Traps & Mistakes Review
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (3319, 24), -- truth
  (4558, 24), -- similar
  (3881, 24), -- different
  (3388, 24), -- difference
  (4335, 24), -- although
  (3409, 24), -- despite
  (3889, 24), -- however
  (3371, 24), -- recently
  (3405, 24), -- completely
  (3560, 24)  -- generally
ON CONFLICT DO NOTHING;


-- ════════════════════════════════════════════════════════════
-- CHAPTER 6: Academic Reading — Complex Texts
-- Words: science, environment, society, advanced academic terms
-- ════════════════════════════════════════════════════════════

-- Lesson 25: Reading About Science & Technology
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (4949, 25), -- technology
  (4919, 25), -- scientific
  (4171, 25), -- research
  (3713, 25), -- analysis
  (3362, 25), -- effect
  (4317, 25), -- development
  (4466, 25), -- develop
  (3937, 25), -- complex
  (4437, 25), -- process
  (3395, 25), -- potential
  (4611, 25), -- industry
  (3280, 25)  -- modern
ON CONFLICT DO NOTHING;

-- Lesson 26: Reading About Society & Environment
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (4687, 26), -- society
  (4118, 26), -- social
  (3394, 26), -- population
  (5043, 26), -- urban
  (5373, 26), -- rural
  (8152, 26), -- pollution
  (4075, 26), -- health
  (3893, 26), -- government
  (4386, 26), -- education
  (4251, 26), -- community
  (3339, 26), -- culture
  (4334, 26)  -- influence
ON CONFLICT DO NOTHING;

-- Lesson 27: Inference & Logical Reasoning Practice
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (4752, 27), -- evidence
  (5047, 27), -- argument
  (6658, 27), -- conclusion
  (3921, 27), -- therefore
  (8480, 27), -- moreover
  (7896, 27), -- furthermore
  (6095, 27), -- meanwhile
  (3409, 27), -- despite
  (4335, 27), -- although
  (3889, 27), -- however
  (7280, 27), -- sufficient
  (5261, 27)  -- relevant
ON CONFLICT DO NOTHING;

-- Lesson 28: Full Academic Reading Mock Test
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (4949, 28), -- technology
  (4687, 28), -- society
  (4171, 28), -- research
  (4752, 28), -- evidence
  (3688, 28), -- impact
  (4317, 28), -- development
  (5043, 28), -- urban
  (4075, 28), -- health
  (3394, 28), -- population
  (6658, 28), -- conclusion
  (4047, 28), -- solution
  (6793, 28), -- resource
  (4555, 28)  -- strategy
ON CONFLICT DO NOTHING;


-- ════════════════════════════════════════════════════════════
-- CHAPTER 7: Speaking Foundations — Part 1 & Everyday Fluency
-- Words: personal, home, hobbies, food, daily life, descriptive
-- ════════════════════════════════════════════════════════════

-- Lesson 29: Introducing Yourself — Home, Studies & Work
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (3728, 29), -- home
  (3795, 29), -- house
  (3836, 29), -- family
  (4206, 29), -- friend
  (3670, 29), -- work
  (3987, 29), -- job
  (4441, 29), -- study
  (3374, 29), -- student
  (4178, 29), -- university
  (3864, 29), -- city
  (4484, 29), -- town
  (3327, 29)  -- living room
ON CONFLICT DO NOTHING;

-- Lesson 30: Talking About Interests — Hobbies, Food & Travel
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (10390, 30), -- hobby
  (4147, 30),  -- food
  (3431, 30),  -- travel
  (3942, 30),  -- read
  (4091, 30),  -- book
  (4929, 30),  -- enjoy
  (4521, 30),  -- beautiful
  (4513, 30),  -- summer
  (3835, 30),  -- winter
  (3927, 30),  -- weather
  (4704, 30),  -- hot
  (3360, 30),  -- cold
  (4868, 30)   -- restaurant
ON CONFLICT DO NOTHING;

-- Lesson 31: Pronunciation Clinic — Common Errors for Bangla Speakers
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (3353, 31), -- speak
  (4120, 31), -- talk
  (3293, 31), -- practice
  (3319, 31), -- truth
  (3973, 31), -- water
  (3378, 31), -- weight
  (4521, 31), -- beautiful
  (3405, 31), -- completely
  (3417, 31), -- interesting
  (4404, 31), -- certainly
  (3520, 31), -- definitely
  (5004, 31)  -- career
ON CONFLICT DO NOTHING;

-- Lesson 32: Part 1 Speaking Mock Interview
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (3728, 32), -- home
  (3670, 32), -- work
  (4441, 32), -- study
  (3836, 32), -- family
  (4206, 32), -- friend
  (4147, 32), -- food
  (3431, 32), -- travel
  (3927, 32), -- weather
  (4880, 32), -- transport
  (4068, 32), -- bus
  (4052, 32), -- car
  (10390, 32), -- hobby
  (4929, 32)  -- enjoy
ON CONFLICT DO NOTHING;

-- Lesson 33: Fluency & Coherence Review
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (3889, 33), -- however
  (4335, 33), -- although
  (3520, 33), -- definitely
  (3560, 33), -- generally
  (5102, 33), -- basically
  (5485, 33), -- personally
  (3371, 33), -- recently
  (4240, 33), -- obviously
  (3404, 33), -- certainly
  (3405, 33)  -- completely
ON CONFLICT DO NOTHING;


-- ════════════════════════════════════════════════════════════
-- CHAPTER 8: Speaking Mastery — Cue Cards & Discussions
-- Words: descriptive, opinion, abstract, advanced vocabulary
-- ════════════════════════════════════════════════════════════

-- Lesson 34: Cue Card Mastery — How to Structure a 2-Minute Talk
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (5530, 34), -- describe
  (4416, 34), -- experience
  (4193, 34), -- memory
  (5883, 34), -- childhood
  (4877, 34), -- amazing
  (4019, 34), -- wonderful
  (4033, 34), -- famous
  (4843, 34), -- ancient
  (3280, 34), -- modern
  (4079, 34), -- important
  (5700, 34)  -- exciting
ON CONFLICT DO NOTHING;

-- Lesson 35: Describing People, Places & Experiences
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (5530, 35), -- describe
  (4521, 35), -- beautiful
  (4059, 35), -- kind
  (4585, 35), -- honest
  (7509, 35), -- reliable
  (6535, 35), -- nervous
  (4928, 35), -- comfortable
  (4877, 35), -- amazing
  (4733, 35), -- terrible
  (7089, 35), -- delicious
  (5033, 35), -- quiet
  (10005, 35), -- crowded
  (7570, 35)  -- peaceful
ON CONFLICT DO NOTHING;

-- Lesson 36: Part 3 — Expressing Opinions & Abstract Ideas
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (3619, 36), -- opinion
  (3481, 36), -- agree
  (9037, 36), -- disagree
  (3975, 36), -- believe
  (4304, 36), -- advantage
  (4334, 36), -- influence
  (4146, 36), -- generation
  (4687, 36), -- society
  (5992, 36), -- tradition
  (4949, 36), -- technology
  (6285, 36), -- compare
  (6216, 36), -- contrast
  (7087, 36), -- contribute
  (8109, 36)  -- demonstrate
ON CONFLICT DO NOTHING;

-- Lesson 37: Full Speaking Mock Test (Parts 1 + 2 + 3)
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (3728, 37), -- home
  (3670, 37), -- work
  (3836, 37), -- family
  (4206, 37), -- friend
  (4929, 37), -- enjoy
  (5530, 37), -- describe
  (4416, 37), -- experience
  (3619, 37), -- opinion
  (3481, 37), -- agree
  (9037, 37), -- disagree
  (4334, 37), -- influence
  (4304, 37), -- advantage
  (4146, 37), -- generation
  (4949, 37), -- technology
  (4687, 37)  -- society
ON CONFLICT DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- 8. RESET SEQUENCES  (so future INSERTs don't collide)
-- ─────────────────────────────────────────────────────────────
SELECT setval('chapters_id_seq',  (SELECT MAX(id) FROM chapters));
SELECT setval('lessons_id_seq',   (SELECT MAX(id) FROM lessons));
SELECT setval('phrases_id_seq',   (SELECT MAX(id) FROM phrases));
SELECT setval('tests_id_seq',     (SELECT MAX(id) FROM tests));
SELECT setval('test_questions_id_seq', (SELECT MAX(id) FROM test_questions));


-- ═══════════════════════════════════════════════════════════════
-- DONE! Curriculum seeded with:
--   • 8 chapters (3 Listening + 3 Reading + 2 Speaking)
--   • 37 lessons (LEARN / PRACTICE / TEST / REVIEW)
--   • 22 phrases (Beginner → Intermediate → Advanced)
--   • ~370 lesson↔word links (using real word IDs from words table)
--   • 8 tests with 47 questions
-- ═══════════════════════════════════════════════════════════════

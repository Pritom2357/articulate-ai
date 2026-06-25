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
-- 7. LESSON ↔ WORD LINKS
--    SEE: ielts_word_coverage.sql
--    That file maps all 1,300 top-frequency English words
--    (covering ~80% of everyday conversation) across 37 lessons.
--    Run ielts_word_coverage.sql AFTER this file.
-- ─────────────────────────────────────────────────────────────

DELETE FROM lesson_words;

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
  (3433, 1),  -- the
  (3463, 1),  -- with
  (3494, 1),  -- we
  (3525, 1),  -- about
  (3558, 1),  -- would
  (3589, 1),  -- than
  (3620, 1),  -- then
  (3651, 1),  -- very
  (3687, 1),  -- still
  (3718, 1),  -- all right
  (3751, 1),  -- come
  (3782, 1),  -- own
  (3815, 1),  -- end
  (3848, 1),  -- you team
  (3895, 1),  -- group
  (3926, 1),  -- nothing
  (3959, 1),  -- once
  (3996, 1),  -- yes
  (4028, 1),  -- full-time
  (4063, 1),  -- per
  (4099, 1),  -- local
  (4135, 1),  -- often
  (4176, 1),  -- several
  (4210, 1),  -- hit
  (4253, 1),  -- data
  (4288, 1),  -- stay
  (4323, 1),  -- heart
  (4358, 1),  -- art
  (4394, 1),  -- list
  (4431, 1),  -- father
  (4465, 1),  -- cut
  (4500, 1),  -- hear
  (4539, 1),  -- account
  (4572, 1),  -- lead
  (4603, 1),  -- English
  (4636, 1),  -- , view
  (4669, 1),  -- finally
  (4706, 1),  -- medical
  (4736, 1),  -- are park
  (4769, 1),  -- round
  (4799, 1),  -- green
  (4830, 1),  -- mom
  (4861, 1),  -- natural
  (4894, 1),  -- involved
  (4924, 1),  -- damn
  (4959, 1),  -- cover
  (4994, 1),  -- staff
  (3282, 1),  -- safe
  (3300, 1),  -- base
  (3317, 1),  -- table
  (3342, 1),  -- married
  (3364, 1),  -- except
  (3385, 1),  -- capital
  (3410, 1),  -- the Far East
  (3429, 1)  -- sort
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
  (3323, 2),  -- card
  (3435, 2),  -- to
  (3465, 2),  -- this
  (3496, 2),  -- an
  (3527, 2),  -- up
  (3561, 2),  -- she
  (3591, 2),  -- good
  (3622, 2),  -- could
  (3654, 2),  -- where
  (3689, 2),  -- take
  (3720, 2),  -- best
  (3753, 2),  -- new year
  (3784, 2),  -- a own
  (3817, 2),  -- found
  (3850, 2),  -- day off
  (3897, 2),  -- man-made
  (3928, 2),  -- person
  (3961, 2),  -- ] support
  (3998, 2),  -- actually
  (4030, 2),  -- general
  (4065, 2),  -- president
  (4102, 2),  -- oh
  (4137, 2),  -- single
  (4180, 2),  -- win
  (4212, 2),  -- nice
  (4255, 2),  -- late
  (4290, 2),  -- age
  (4325, 2),  -- like human
  (4360, 2),  -- behind
  (4396, 2),  -- is quite
  (4433, 2),  -- March
  (4467, 2),  -- field
  (4502, 2),  -- issue
  (4541, 2),  -- especially
  (4574, 2),  -- left-hand
  (4605, 2),  -- happen
  (4638, 2),  -- break
  (4671, 2),  -- gold
  (4708, 2),  -- movie
  (4738, 2),  -- provide
  (4771, 2),  -- save
  (4801, 2),  -- league
  (4832, 2),  -- open-air
  (4863, 2),  -- October
  (4896, 2),  -- itself
  (4927, 2),  -- decision
  (4961, 2),  -- currently
  (4996, 2),  -- super
  (3283, 2),  -- version
  (3301, 2),  -- below
  (3320, 2),  -- ball
  (3343, 2),  -- mother-in-law
  (3365, 2),  -- eye
  (3386, 2),  -- committee
  (3411, 2),  -- female
  (3430, 2)  -- speed
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
  (3375, 3),  -- tomorrow
  (3437, 3),  -- and
  (3467, 3),  -- be
  (3498, 3),  -- your
  (3529, 3),  -- out
  (3563, 3),  -- new
  (3593, 3),  -- only
  (3624, 3),  -- back
  (3656, 3),  -- even
  (3691, 3),  -- many
  (3722, 3),  -- such
  (3755, 3),  -- part
  (3786, 3),  -- during
  (3819, 3),  -- must
  (3854, 3),  -- free
  (3899, 3),  -- public
  (3930, 3),  -- today
  (3963, 3),  -- support
  (4000, 3),  -- American
  (4032, 3),  -- thank you
  (4067, 3),  -- story
  (4104, 3),  -- post
  (4139, 3),  -- become
  (4182, 3),  -- wrong
  (4216, 3),  -- saying
  (4257, 3),  -- leave
  (4294, 3),  -- deal
  (4327, 3),  -- myself
  (4362, 3),  -- building
  (4398, 3),  -- ready
  (4435, 3),  -- march
  (4470, 3),  -- instead
  (4506, 3),  -- rest
  (4543, 3),  -- include
  (4576, 3),  -- likely
  (4607, 3),  -- hard-working
  (4640, 3),  -- break-in
  (4673, 3),  -- guess
  (4710, 3),  -- original
  (4740, 3),  -- relationship
  (4773, 3),  -- stand
  (4804, 3),  -- management
  (4834, 3),  -- range
  (4865, 3),  -- post office
  (4898, 3),  -- language
  (4931, 3),  -- entire
  (4966, 3),  -- election
  (4998, 3),  -- union
  (3284, 3),  -- voice
  (3302, 3),  -- deep
  (3321, 3),  -- box
  (3344, 3),  -- officer
  (3366, 3),  -- funny
  (3389, 3),  -- double
  (3412, 3)  -- focus
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
  (3323, 4),  -- card
  (3439, 4),  -- of
  (3469, 4),  -- I, i
  (3500, 4),  -- all
  (3532, 4),  -- what
  (3565, 4),  -- how
  (3595, 4),  -- after
  (3627, 4),  -- these
  (3658, 4),  -- should
  (3693, 4),  -- never
  (3724, 4),  -- love
  (3757, 4),  -- state
  (3788, 4),  -- game
  (3822, 4),  -- show
  (3856, 4),  -- second
  (3901, 4),  -- top
  (3932, 4),  -- change
  (3965, 4),  -- tell
  (4002, 4),  -- good night
  (4034, 4),  -- united
  (4069, 4),  -- well-done
  (4106, 4),  -- the thanks
  (4141, 4),  -- control
  (4184, 4),  -- along
  (4219, 4),  -- understand
  (4261, 4),  -- run-down
  (4296, 4),  -- rather
  (4329, 4),  -- show business
  (4364, 4),  -- easy
  (4400, 4),  -- sometimes
  (4439, 4),  -- song
  (4472, 4),  -- light year
  (4508, 4),  -- running
  (4545, 4),  -- not issue
  (4578, 4),  -- military
  (4609, 4),  -- hold
  (4642, 4),  -- event
  (4675, 4),  -- interest
  (4712, 4),  -- performance
  (4742, 4),  -- September
  (4775, 4),  -- stuff
  (4806, 4),  -- match
  (4836, 4),  -- review
  (4867, 4),  -- property
  (4900, 4),  -- lord
  (4933, 4),  -- January
  (4968, 4),  -- financial
  (5000, 4),  -- walk
  (3285, 4),  -- whose
  (3303, 4),  -- father-in-law
  (3322, 4),  -- build
  (3345, 4),  -- get oil well
  (3367, 4),  -- limited
  (3390, 4),  -- expect
  (3413, 4)  -- hi
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
  (3943, 5),  -- evening
  (3441, 5),  -- A
  (3472, 5),  -- as
  (3503, 5),  -- so
  (3534, 5),  -- when
  (3566, 5),  -- you their
  (3597, 5),  -- first
  (3629, 5),  -- us
  (3660, 5),  -- may
  (3695, 5),  -- not May
  (3726, 5),  -- man
  (3759, 5),  -- three
  (3790, 5),  -- thing
  (3824, 5),  -- well off
  (3858, 5),  -- away
  (3903, 5),  -- business
  (3934, 5),  -- enough
  (3967, 5),  -- music
  (4004, 5),  -- later
  (4036, 5),  -- area
  (4071, 5),  -- course
  (4107, 5),  -- video
  (4143, 5),  -- death
  (4186, 5),  -- else
  (4221, 5),  -- yeah
  (4263, 5),  -- special
  (4298, 5),  -- reason
  (4331, 5),  -- yourself
  (4366, 5),  -- first class
  (4402, 5),  -- son
  (4443, 5),  -- word
  (4474, 5),  -- main
  (4510, 5),  -- space
  (4547, 5),  -- June
  (4580, 5),  -- the military
  (4613, 5),  -- inside
  (4644, 5),  -- hour
  (4677, 5),  -- July
  (4714, 5),  -- press
  (4744, 5),  -- sound
  (4777, 5),  -- tax
  (4808, 5),  -- model
  (4838, 5),  -- science
  (4869, 5),  -- quality
  (4902, 5),  -- November
  (4935, 5),  -- kill
  (4970, 5),  -- foreign
  (5002, 5),  -- bed
  (3286, 5),  -- writing
  (3304, 5),  -- on listen
  (3324, 5),  -- dark
  (3346, 5),  -- pain
  (3368, 5),  -- moving
  (3391, 5),  -- gas
  (3414, 5)  -- husband
ON CONFLICT DO NOTHING;

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
  (3428, 6),  -- section
  (3432, 6),  -- air force
  (3475, 6),  -- sell
  (3522, 6),  -- Friday
  (3570, 6),  -- lady
  (3615, 6),  -- majority
  (3661, 6),  -- stock
  (3706, 6),  -- spring
  (3750, 6),  -- touch
  (3794, 6),  -- basic
  (3841, 6),  -- agreement
  (3890, 6),  -- drug
  (3939, 6),  -- condition
  (3986, 6),  -- ] northern
  (4031, 6),  -- engine
  (4082, 6),  -- fourth
  (4127, 6)  -- budget
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
  (3335, 7),  -- straight
  (3434, 7),  -- consider
  (3477, 7),  -- short-term
  (3524, 7),  -- gun
  (3572, 7),  -- leader
  (3617, 7),  -- opening
  (3663, 7),  -- weekend
  (3708, 7),  -- Sunday
  (3752, 7),  -- W, w
  (3796, 7),  -- black eye
  (3843, 7),  -- award
  (3892, 7),  -- economy
  (3941, 7),  -- division
  (3988, 7),  -- phone card
  (4035, 7),  -- investment
  (4084, 7),  -- fresh
  (4129, 7)  -- h a t care
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
  (4404, 8),  -- street
  (3436, 8),  -- contact
  (3479, 8),  -- unless
  (3526, 8),  -- heavy
  (3574, 8),  -- letter
  (3621, 8),  -- to physical
  (3665, 8),  -- wonder
  (3710, 8),  -- wear
  (3754, 8),  -- yesterday
  (3798, 8),  -- captain
  (3845, 8),  -- bank account
  (3894, 8),  -- executive
  (3945, 8),  -- flight
  (3990, 8),  -- powerful
  (4037, 8),  -- lie
  (4086, 8),  -- hot dog
  (4131, 8)  -- the civil service
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
  (4171, 9),  -- research
  (3438, 9),  -- drop
  (3483, 9),  -- clean
  (3528, 9),  -- human rights
  (3576, 9),  -- material
  (3623, 9),  -- physical
  (3667, 9),  -- worst
  (3711, 9),  -- address
  (3756, 9),  -- closed
  (3800, 9),  -- carry
  (3847, 9),  -- block
  (3896, 9),  -- foot
  (3947, 9),  -- freedom
  (3992, 9),  -- prior
  (4039, 9),  -- partner
  (4088, 9),  -- lake
  (4132, 9)  -- civil war
ON CONFLICT DO NOTHING;

-- Lesson 10: Vocabulary Building — Academic Word List
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (3298, 10),  -- access
  (3379, 10),  -- addition
  (3382, 10),  -- association
  (3387, 10),  -- conference
  (3310, 10),  -- professional
  (3355, 10),  -- standard
  (3406, 10),  -- content
  (3407, 10),  -- credit
  (3349, 10),  -- response
  (4171, 10),  -- research
  (3341, 10),  -- growth
  (4317, 10),  -- development
  (3440, 10),  -- fair
  (3485, 10),  -- computer
  (3530, 10),  -- knowledge
  (3578, 10),  -- nobody
  (3625, 10),  -- reach
  (3669, 10),  -- awesome
  (3715, 10),  -- choose
  (3758, 10),  -- damage
  (3802, 10),  -- common sense
  (3849, 10),  -- box office
  (3898, 10),  -- hall
  (3949, 10),  -- heat
  (3994, 10),  -- protection
  (4041, 10),  -- police station
  (4090, 10),  -- mental
  (4134, 10)  -- click
ON CONFLICT DO NOTHING;

-- Lesson 11: Following Academic Lectures
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (4171, 11),  -- research
  (4752, 11),  -- evidence
  (4949, 11),  -- technology
  (3394, 11),  -- population
  (3341, 11),  -- growth
  (3362, 11),  -- effect
  (4233, 11),  -- cause
  (3893, 11),  -- government
  (4075, 11),  -- health
  (4317, 11),  -- development
  (3688, 11),  -- impact
  (6658, 11),  -- conclusion
  (3442, 11),  -- kid
  (3487, 11),  -- construction
  (3531, 11),  -- the middle class
  (3580, 11),  -- plus
  (3626, 11),  -- rule
  (3671, 11),  -- beach
  (3717, 11),  -- color
  (3760, 11),  -- directly
  (3804, 11),  -- crime
  (3851, 11),  -- broken
  (3900, 11),  -- mass
  (3951, 11),  -- interview
  (3995, 11),  -- receive
  (4043, 11),  -- role model
  (4092, 11),  -- mostly
  (4136, 11)  -- estate
ON CONFLICT DO NOTHING;

-- Lesson 12: Multiple Speakers — Group Discussion Skills
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (3619, 12),  -- opinion
  (5047, 12),  -- argument
  (3481, 12),  -- agree
  (9037, 12),  -- disagree
  (4934, 12),  -- discuss
  (3975, 12),  -- believe
  (4118, 12),  -- social
  (3339, 12),  -- culture
  (3562, 12),  -- global
  (4416, 12),  -- experience
  (3444, 12),  -- link
  (3489, 12),  -- episode
  (3533, 12),  -- middle-class
  (3582, 12),  -- product
  (3628, 12),  -- the seriously
  (3673, 12),  -- cash
  (3719, 12),  -- commission
  (3762, 12),  -- disease
  (3806, 12),  -- effective
  (3855, 12),  -- Christian
  (3902, 12),  -- meaning
  (3955, 12),  -- located
  (3997, 12),  -- religious
  (4045, 12),  -- sad
  (4094, 12),  -- owner
  (4138, 12)  -- faith
ON CONFLICT DO NOTHING;

-- Lesson 13: Note Completion & Summary Practice
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (4171, 13),  -- research
  (3713, 13),  -- analysis
  (4752, 13),  -- evidence
  (6658, 13),  -- conclusion
  (3921, 13),  -- therefore
  (3889, 13),  -- however
  (4335, 13),  -- although
  (3937, 13),  -- complex
  (4437, 13),  -- process
  (4053, 13),  -- structure
  (3446, 13),  -- next door
  (3491, 13),  -- favorite
  (3535, 13),  -- particularly
  (3584, 13),  -- secretary
  (3630, 13),  -- social science
  (3675, 13),  -- clearly
  (3721, 13),  -- competition
  (3765, 13),  -- doubt
  (3810, 13),  -- fully
  (3857, 13),  -- comment
  (3904, 13),  -- the Middle East
  (3957, 13),  -- location
  (3999, 13),  -- ride
  (4049, 13),  -- southern
  (4096, 13),  -- P, p
  (4140, 13)  -- fashion
ON CONFLICT DO NOTHING;

-- Lesson 14: Full Listening Mock Test (All 4 Sections)
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (4171, 14),  -- research
  (3619, 14),  -- opinion
  (5047, 14),  -- argument
  (4752, 14),  -- evidence
  (6658, 14),  -- conclusion
  (3688, 14),  -- impact
  (3362, 14),  -- effect
  (3921, 14),  -- therefore
  (3889, 14),  -- however
  (4949, 14),  -- technology
  (3394, 14),  -- population
  (4075, 14),  -- health
  (3448, 14),  -- sale
  (3493, 14),  -- income
  (3537, 14),  -- search
  (3586, 14),  -- sister
  (3632, 14),  -- stupid
  (3677, 14),  -- commercial
  (3723, 14),  -- direct
  (3767, 14),  -- drink
  (3812, 14),  -- heart attack
  (3859, 14),  -- equipment
  (3906, 14),  -- mission
  (3958, 14),  -- murder
  (4001, 14),  -- royal
  (4051, 14),  -- square
  (4098, 14),  -- previously
  (4142, 14)  -- feature
ON CONFLICT DO NOTHING;

-- Lesson 15: Skimming — Finding the Main Idea Fast
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (4079, 15),  -- important
  (4414, 15),  -- example
  (3881, 15),  -- different
  (4558, 15),  -- similar
  (4214, 15),  -- probably
  (3889, 15),  -- however
  (3371, 15),  -- recently
  (4384, 15),  -- available
  (4437, 15),  -- process
  (4317, 15),  -- development
  (3443, 15),  -- a
  (3474, 15),  -- have
  (3505, 15),  -- his
  (3536, 15),  -- more
  (3569, 15),  -- so-so
  (3600, 15),  -- him
  (3631, 15),  -- want
  (3662, 15),  -- here
  (3697, 15),  -- those
  (3730, 15),  -- long
  (3761, 15),  -- around
  (3792, 15),  -- give
  (3826, 15),  -- big
  (3866, 15),  -- lot
  (3905, 15),  -- care
  (3936, 15),  -- everything
  (3969, 15),  -- power
  (4006, 15),  -- less
  (4038, 15),  -- black
  (4073, 15),  -- the first person
  (4109, 15),  -- young
  (4145, 15),  -- car do
  (4188, 15),  -- girl
  (4227, 15),  -- a idea
  (4266, 15),  -- watch
  (4300, 15),  -- red
  (4333, 15),  -- act
  (4368, 15),  -- first-class
  (4406, 15),  -- bring
  (4445, 15),  -- across
  (4476, 15),  -- moment
  (4515, 15),  -- talk show
  (4549, 15),  -- lost-and-found
  (4582, 15),  -- perfect
  (4616, 15),  -- online
  (4646, 15),  -- member
  (4679, 15),  -- king
  (4716, 15),  -- role
  (4746, 15),  -- source
  (4779, 15),  -- amount
  (4810, 15),  -- picture
  (4840, 15),  -- trade
  (4871, 15),  -- send
  (4904, 15),  -- oil
  (4937, 15),  -- M, m
  (4972, 15),  -- hair
  (5006, 15),  -- daily
  (3287, 15),  -- army
  (3305, 15),  -- mark
  (3325, 15),  -- also die
  (3347, 15),  -- point of view
  (3369, 15),  -- network
  (3392, 15),  -- half-price
  (3415, 15)  -- ice
ON CONFLICT DO NOTHING;

-- Lesson 16: Scanning — Locating Specific Information
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (3862, 16),  -- number
  (4523, 16),  -- date
  (3868, 16),  -- name
  (3332, 16),  -- percent
  (4974, 16),  -- increase
  (8389, 16),  -- decrease
  (3334, 16),  -- recent
  (4423, 16),  -- map
  (3428, 16),  -- section
  (3427, 16),  -- region
  (3445, 16),  -- in
  (3476, 16),  -- at
  (3507, 16),  -- they
  (3538, 16),  -- do
  (3571, 16),  -- as no
  (3602, 16),  -- into
  (3633, 16),  -- because
  (3664, 16),  -- need
  (3699, 16),  -- say
  (3732, 16),  -- look
  (3764, 16),  -- between
  (3797, 16),  -- place
  (3828, 16),  -- feel
  (3870, 16),  -- night
  (3907, 16),  -- each other
  (3938, 16),  -- live
  (3971, 16),  -- stop
  (4007, 16),  -- line
  (4040, 16),  -- following
  (4077, 16),  -- hope
  (4111, 16),  -- ago
  (4149, 16),  -- game show
  (4190, 16),  -- matter
  (4229, 16),  -- past
  (4268, 16),  -- either
  (4303, 16),  -- report
  (4337, 16),  -- child
  (4370, 16),  -- market
  (4408, 16),  -- her check
  (4447, 16),  -- action
  (4478, 16),  -- mother
  (4517, 16),  -- term
  (4552, 16),  -- you Miss
  (4584, 16),  -- personal
  (4617, 16),  -- out of date
  (4648, 16),  -- middle
  (4681, 16),  -- learn
  (4718, 16),  -- themselves
  (4748, 16),  -- usually
  (4781, 16),  -- blue
  (4812, 16),  -- size
  (4842, 16),  -- upon
  (4873, 16),  -- style
  (4906, 16),  -- related
  (4939, 16),  -- perhaps
  (4976, 16),  -- legal
  (5008, 16),  -- daughter
  (3288, 16),  -- earth
  (3306, 16),  -- missing
  (3326, 16),  -- district
  (3348, 16),  -- respect
  (3370, 16),  -- peace
  (3393, 16),  -- normal
  (3416, 16)  -- individual
ON CONFLICT DO NOTHING;

-- Lesson 17: Vocabulary in Context — Synonyms & Paraphrasing
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (4079, 17),  -- important
  (4558, 17),  -- similar
  (3881, 17),  -- different
  (3388, 17),  -- difference
  (4304, 17),  -- advantage
  (4125, 17),  -- benefit
  (4047, 17),  -- solution
  (3853, 17),  -- challenge
  (3638, 17),  -- approach
  (4234, 17),  -- method
  (4598, 17),  -- reduce
  (4287, 17),  -- improve
  (3447, 17),  -- I
  (3478, 17),  -- he
  (3509, 17),  -- me
  (3540, 17),  -- no
  (3573, 17),  -- some
  (3604, 17),  -- know
  (3635, 17),  -- go
  (3666, 17),  -- really
  (3701, 17),  -- world
  (3734, 17),  -- something
  (3766, 17),  -- always
  (3799, 17),  -- school
  (3830, 17),  -- one another
  (3872, 17),  -- play
  (3909, 17),  -- S, s
  (3940, 17),  -- point
  (3977, 17),  -- call
  (4009, 17),  -- order
  (4042, 17),  -- good-looking
  (4081, 17),  -- least
  (4113, 17),  -- or black
  (4151, 17),  -- guy
  (4192, 17),  -- to matter
  (4231, 17),  -- possible
  (4270, 17),  -- family name
  (4305, 17),  -- soon
  (4339, 17),  -- fire
  (4372, 17),  -- to market
  (4410, 17),  -- college
  (4449, 17),  -- clear
  (4480, 17),  -- only child
  (4519, 17),  -- wife
  (4554, 17),  -- position
  (4586, 17),  -- security
  (4619, 17),  -- player
  (4650, 17),  -- old age
  (4683, 17),  -- policy
  (4720, 17),  -- worth
  (4750, 17),  -- value
  (4783, 17),  -- drive
  (4814, 17),  -- step
  (4844, 17),  -- various
  (4875, 17),  -- vote
  (4908, 17),  -- serious
  (4941, 17),  -- poor
  (4978, 17),  -- lose
  (5010, 17),  -- December
  (3289, 17),  -- forget
  (3308, 17),  -- pass
  (3328, 17),  -- middle name
  (3350, 17),  -- river
  (3372, 17),  -- self-control
  (3396, 17),  -- pressure
  (3418, 17)  -- join
ON CONFLICT DO NOTHING;

-- Lesson 18: Timed Reading Practice — Short Passages
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (4880, 18),  -- transport
  (4974, 18),  -- increase
  (4598, 18),  -- reduce
  (4075, 18),  -- health
  (3362, 18),  -- effect
  (4079, 18),  -- important
  (4384, 18),  -- available
  (3394, 18),  -- population
  (3864, 18),  -- city
  (4053, 18),  -- structure
  (3449, 18),  -- is
  (3480, 18),  -- not
  (3511, 18),  -- if
  (3542, 18),  -- out of
  (3575, 18),  -- also
  (3606, 18),  -- no one
  (3637, 18),  -- time-out
  (3672, 18),  -- year
  (3703, 18),  -- down
  (3736, 18),  -- use
  (3768, 18),  -- better
  (3801, 18),  -- again
  (3832, 18),  -- sure
  (3875, 18),  -- few
  (3911, 18),  -- start
  (3944, 18),  -- so-called
  (3979, 18),  -- head
  (4012, 18),  -- party
  (4044, 18),  -- . law
  (4083, 18),  -- means
  (4116, 18),  -- last name
  (4153, 18),  -- office
  (4194, 18),  -- pretty
  (4235, 18),  -- due
  (4272, 18),  -- future
  (4307, 18),  -- third
  (4341, 18),  -- fun
  (4374, 18),  -- near
  (4412, 18),  -- current
  (4451, 18),  -- himself
  (4486, 18),  -- the World Series
  (4525, 18),  -- land
  (4556, 18),  -- record
  (4588, 18),  -- share
  (4621, 18),  -- private
  (4652, 18),  -- present
  (4685, 18),  -- second-class
  (4722, 18),  -- bill
  (4754, 18),  -- official
  (4785, 18),  -- drive-in
  (4816, 18),  -- T, t
  (4847, 18),  -- attention
  (4879, 18),  -- August
  (4910, 18),  -- stage
  (4943, 18),  -- release
  (4980, 18),  -- pick
  (5012, 18),  -- die
  (3290, 18),  -- goal
  (3309, 18),  -- pay phone
  (3329, 18),  -- mine
  (3351, 18),  -- rock
  (3373, 18),  -- store
  (3398, 18),  -- to station
  (3419, 18)  -- leading
ON CONFLICT DO NOTHING;

-- Lesson 19: Word Families & Collocations Review
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (4317, 19),  -- development
  (4466, 19),  -- develop
  (4974, 19),  -- increase
  (8389, 19),  -- decrease
  (4287, 19),  -- improve
  (4598, 19),  -- reduce
  (3361, 19),  -- create
  (4079, 19),  -- important
  (4558, 19),  -- similar
  (3881, 19),  -- different
  (3388, 19),  -- difference
  (3451, 19),  -- for
  (3482, 19),  -- by
  (3513, 19),  -- one
  (3544, 19),  -- who
  (3577, 19),  -- them
  (3608, 19),  -- see
  (3639, 19),  -- well
  (3674, 19),  -- being
  (3705, 19),  -- great
  (3738, 19),  -- of home
  (3770, 19),  -- find
  (3803, 19),  -- next
  (3834, 19),  -- ever
  (3877, 19),  -- let
  (3913, 19),  -- system
  (3946, 19),  -- yet
  (3981, 19),  -- small
  (4014, 19),  -- run
  (4046, 19),  -- together
  (4085, 19),  -- news
  (4122, 19),  -- court
  (4157, 19),  -- problem
  (4196, 19),  -- remember
  (4237, 19),  -- happy
  (4274, 19),  -- light
  (4309, 19),  -- turn
  (4343, 19),  -- living
  (4376, 19),  -- plan
  (4418, 19),  -- is front
  (4453, 19),  -- month
  (4488, 19),  -- a a board
  (4527, 19),  -- miss
  (4560, 19),  -- the Third World
  (4591, 19),  -- TV
  (4623, 19),  -- ready-made
  (4654, 19),  -- result
  (4689, 19),  -- alone
  (4724, 19),  -- cool
  (4756, 19),  -- the OK
  (4787, 19),  -- eat
  (4818, 19),  -- trust
  (4849, 19),  -- brother
  (4881, 19),  -- blood
  (4912, 19),  -- title
  (4945, 19),  -- short story
  (4982, 19),  -- race
  (3275, 19),  -- difficult
  (3291, 19),  -- huge
  (3311, 19),  -- R, r
  (3330, 19),  -- minister
  (3352, 19),  -- shall
  (3376, 19),  -- track
  (3399, 19),  -- text
  (3421, 19)  -- national park
ON CONFLICT DO NOTHING;

-- Lesson 20: True / False / Not Given — Strategy & Practice
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (3319, 20),  -- truth
  (4752, 20),  -- evidence
  (4499, 20),  -- suggest
  (3808, 20),  -- explain
  (3975, 20),  -- believe
  (3619, 20),  -- opinion
  (4335, 20),  -- although
  (3409, 20),  -- despite
  (3889, 20),  -- however
  (4404, 20),  -- street
  (5261, 20),  -- relevant
  (3450, 20),  -- throughout
  (3495, 20),  -- justice
  (3539, 20),  -- subject
  (3588, 20),  -- unit
  (3634, 20),  -- successful
  (3679, 20),  -- a daughter-in-law
  (3725, 20),  -- dream
  (3769, 20),  -- driving
  (3814, 20),  -- highly
  (3861, 20),  -- eventually
  (3908, 20),  -- movie star
  (3960, 20),  -- queen
  (4003, 20),  -- screen
  (4055, 20),  -- term paper
  (4100, 20),  -- realize
  (4144, 20)  -- fund
ON CONFLICT DO NOTHING;

-- Lesson 21: Matching Headings & Information
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (4414, 21),  -- example
  (3873, 21),  -- purpose
  (4322, 21),  -- function
  (4053, 21),  -- structure
  (3428, 21),  -- section
  (4437, 21),  -- process
  (4079, 21),  -- important
  (3362, 21),  -- effect
  (4233, 21),  -- cause
  (5261, 21),  -- relevant
  (3452, 21),  -- tour
  (3497, 21),  -- manager
  (3541, 21),  -- train
  (3590, 21),  -- annual
  (3636, 21),  -- active
  (3681, 21),  -- effort
  (3727, 21),  -- easily
  (3771, 21),  -- fish
  (3816, 21),  -- the human race
  (3863, 21),  -- holy
  (3910, 21),  -- nine
  (3962, 21),  -- report card
  (4005, 21),  -- serve
  (4057, 21),  -- traditional
  (4101, 21),  -- remain
  (4148, 21)  -- a hearing
ON CONFLICT DO NOTHING;

-- Lesson 22: Sentence & Summary Completion
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (4974, 22),  -- increase
  (8389, 22),  -- decrease
  (4598, 22),  -- reduce
  (4287, 22),  -- improve
  (4317, 22),  -- development
  (4171, 22),  -- research
  (4752, 22),  -- evidence
  (4047, 22),  -- solution
  (3853, 22),  -- challenge
  (4118, 22),  -- social
  (3454, 22),  -- welcome
  (3499, 22),  -- movement
  (3543, 22),  -- wide
  (3592, 22),  -- you bar
  (3640, 22),  -- area code
  (3682, 22),  -- fan
  (3729, 22),  -- finish
  (3773, 22),  -- gay
  (3818, 22),  -- in-laws
  (3865, 22),  -- L, l
  (3912, 22),  -- politics
  (3964, 22),  -- actual
  (4008, 22),  -- slow
  (4058, 22),  -- twice
  (4103, 22),  -- scale
  (4150, 22)  -- hill
ON CONFLICT DO NOTHING;

-- Lesson 23: Mixed Question Types — Full Passage Practice
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (4949, 23),  -- technology
  (4118, 23),  -- social
  (4334, 23),  -- influence
  (3688, 23),  -- impact
  (4146, 23),  -- generation
  (3371, 23),  -- recently
  (3937, 23),  -- complex
  (6216, 23),  -- contrast
  (6285, 23),  -- compare
  (3921, 23),  -- therefore
  (3889, 23),  -- however
  (7896, 23),  -- furthermore
  (3456, 23),  -- additional
  (3501, 23),  -- the past perfect
  (3545, 23),  -- of wow
  (3594, 23),  -- bar
  (3642, 23),  -- cancer
  (3684, 23),  -- first lady
  (3731, 23),  -- grand
  (3775, 23),  -- glad
  (3820, 23),  -- male
  (3867, 23),  -- nation
  (3914, 23),  -- pop
  (3966, 23),  -- appear
  (4010, 23),  -- a species
  (4060, 23),  -- Wall Street
  (4105, 23),  -- score
  (4152, 23)  -- jack
ON CONFLICT DO NOTHING;

-- Lesson 24: Common Traps & Mistakes Review
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (3319, 24),  -- truth
  (4558, 24),  -- similar
  (3881, 24),  -- different
  (3388, 24),  -- difference
  (4335, 24),  -- although
  (3409, 24),  -- despite
  (3889, 24),  -- however
  (3371, 24),  -- recently
  (3405, 24),  -- completely
  (3560, 24),  -- generally
  (3458, 24),  -- beyond
  (3502, 24),  -- photo
  (3547, 24),  -- author
  (3596, 24),  -- battle
  (3644, 24),  -- civil
  (3686, 24),  -- imagine
  (3733, 24),  -- literally
  (3777, 24),  -- grow
  (3821, 24),  -- Mrs.
  (3869, 24),  -- otherwise
  (3916, 24),  -- question mark
  (3968, 24),  -- attempt
  (4011, 24),  -- speech
  (4062, 24),  -- wind
  (4108, 24),  -- separate
  (4154, 24)  -- metal
ON CONFLICT DO NOTHING;

-- Lesson 25: Reading About Science & Technology
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (4949, 25),  -- technology
  (4919, 25),  -- scientific
  (4171, 25),  -- research
  (3713, 25),  -- analysis
  (3362, 25),  -- effect
  (4317, 25),  -- development
  (4466, 25),  -- develop
  (3937, 25),  -- complex
  (4437, 25),  -- process
  (3395, 25),  -- potential
  (4611, 25),  -- industry
  (3280, 25),  -- modern
  (3460, 25),  -- E, e
  (3504, 25),  -- safety
  (3549, 25),  -- brother-in-law
  (3598, 25),  -- brain
  (3646, 25),  -- on dance
  (3690, 25),  -- lack
  (3735, 25),  -- luck
  (3779, 25),  -- machine
  (3823, 25),  -- plant
  (3871, 25),  -- primary
  (3917, 25),  -- Saturday
  (3970, 25),  -- broke
  (4013, 25),  -- traffic
  (4064, 25),  -- worry
  (4110, 25)  -- sister-in-law
ON CONFLICT DO NOTHING;

-- Lesson 26: Reading About Society & Environment
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (4687, 26),  -- society
  (4118, 26),  -- social
  (3394, 26),  -- population
  (5043, 26),  -- urban
  (5373, 26),  -- rural
  (8152, 26),  -- pollution
  (4075, 26),  -- health
  (3893, 26),  -- government
  (4386, 26),  -- education
  (4251, 26),  -- community
  (3339, 26),  -- culture
  (4334, 26),  -- influence
  (3462, 26),  -- extra
  (3506, 26),  -- scene
  (3551, 26),  -- claim
  (3599, 26),  -- contract
  (3648, 26),  -- dance
  (3692, 26),  -- latest
  (3737, 26),  -- major league
  (3781, 26),  -- notice
  (3825, 26),  -- reality
  (3874, 26),  -- responsible
  (3919, 26),  -- status
  (3972, 26),  -- channel
  (4015, 26),  -- tree
  (4066, 26),  -- brand
  (4112, 26)  -- smart
ON CONFLICT DO NOTHING;

-- Lesson 27: Inference & Logical Reasoning Practice
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (4752, 27),  -- evidence
  (5047, 27),  -- argument
  (6658, 27),  -- conclusion
  (3921, 27),  -- therefore
  (8480, 27),  -- moreover
  (7896, 27),  -- furthermore
  (6095, 27),  -- meanwhile
  (3409, 27),  -- despite
  (4335, 27),  -- although
  (3889, 27),  -- however
  (7280, 27),  -- sufficient
  (5261, 27),  -- relevant
  (3464, 27),  -- immediately
  (3508, 27),  -- spend
  (3553, 27),  -- dad
  (3601, 27),  -- degree
  (3650, 27),  -- defense
  (3694, 27),  -- learning
  (3739, 27),  -- of marriage
  (3783, 27),  -- professor
  (3827, 27),  -- service station
  (3878, 27),  -- sick
  (3923, 27),  -- trial
  (3974, 27),  -- distance
  (4017, 27),  -- whom
  (4070, 27),  -- cent
  (4114, 27)  -- surface
ON CONFLICT DO NOTHING;

-- Lesson 28: Full Academic Reading Mock Test
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (4949, 28),  -- technology
  (4687, 28),  -- society
  (4171, 28),  -- research
  (4752, 28),  -- evidence
  (3688, 28),  -- impact
  (4317, 28),  -- development
  (5043, 28),  -- urban
  (4075, 28),  -- health
  (3394, 28),  -- population
  (6658, 28),  -- conclusion
  (4047, 28),  -- solution
  (6793, 28),  -- resource
  (4555, 28),  -- strategy
  (3466, 28),  -- one kid
  (3510, 28),  -- statement
  (3555, 28),  -- ] fear
  (3603, 28),  -- fast food
  (3652, 28),  -- direction
  (3696, 28),  -- multiple
  (3741, 28),  -- necessary
  (3785, 28),  -- record player
  (3829, 28),  -- sit-up
  (3880, 28),  -- teacher
  (3925, 28),  -- truly
  (3976, 28),  -- exchange
  (4021, 28),  -- airport
  (4072, 28),  -- count
  (4115, 28)  -- throw
ON CONFLICT DO NOTHING;

-- Lesson 29: Introducing Yourself — Home, Studies & Work
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (3728, 29),  -- home
  (3795, 29),  -- house
  (3836, 29),  -- family
  (4206, 29),  -- friend
  (3670, 29),  -- work
  (3987, 29),  -- job
  (4441, 29),  -- study
  (3374, 29),  -- student
  (4178, 29),  -- university
  (3864, 29),  -- city
  (4484, 29),  -- town
  (3327, 29),  -- living room
  (3453, 29),  -- that
  (3484, 29),  -- but
  (3515, 29),  -- can
  (3546, 29),  -- It’s
  (3579, 29),  -- now
  (3610, 29),  -- two
  (3641, 29),  -- way
  (3676, 29),  -- too
  (3707, 29),  -- one-way
  (3740, 29),  -- same
  (3772, 29),  -- help
  (3805, 29),  -- each
  (3838, 29),  -- keep
  (3879, 29),  -- real
  (3915, 29),  -- times
  (3948, 29),  -- bad
  (3983, 29),  -- white
  (4016, 29),  -- service
  (4048, 29),  -- war
  (4087, 29),  -- within
  (4124, 29),  -- half
  (4161, 29),  -- true
  (4198, 29),  -- has young
  (4239, 29),  -- move
  (4276, 29),  -- low
  (4311, 29),  -- whether
  (4346, 29),  -- major
  (4378, 29),  -- political
  (4420, 29),  -- meet
  (4455, 29),  -- outside
  (4490, 29),  -- department
  (4529, 29),  -- project
  (4562, 29),  -- total
  (4593, 29),  -- April
  (4625, 29),  -- return
  (4656, 29),  -- sorry
  (4691, 29),  -- average
  (4726, 29),  -- director
  (4758, 29),  -- OK
  (4789, 29),  -- fall
  (4820, 29),  -- central
  (4851, 29),  -- character
  (4883, 29),  -- china
  (4914, 29),  -- working-class
  (4947, 29),  -- situation
  (4984, 29),  -- seem
  (3276, 29),  -- figure
  (3292, 29),  -- Internet
  (3312, 29),  -- R & B
  (3333, 29),  -- piece
  (3354, 29),  -- to specific
  (3377, 29),  -- via
  (3400, 29),  -- treatment
  (3422, 29)  -- nearly
ON CONFLICT DO NOTHING;

-- Lesson 30: Talking About Interests — Hobbies, Food & Travel
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (10390, 30),  -- hobby
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
  (4868, 30),  -- restaurant
  (3455, 30),  -- you
  (3486, 30),  -- from
  (3517, 30),  -- will
  (3548, 30),  -- there
  (3581, 30),  -- its
  (3612, 30),  -- make
  (3643, 30),  -- .1
  (3678, 30),  -- the day
  (3709, 30),  -- through
  (3743, 30),  -- used
  (3774, 30),  -- high
  (3807, 30),  -- Mr.
  (3840, 30),  -- might
  (3883, 30),  -- set
  (3918, 30),  -- week
  (3950, 30),  -- best man
  (3985, 30),  -- far
  (4018, 30),  -- She as set
  (4050, 30),  -- whole
  (4089, 30),  -- able
  (4126, 30),  -- hand
  (4163, 30),  -- almost
  (4200, 30),  -- air
  (4243, 30),  -- series
  (4278, 30),  -- million
  (4313, 30),  -- check
  (4348, 30),  -- media
  (4380, 30),  -- six
  (4422, 30),  -- program
  (4457, 30),  -- self
  (4492, 30),  -- energy
  (4531, 30),  -- sex
  (4564, 30),  -- club
  (4595, 30),  -- center
  (4628, 30),  -- sense
  (4659, 30),  -- training
  (4693, 30),  -- bank
  (4728, 30),  -- exactly
  (4761, 30),  -- can park
  (4791, 30),  -- fast
  (4822, 30),  -- forward
  (4853, 30),  -- chief
  (4885, 30),  -- complete
  (4916, 30),  -- add
  (4951, 30),  -- website
  (4986, 30),  -- seven
  (3277, 30),  -- the hospital
  (3294, 30),  -- sea
  (3313, 30),  -- risk
  (3336, 30),  -- visit
  (3356, 30),  -- tonight
  (3380, 30),  -- ahead
  (3401, 30),  -- western
  (3423, 30)  -- particular
ON CONFLICT DO NOTHING;

-- Lesson 31: Pronunciation Clinic — Common Errors for Bangla Speakers
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (3353, 31),  -- speak
  (4120, 31),  -- talk
  (3293, 31),  -- practice
  (3319, 31),  -- truth
  (3973, 31),  -- water
  (3378, 31),  -- weight
  (4521, 31),  -- beautiful
  (3405, 31),  -- completely
  (3417, 31),  -- interesting
  (4404, 31),  -- street
  (3520, 31),  -- definitely
  (5004, 31),  -- career
  (3457, 31),  -- IT
  (3488, 31),  -- have to
  (3519, 31),  -- just
  (3550, 31),  -- her
  (3583, 31),  -- our
  (3614, 31),  -- over
  (3645, 31),  -- 1
  (3680, 31),  -- before
  (3712, 31),  -- know-how
  (3745, 31),  -- both
  (3776, 31),  -- little
  (3809, 31),  -- well-being
  (3842, 31),  -- part-time
  (3885, 31),  -- thought
  (3920, 31),  -- already
  (3952, 31),  -- four
  (3989, 31),  -- side
  (4020, 31),  -- a less
  (4054, 31),  -- face
  (4093, 31),  -- early
  (4128, 31),  -- level
  (4165, 31),  -- at fact
  (4202, 31),  -- bit
  (4245, 31),  -- wait
  (4282, 31),  -- police
  (4315, 31),  -- check-in
  (4352, 31),  -- right-hand
  (4388, 31),  -- final
  (4424, 31),  -- type
  (4459, 31),  -- video game
  (4494, 31),  -- fight
  (4533, 31),  -- shot
  (4566, 31),  -- common
  (4597, 31),  -- county
  (4630, 31),  -- star
  (4661, 31),  -- wish
  (4695, 31),  -- a certain
  (4730, 31),  -- ground
  (4763, 31),  -- production
  (4793, 31),  -- federal
  (4824, 31),  -- health food
  (4855, 31),  -- cup
  (4887, 31),  -- dog
  (4918, 31),  -- article
  (4953, 31),  -- choice
  (4988, 31),  -- sign
  (3278, 31),  -- loss
  (3296, 31),  -- son-in-law
  (3314, 31),  -- self-service
  (3337, 31),  -- wall
  (3357, 31),  -- write
  (3381, 31),  -- allow
  (3402, 31),  -- beginning
  (3424, 31)  -- playing field
ON CONFLICT DO NOTHING;

-- Lesson 32: Part 1 Speaking Mock Interview
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (3728, 32),  -- home
  (3670, 32),  -- work
  (4441, 32),  -- study
  (3836, 32),  -- family
  (4206, 32),  -- friend
  (4147, 32),  -- food
  (3431, 32),  -- travel
  (3927, 32),  -- weather
  (4880, 32),  -- transport
  (4068, 32),  -- bus
  (4052, 32),  -- car
  (10390, 32),  -- hobby
  (4929, 32),  -- enjoy
  (3459, 32),  -- it
  (3490, 32),  -- my
  (3521, 32),  -- the will
  (3552, 32),  -- which
  (3585, 32),  -- a other
  (3616, 32),  -- think
  (3647, 32),  -- most
  (3683, 32),  -- off
  (3714, 32),  -- last
  (3747, 32),  -- every
  (3778, 32),  -- since
  (3811, 32),  -- without
  (3844, 32),  -- please
  (3887, 32),  -- done
  (3922, 32),  -- anything
  (3954, 32),  -- hard
  (3991, 32),  -- though
  (4024, 32),  -- season
  (4056, 32),  -- five
  (4095, 32),  -- high school
  (4130, 32),  -- make-believe
  (4167, 32),  -- large
  (4204, 32),  -- or body
  (4247, 32),  -- woman
  (4284, 32),  -- public school
  (4319, 32),  -- form
  (4354, 32),  -- well-known
  (4390, 32),  -- former
  (4427, 32),  -- baby
  (4461, 32),  -- board
  (4496, 32),  -- fine
  (4535, 32),  -- site
  (4568, 32),  -- film
  (4599, 32),  -- couple
  (4632, 32),  -- test
  (4665, 32),  -- boy
  (4697, 32),  -- church
  (4732, 32),  -- hands-on
  (4765, 32),  -- rate
  (4795, 32),  -- feeling
  (4826, 32),  -- hey
  (4857, 32),  -- hate
  (4890, 32),  -- first-rate
  (4920, 32),  -- attack
  (4955, 32),  -- code
  (4990, 32),  -- simple
  (3279, 32),  -- middle school
  (3297, 32),  -- success
  (3315, 32),  -- the sleep
  (3338, 32),  -- C, c
  (3358, 32),  -- century
  (3383, 32),  -- beat
  (3403, 32),  -- campaign
  (3425, 32)  -- previous
ON CONFLICT DO NOTHING;

-- Lesson 33: Fluency & Coherence Review
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (3889, 33),  -- however
  (4335, 33),  -- although
  (3520, 33),  -- definitely
  (3560, 33),  -- generally
  (5102, 33),  -- basically
  (5485, 33),  -- personally
  (3371, 33),  -- recently
  (4240, 33),  -- obviously
  (3404, 33),  -- certainly
  (3405, 33),  -- completely
  (3461, 33),  -- on
  (3492, 33),  -- or
  (3523, 33),  -- like
  (3556, 33),  -- get
  (3587, 33),  -- are people
  (3618, 33),  -- any
  (3649, 33),  -- much
  (3685, 33),  -- why
  (3716, 33),  -- while
  (3749, 33),  -- used to
  (3780, 33),  -- . another
  (3813, 33),  -- against
  (3846, 33),  -- put
  (3891, 33),  -- god
  (3924, 33),  -- case
  (3956, 33),  -- mean
  (3993, 33),  -- try
  (4026, 33),  -- thank
  (4061, 33),  -- maybe
  (4097, 33),  -- information
  (4133, 33),  -- mind
  (4169, 33),  -- lost
  (4208, 33),  -- can hand
  (4249, 33),  -- ask
  (4286, 33),  -- short
  (4321, 33),  -- further
  (4356, 33),  -- the White House
  (4392, 33),  -- the former
  (4429, 33),  -- chance
  (4463, 33),  -- cost
  (4498, 33),  -- force
  (4537, 33),  -- strong
  (4570, 33),  -- also human being
  (4601, 33),  -- dead
  (4634, 33),  -- up to date
  (4667, 33),  -- design
  (4700, 33),  -- D, d
  (4734, 33),  -- meeting
  (4767, 33),  -- reading
  (4797, 33),  -- felt
  (4828, 33),  -- key
  (4859, 33),  -- lower
  (4892, 33),  -- hell
  (4922, 33),  -- born
  (4957, 33),  -- council
  (4992, 33),  -- simply
  (3281, 33),  -- paper
  (3299, 33),  -- B, b
  (3316, 33),  -- sleep
  (3340, 33),  -- the etc.
  (3359, 33),  -- charge
  (3384, 33),  -- brown
  (3408, 33),  -- cross
  (3426, 33)  -- quickly
ON CONFLICT DO NOTHING;

-- Lesson 34: Cue Card Mastery — How to Structure a 2-Minute Talk
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (5530, 34),  -- describe
  (4416, 34),  -- experience
  (4193, 34),  -- memory
  (5883, 34),  -- childhood
  (4877, 34),  -- amazing
  (4019, 34),  -- wonderful
  (4033, 34),  -- famous
  (4843, 34),  -- ancient
  (3280, 34),  -- modern
  (4079, 34),  -- important
  (5700, 34),  -- exciting
  (3468, 34),  -- minute
  (3512, 34),  -- sun
  (3557, 34),  -- fear
  (3605, 34),  -- finished
  (3653, 34),  -- last-minute
  (3698, 34),  -- operation
  (3742, 34),  -- rich
  (3787, 34),  -- side effect
  (3831, 34),  -- spot
  (3882, 34),  -- theory
  (3929, 34),  -- activity
  (3978, 34),  -- fat
  (4023, 34),  -- begin
  (4074, 34),  -- of critical
  (4117, 34)  -- totally
ON CONFLICT DO NOTHING;

-- Lesson 35: Describing People, Places & Experiences
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (5530, 35),  -- describe
  (4521, 35),  -- beautiful
  (4059, 35),  -- kind
  (4585, 35),  -- honest
  (7509, 35),  -- reliable
  (6535, 35),  -- nervous
  (4928, 35),  -- comfortable
  (4877, 35),  -- amazing
  (4733, 35),  -- terrible
  (7089, 35),  -- delicious
  (5033, 35),  -- quiet
  (10005, 35),  -- crowded
  (7570, 35),  -- peaceful
  (3470, 35),  -- nature
  (3514, 35),  -- ability
  (3559, 35),  -- fit
  (3609, 35),  -- hurt
  (3655, 35),  -- master
  (3700, 35),  -- organization
  (3744, 35),  -- skin
  (3789, 35),  -- sit
  (3833, 35),  -- waiting room
  (3884, 35),  -- avoid
  (3931, 35),  -- application
  (3980, 35),  -- , glass
  (4025, 35),  -- bottom
  (4076, 35),  -- digital
  (4119, 35)  -- wedding
ON CONFLICT DO NOTHING;

-- Lesson 36: Part 3 — Expressing Opinions & Abstract Ideas
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (3619, 36),  -- opinion
  (3481, 36),  -- agree
  (9037, 36),  -- disagree
  (3975, 36),  -- believe
  (4304, 36),  -- advantage
  (4334, 36),  -- influence
  (4146, 36),  -- generation
  (4687, 36),  -- society
  (5992, 36),  -- tradition
  (4949, 36),  -- technology
  (6285, 36),  -- compare
  (6216, 36),  -- contrast
  (7087, 36),  -- contribute
  (8109, 36),  -- demonstrate
  (3471, 36),  -- police force
  (3516, 36),  -- coach
  (3567, 36),  -- interested
  (3611, 36),  -- image
  (3657, 36),  -- none
  (3702, 36),  -- secret
  (3746, 36),  -- sweet
  (3791, 36),  -- trip
  (3837, 36),  -- worse
  (3886, 36),  -- catch
  (3933, 36),  -- check mark
  (3982, 36),  -- mobile
  (4027, 36),  -- life comment
  (4078, 36),  -- double-check
  (4121, 36)  -- acting
ON CONFLICT DO NOTHING;

-- Lesson 37: Full Speaking Mock Test (Parts 1 + 2 + 3)
INSERT INTO lesson_words (word_id, lesson_id) VALUES
  (3728, 37),  -- home
  (3670, 37),  -- work
  (3836, 37),  -- family
  (4206, 37),  -- friend
  (4929, 37),  -- enjoy
  (5530, 37),  -- describe
  (4416, 37),  -- experience
  (3619, 37),  -- opinion
  (3481, 37),  -- agree
  (9037, 37),  -- disagree
  (4334, 37),  -- influence
  (4304, 37),  -- advantage
  (4146, 37),  -- generation
  (4949, 37),  -- technology
  (4687, 37),  -- society
  (3473, 37),  -- quick
  (3518, 37),  -- collection
  (3568, 37),  -- judge
  (3613, 37),  -- insurance
  (3659, 37),  -- ship
  (3704, 37),  -- senior
  (3748, 37),  -- thus
  (3793, 37),  -- X, x
  (3839, 37),  -- advice
  (3888, 37),  -- coast
  (3935, 37),  -- coffee
  (3984, 37),  -- N, n
  (4029, 37),  -- demand
  (4080, 37),  -- fire station
  (4123, 37)  -- arms
ON CONFLICT DO NOTHING;

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
--   • ~1300 lesson↔word links (using real word IDs from words table)
--   • 8 tests with 47 questions
-- ═══════════════════════════════════════════════════════════════

// const { Pool } = require('pg');
// const path = require('path');
// require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// async function seed() {
//   const pool = new Pool({
//     connectionString: process.env.DATABASE_URL,
//     ssl: { rejectUnauthorized: false }
//   });

//   try {
//     console.log('Starting database seeding...');

//     // 2. Seed Chapters
//     console.log('Seeding chapters...');
//     const chapters = [
//       {
//         id: 1,
//         title: 'Everyday Communication (Basic)',
//         title_bn: 'দৈনন্দিন যোগাযোগ (বেসিক)',
//         order_num: 1,
//         skill_type: 'SPEAKING',
//         description: 'Learn simple everyday words and greetings to start your English journey.',
//         conversation_key_points: JSON.stringify(['name', 'greet', 'meet', 'home', 'hometown', 'study', 'live'])
//       },
//       {
//         id: 2,
//         title: 'Daily Life & Actions (Pre-Intermediate)',
//         title_bn: 'দৈনন্দিন জীবন ও কাজ (প্রি-ইন্টারমিডিয়েট)',
//         order_num: 2,
//         skill_type: 'MIXED',
//         description: 'Describe your daily routine, habits, work activities, and study guides.',
//         conversation_key_points: JSON.stringify(['morning', 'routine', 'breakfast', 'work', 'office', 'weekend', 'relax'])
//       },
//       {
//         id: 3,
//         title: 'Describe & Express (Intermediate)',
//         title_bn: 'বর্ণনা ও প্রকাশ (ইন্টারমিডিয়েট)',
//         order_num: 3,
//         skill_type: 'READING',
//         description: 'Talk about people, personalities, feelings, plans, and recall past memories.',
//         conversation_key_points: JSON.stringify(['friend', 'family', 'kind', 'honest', 'memory', 'past', 'happy'])
//       },
//       {
//         id: 4,
//         title: 'Connect & Discuss (Upper-Intermediate)',
//         title_bn: 'সংযুক্ত ও আলোচনা (আপার-ইন্টারমিডিয়েট)',
//         order_num: 4,
//         skill_type: 'SPEAKING',
//         description: 'Discuss modern technology, present arguments, debates, and IELTS topics.',
//         conversation_key_points: JSON.stringify(['internet', 'phone', 'distract', 'advantages', 'opinion', 'future', 'efficient'])
//       }
//     ];

//     for (const ch of chapters) {
//       await pool.query(
//         `INSERT INTO chapters (id, title, title_bn, order_num, skill_type, description, conversation_key_points)
//          VALUES ($1, $2, $3, $4, $5, $6, $7)
//          ON CONFLICT (id) DO UPDATE SET title = $2, title_bn = $3, order_num = $4, skill_type = $5, description = $6, conversation_key_points = $7;`,
//         [ch.id, ch.title, ch.title_bn, ch.order_num, ch.skill_type, ch.description, ch.conversation_key_points]
//       );
//     }
//     console.log('✅ Chapters seeded.');

//     // 3. Seed Lessons
//     console.log('Seeding lessons...');
//     const lessons = [
//       // Chapter 1 Lessons
//       { id: 1, chapter_id: 1, title: 'Everyday Objects', title_bn: 'পরিচিত জিনিসপত্র', order_num: 1, type: 'LEARN', objective_bn: 'সাধারণ জিনিসপত্রের ইংরেজি নাম ও অর্থ জানুন।' },
//       { id: 2, chapter_id: 1, title: 'Speak & Spell', title_bn: 'উচ্চারণ ও বানান অনুশীলন', order_num: 2, type: 'PRACTICE', objective_bn: 'শব্দগুলো সঠিকভাবে উচ্চারণ করা শিখুন।' },
//       { id: 3, chapter_id: 1, title: 'Sentence Challenge', title_bn: 'বাক্য পরীক্ষা', order_num: 3, type: 'TEST', objective_bn: 'উচ্চারণের যোগ্যতা পরীক্ষা করুন।' },
//       // Chapter 2 Lessons
//       { id: 4, chapter_id: 2, title: 'Daily Routine', title_bn: 'নিয়মিত কাজ', order_num: 1, type: 'LEARN', objective_bn: 'দৈনন্দিন অভ্যাস সংক্রান্ত শব্দ শিখুন।' },
//       { id: 5, chapter_id: 2, title: 'Work & Study', title_bn: 'কাজ ও পড়াশোনা', order_num: 2, type: 'PRACTICE', objective_bn: 'পেশা ও পড়াশোনা নিয়ে অনুশীলন করুন।' },
//       { id: 6, chapter_id: 2, title: 'Routine Talk', title_bn: 'রুটিন বলা পরীক্ষা', order_num: 3, type: 'TEST', objective_bn: 'রুটিন সংক্রান্ত বাক্য বলার পরীক্ষা দিন।' },
//       // Chapter 3 Lessons
//       { id: 7, chapter_id: 3, title: 'People & Personality', title_bn: 'মানুষ ও চরিত্র', order_num: 1, type: 'LEARN', objective_bn: 'মানুষের ব্যক্তিত্ব বর্ণনা করার শব্দাবলী শিখুন।' },
//       { id: 8, chapter_id: 3, title: 'Feelings & Thoughts', title_bn: 'অনুভূতি ও চিন্তাভাবনা', order_num: 2, type: 'PRACTICE', objective_bn: 'অনুভূতি প্রকাশের অনুশীলন।' },
//       { id: 9, chapter_id: 3, title: 'Story Time', title_bn: 'গল্প বলার পরীক্ষা', order_num: 3, type: 'TEST', objective_bn: 'অতীতের কোনো স্মৃতি বর্ণনার পরীক্ষা।' },
//       // Chapter 4 Lessons
//       { id: 10, chapter_id: 4, title: 'Modern Technology', title_bn: 'আধুনিক প্রযুক্তি', order_num: 1, type: 'LEARN', objective_bn: 'প্রযুক্তি এবং বিজ্ঞানের ইংরেজি শব্দাবলী।' },
//       { id: 11, chapter_id: 4, title: 'Pro & Con Debates', title_bn: 'ভালো-মন্দ বিতর্ক', order_num: 2, type: 'PRACTICE', objective_bn: 'তর্ক বিতর্ক সংক্রান্ত যুক্তি অনুশীলনী।' },
//       { id: 12, chapter_id: 4, title: 'IELTS Speech', title_bn: 'আইইএলটিএস স্পিচ পরীক্ষা', order_num: 3, type: 'TEST', objective_bn: 'আইইএলটিএস লেভেলের ইংরেজিতে কথা বলার চূড়ান্ত পরীক্ষা।' }
//     ];

//     for (const les of lessons) {
//       await pool.query(
//         `INSERT INTO lessons (id, chapter_id, title, title_bn, order_num, type, objective_bn)
//          VALUES ($1, $2, $3, $4, $5, $6, $7)
//          ON CONFLICT (id) DO UPDATE SET title = $3, title_bn = $4, order_num = $5, type = $6, objective_bn = $7;`,
//         [les.id, les.chapter_id, les.title, les.title_bn, les.order_num, les.type, les.objective_bn]
//       );
//     }
//     console.log('✅ Lessons seeded.');

//     // 4. Link existing words to lessons
//     console.log('Linking words to lessons...');
//     // Clear old links
//     await pool.query('DELETE FROM lesson_words;');
    
//     // Fetch some words to distribute
//     const wordsRes = await pool.query('SELECT id, frequency_rank FROM words ORDER BY frequency_rank ASC LIMIT 200;');
//     const wordRows = wordsRes.rows;

//     if (wordRows.length > 0) {
//       // Divide words into groups of 10-15 per lesson
//       const numLessons = 12;
//       const wordsPerLesson = Math.floor(wordRows.length / numLessons) || 5;

//       for (let i = 0; i < numLessons; i++) {
//         const lessonId = i + 1;
//         const startIndex = i * wordsPerLesson;
//         const endIndex = Math.min(startIndex + wordsPerLesson, wordRows.length);

//         for (let j = startIndex; j < endIndex; j++) {
//           const wordId = wordRows[j].id;
//           await pool.query(
//             `INSERT INTO lesson_words (word_id, lesson_id)
//              VALUES ($1, $2)
//              ON CONFLICT DO NOTHING;`,
//             [wordId, lessonId]
//           );
//         }
//       }
//       console.log(`✅ Linked ${wordRows.length} words across ${numLessons} lessons.`);
//     } else {
//       console.log('⚠️ No words found in database to link!');
//     }

//     // 5. Seed Phrases (for pronunciation tests)
//     console.log('Seeding phrases...');
//     const phrases = [
//       { id: 1, text: 'Hello, how are you today?', bn: 'হ্যালো, আজ আপনি কেমন আছেন?', difficulty: 'BEGINNER' },
//       { id: 2, text: 'I am learning English step by step.', bn: 'আমি ধাপে ধাপে ইংরেজি শিখছি।', difficulty: 'BEGINNER' },
//       { id: 3, text: 'What is your name and where are you from?', bn: 'আপনার নাম কি এবং আপনি কোথা থেকে এসেছেন?', difficulty: 'BEGINNER' },
//       { id: 4, text: 'I enjoy reading books and walking in the park.', bn: 'আমি বই পড়তে এবং পার্কে হাঁটতে পছন্দ করি।', difficulty: 'INTERMEDIATE' },
//       { id: 5, text: 'My typical day starts with a cup of hot tea.', bn: 'আমার সাধারণ দিনটি শুরু হয় এক কাপ গরম চা দিয়ে।', difficulty: 'INTERMEDIATE' },
//       { id: 6, text: 'We need to practice speaking English every day.', bn: 'আমাদের প্রতিদিন ইংরেজি বলার অনুশীলন করা প্রয়োজন।', difficulty: 'INTERMEDIATE' },
//       { id: 7, text: 'In my opinion, honest people are loved by everyone.', bn: 'আমার মতে, সৎ মানুষকে সবাই ভালোবাসে।', difficulty: 'INTERMEDIATE' },
//       { id: 8, text: 'I will never forget the beautiful memories of my childhood.', bn: 'আমি আমার শৈশবের সুন্দর স্মৃতিগুলো কখনোই ভুলব না।', difficulty: 'INTERMEDIATE' },
//       { id: 9, text: 'Technology plays an important role in our daily lives.', bn: 'আমাদের দৈনন্দিন জীবনে প্রযুক্তি একটি গুরুত্বপূর্ণ ভূমিকা পালন করে।', difficulty: 'ADVANCED' },
//       { id: 10, text: 'The internet helps us connect with people around the world.', bn: 'ইন্টারনেট আমাদের সারা বিশ্বের মানুষের সাথে যুক্ত হতে সাহায্য করে।', difficulty: 'ADVANCED' },
//       { id: 11, text: 'There are many advantages and disadvantages of online study.', bn: 'অনলাইন পড়াশোনার অনেক সুবিধা ও অসুবিধা রয়েছে।', difficulty: 'ADVANCED' },
//       { id: 12, text: 'I believe we should use social media responsibly.', bn: 'আমি বিশ্বাস করি আমাদের সামাজিক যোগাযোগ মাধ্যম দায়িত্বশীলভাবে ব্যবহার করা উচিত।', difficulty: 'ADVANCED' }
//     ];

//     // Clear old links
//     await pool.query('DELETE FROM lesson_phrases;');
//     await pool.query('DELETE FROM phrases;');

//     for (const ph of phrases) {
//       await pool.query(
//         `INSERT INTO phrases (id, phrase_en, phrase_bn, difficulty)
//          VALUES ($1, $2, $3, $4)
//          ON CONFLICT (id) DO UPDATE SET phrase_en = $2, phrase_bn = $3, difficulty = $4;`,
//         [ph.id, ph.text, ph.bn, ph.difficulty]
//       );
//     }
//     console.log('✅ Phrases seeded.');

//     // 6. Link phrases to lessons (Chapter 1-4 TEST lessons: 3, 6, 9, 12)
//     console.log('Linking phrases to lessons...');
//     // Lesson 3 (Chapter 1 Test) -> Phrases 1, 2, 3
//     // Lesson 6 (Chapter 2 Test) -> Phrases 4, 5, 6
//     // Lesson 9 (Chapter 3 Test) -> Phrases 7, 8
//     // Lesson 12 (Chapter 4 Test) -> Phrases 9, 10, 11, 12
//     const links = [
//       { lesson_id: 3, phrase_ids: [1, 2, 3] },
//       { lesson_id: 6, phrase_ids: [4, 5, 6] },
//       { lesson_id: 9, phrase_ids: [7, 8] },
//       { lesson_id: 12, phrase_ids: [9, 10, 11, 12] }
//     ];

//     for (const link of links) {
//       for (const phId of link.phrase_ids) {
//         await pool.query(
//           `INSERT INTO lesson_phrases (lesson_id, phrase_id)
//            VALUES ($1, $2)
//            ON CONFLICT DO NOTHING;`,
//           [link.lesson_id, phId]
//         );
//       }
//     }
//     console.log('✅ Phrases linked to test lessons.');

//     // 7. Seed tests and test_questions (which map to lessons)
//     // Create tests entries for the TEST lessons (3, 6, 9, 12)
//     console.log('Seeding tests...');
//     await pool.query('DELETE FROM tests CASCADE;');
//     const tests = [
//       { id: 1, lesson_id: 3, title: 'Chapter 1 Speaking Test', skill_type: 'SPEAKING', difficulty_level: 1, total_marks: 30, time_limit_seconds: 300 },
//       { id: 2, lesson_id: 6, title: 'Chapter 2 Speaking Test', skill_type: 'SPEAKING', difficulty_level: 2, total_marks: 30, time_limit_seconds: 300 },
//       { id: 3, lesson_id: 9, title: 'Chapter 3 Speaking Test', skill_type: 'SPEAKING', difficulty_level: 3, total_marks: 20, time_limit_seconds: 300 },
//       { id: 4, lesson_id: 12, title: 'Chapter 4 Speaking Test', skill_type: 'SPEAKING', difficulty_level: 4, total_marks: 40, time_limit_seconds: 300 }
//     ];

//     for (const t of tests) {
//       await pool.query(
//         `INSERT INTO tests (id, lesson_id, title, skill_type, difficulty_level, total_marks, time_limit_seconds)
//          VALUES ($1, $2, $3, $4, $5, $6, $7)
//          ON CONFLICT (id) DO UPDATE SET title = $3, skill_type = $4;`,
//         [t.id, t.lesson_id, t.title, t.skill_type, t.difficulty_level, t.total_marks, t.time_limit_seconds]
//       );

//       // Seed test_questions mapping to the phrases
//       // This is helpful if we need test questions records.
//       let phraseIds = [];
//       if (t.id === 1) phraseIds = [1, 2, 3];
//       else if (t.id === 2) phraseIds = [4, 5, 6];
//       else if (t.id === 3) phraseIds = [7, 8];
//       else if (t.id === 4) phraseIds = [9, 10, 11, 12];

//       let order = 1;
//       for (const phId of phraseIds) {
//         const ph = phrases.find(p => p.id === phId);
//         await pool.query(
//           `INSERT INTO test_questions (test_id, question_text, question_text_bn, question_type, order_num, marks, difficulty_level)
//            VALUES ($1, $2, $3, $4, $5, 10, $6)
//            ON CONFLICT DO NOTHING;`,
//           [t.id, ph.text, ph.bn, 'SPOKEN PROMPT', order++, t.difficulty_level]
//         );
//       }
//     }
//     console.log('✅ Tests and questions seeded.');

//     console.log('🚀 Seeding completed successfully!');
//   } catch (err) {
//     console.error('❌ Error during seeding:', err);
//   } finally {
//     await pool.end();
//   }
// }

// seed();

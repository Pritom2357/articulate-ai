import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { ThemeLanguageProvider } from './contexts/ThemeLanguageContext.jsx';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Profile from './pages/Profile.jsx';
import ChangePassword from './pages/ChangePassword.jsx';
import Curriculum from './pages/Curriculum.jsx';
import ChapterDetails from './pages/ChapterDetails.jsx';
import LessonDetails from './pages/LessonDetails.jsx';
import WordDetails from './pages/WordDetails.jsx';
import Flashcards from './pages/Flashcards.jsx';
import Progress from './pages/Progress.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import Onboarding from './pages/Onboarding.jsx';
import IELTSConversation from './pages/IELTSConversation.jsx';
import AIChat from './pages/AIChat.jsx';
import Tests from './pages/Tests.jsx';
import ExamHistory from './pages/ExamHistory.jsx';
import Notifications from './pages/Notifications.jsx';
import Vocabulary from './pages/Vocabulary.jsx';
import TermsOfService from './pages/TermsOfService.jsx';
import PrivacyPolicy from './pages/PrivacyPolicy.jsx';
import DataSafety from './pages/DataSafety.jsx';
import CookiePreferences from './pages/CookiePreferences.jsx';
import './App.css';

function App() {
  return (
    <ThemeLanguageProvider>
      <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes (Full screen, no sidebar) */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/data-safety" element={<DataSafety />} />
          <Route path="/cookie-preferences" element={<CookiePreferences />} />

          {/* Protected App Routes (Wrapped in ProtectedRoute and Layout with sidebar) */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/curriculum" element={<Curriculum />} />
            <Route path="/chapters/:id" element={<ChapterDetails />} />
            <Route path="/lessons/:id" element={<LessonDetails />} />
            <Route path="/words/:id" element={<WordDetails />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/chapters/:id/conversation" element={<IELTSConversation />} />
            <Route path="/flashcards" element={<Flashcards />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/vocabulary" element={<Vocabulary />} />
            <Route path="/ai-chat" element={<AIChat />} />
            <Route path="/tests" element={<Tests />} />
            <Route path="/exam-history" element={<ExamHistory />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/change-password" element={<ChangePassword />} />
          </Route>

          {/* Fallback redirect to home/landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </AuthProvider>
    </ThemeLanguageProvider>
  );
}

export default App;

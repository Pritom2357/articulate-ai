import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
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
import Onboarding from './pages/Onboarding.jsx';
import IELTSConversation from './pages/IELTSConversation.jsx';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate replace to="/curriculum" />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="curriculum" element={<Curriculum />} />
            <Route path="chapters/:id" element={<ChapterDetails />} />
            <Route path="lessons/:id" element={<LessonDetails />} />
            <Route path="words/:id" element={<WordDetails />} />
            <Route
              path="onboarding"
              element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              }
            />
            <Route
              path="chapters/:id/conversation"
              element={
                <ProtectedRoute>
                  <IELTSConversation />
                </ProtectedRoute>
              }
            />
            <Route
              path="flashcards"
              element={
                <ProtectedRoute>
                  <Flashcards />
                </ProtectedRoute>
              }
            />
            <Route
              path="progress"
              element={
                <ProtectedRoute>
                  <Progress />
                </ProtectedRoute>
              }
            />
            <Route
              path="profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="profile/change-password"
              element={
                <ProtectedRoute>
                  <ChangePassword />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

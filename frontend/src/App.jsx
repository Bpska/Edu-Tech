import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';

import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StudyGrowth from './pages/StudyGrowth';
import MockTestSelection from './pages/MockTestSelection';
import ActiveExam from './pages/ActiveExam';
import ScoreCard from './pages/ScoreCard';
import MyCourses from './pages/MyCourses';
import Profile from './pages/Profile';
import Onboarding from './pages/Onboarding';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCourses from './pages/admin/AdminCourses';
import AdminTests from './pages/admin/AdminTests';
import AdminPayments from './pages/admin/AdminPayments';
import AdminHistory from './pages/admin/AdminHistory';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/" element={
            <Layout>
              <ErrorBoundary>
                <Dashboard />
              </ErrorBoundary>
            </Layout>
          } />

          <Route path="/growth" element={
            <Layout>
              <ErrorBoundary>
                <StudyGrowth />
              </ErrorBoundary>
            </Layout>
          } />

          <Route path="/tests" element={
            <Layout>
              <ErrorBoundary>
                <MockTestSelection />
              </ErrorBoundary>
            </Layout>
          } />

          <Route path="/exam/:id" element={
            <ErrorBoundary>
              <ActiveExam />
            </ErrorBoundary>
          } />

          <Route path="/score/:id" element={
            <Layout>
              <ErrorBoundary>
                <ScoreCard />
              </ErrorBoundary>
            </Layout>
          } />

          <Route path="/courses" element={
            <Layout>
              <ErrorBoundary>
                <MyCourses />
              </ErrorBoundary>
            </Layout>
          } />

          <Route path="/profile" element={
            <Layout>
              <ErrorBoundary>
                <Profile />
              </ErrorBoundary>
            </Layout>
          } />

          {/* Admin Panel */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/courses" element={<AdminCourses />} />
            <Route path="/admin/tests" element={<AdminTests />} />
            <Route path="/admin/payments" element={<AdminPayments />} />
            <Route path="/admin/history" element={<AdminHistory />} />
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </Router>
  );
}

export default App;

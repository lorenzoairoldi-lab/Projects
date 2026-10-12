import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './store/auth.js';
import Home from './pages/Home.jsx';

const Layout = lazy(() => import('./components/Layout.jsx'));
const Auth = lazy(() => import('./pages/Auth.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Habits = lazy(() => import('./pages/Habits.jsx'));
const Goals = lazy(() => import('./pages/Goals.jsx'));
const Routines = lazy(() => import('./pages/Routines.jsx'));
const Focus = lazy(() => import('./pages/Focus.jsx'));
const Content = lazy(() => import('./pages/Content.jsx'));
const Community = lazy(() => import('./pages/Community.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));
const Subscription = lazy(() => import('./pages/Subscription.jsx'));

const Loading = () => <div className="grid min-h-screen place-items-center bg-paper text-ink">
  <div className="text-center"><span className="mx-auto block size-3 animate-pulse rounded-full bg-fire" /><p className="mt-4 text-[10px] font-bold uppercase tracking-[.2em] text-ink/45">RiseWithin</p></div>
</div>;
const Protected = () => useAuth((state) => state.accessToken) ? <Layout /> : <Navigate to="/login" replace />;

export default function App() {
  return <Suspense fallback={<Loading />}>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Auth />} />
      <Route path="/register" element={<Auth register />} />
      <Route element={<Protected />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/habits" element={<Habits />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/routines" element={<Routines />} />
        <Route path="/focus" element={<Focus />} />
        <Route path="/content" element={<Content />} />
        <Route path="/community" element={<Community />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/subscription" element={<Subscription />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Suspense>;
}

import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Shell from './components/Shell';
import { Loading } from './components/ui';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import TaskDetail from './pages/TaskDetail';
import Schedule from './pages/Schedule';
import Reports from './pages/Reports';
import Incidents from './pages/Incidents';
import Equipment from './pages/Equipment';
import EquipmentDetail from './pages/EquipmentDetail';
import NotFound from './pages/NotFound';

function RequireAuth() {
  const { user, ready } = useAuth();
  if (!ready) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  return <Shell />;
}

function RequireAdmin({ children }) {
  const { user } = useAuth();
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RequireAuth />}>
        <Route index element={<Dashboard />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="tasks/:id" element={<TaskDetail />} />
        <Route path="schedule" element={<RequireAdmin><Schedule /></RequireAdmin>} />
        <Route path="reports" element={<Reports />} />
        <Route path="incidents" element={<Incidents />} />
        <Route path="equipment" element={<Equipment />} />
        <Route path="equipment/:id" element={<EquipmentDetail />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { TestDriveModal } from './components/TestDriveModal';
import { LoginModal } from './components/LoginModal';
import { HomePage } from './pages/HomePage';
import { VehicleDetailPage } from './pages/VehicleDetailPage';
import { ConsultantDashboardPage } from './pages/ConsultantDashboardPage';
import { LeadDetailPage } from './pages/LeadDetailPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-[#9E1B24] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const [testDriveOpen, setTestDriveOpen] = useState(false);
  const [testDriveVehicleId, setTestDriveVehicleId] = useState<number | undefined>(undefined);
  const [loginOpen, setLoginOpen] = useState(false);

  const handleOpenTestDrive = (vehicleId?: number) => {
    setTestDriveVehicleId(vehicleId);
    setTestDriveOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar
        onOpenTestDrive={() => handleOpenTestDrive()}
        onOpenLogin={() => setLoginOpen(true)}
      />

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage onOpenTestDrive={handleOpenTestDrive} />} />
          <Route path="/vehicles/:id" element={<VehicleDetailPage onOpenTestDrive={handleOpenTestDrive} />} />
          
          {/* Consultant Leads CRM Dashboard */}
          <Route
            path="/consultant/inbox"
            element={
              <ProtectedRoute allowedRoles={['CONSULTANT', 'ADMIN']}>
                <ConsultantDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Lead Details & AI Assistant Workspace */}
          <Route
            path="/consultant/leads/:id"
            element={
              <ProtectedRoute allowedRoles={['CONSULTANT', 'ADMIN']}>
                <LeadDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Management Dashboard */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />

      {/* Global Modals */}
      <TestDriveModal
        isOpen={testDriveOpen}
        onClose={() => setTestDriveOpen(false)}
        preselectedVehicleId={testDriveVehicleId}
      />

      <LoginModal
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
      />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

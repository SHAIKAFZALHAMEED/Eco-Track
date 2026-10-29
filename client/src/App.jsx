import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Toast from './components/Toast';

// Pages
import DashboardPage from './pages/DashboardPage';
import ElectricityPage from './pages/ElectricityPage';
import FuelPage from './pages/FuelPage';
import WastePage from './pages/WastePage';
import RecordsPage from './pages/RecordsPage';
import ReportsPage from './pages/ReportsPage';
import BuildingsPage from './pages/BuildingsPage';
import FactorsPage from './pages/FactorsPage';
import ProjectInfoPage from './pages/ProjectInfoPage';

import { api } from './api/apiClient';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [healthData, setHealthData] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Toast notification helper
  const showToast = ({ type = 'info', title = '', message = '' }) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Poll database health
  const checkHealth = async () => {
    try {
      const res = await api.getHealth();
      setHealthData(res);
    } catch (err) {
      setHealthData({
        database: { connected: false, error: err.message }
      });
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Poll health every 30s
    return () => clearInterval(interval);
  }, []);

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage setActiveTab={setActiveTab} showToast={showToast} />;
      case 'electricity':
        return <ElectricityPage showToast={showToast} />;
      case 'fuel':
        return <FuelPage showToast={showToast} />;
      case 'waste':
        return <WastePage showToast={showToast} />;
      case 'records':
        return <RecordsPage showToast={showToast} />;
      case 'reports':
        return <ReportsPage showToast={showToast} />;
      case 'buildings':
        return <BuildingsPage showToast={showToast} />;
      case 'factors':
        return <FactorsPage showToast={showToast} />;
      case 'info':
        return <ProjectInfoPage healthData={healthData} />;
      default:
        return <DashboardPage setActiveTab={setActiveTab} showToast={showToast} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Sidebar navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        healthData={healthData}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        <Header
          activeTab={activeTab}
          setMobileOpen={setMobileOpen}
          healthData={healthData}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderActivePage()}
        </main>
      </div>

      {/* Notification Toasts */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}


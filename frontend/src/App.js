import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budgets from './pages/Budgets';
import Goals from './pages/Goals';
import Wallets from './pages/Wallets';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Reminders from './pages/Reminders';
import Analysis from './pages/Analysis';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Auth />} />
        
        {/* Main Routes wrapped in Layout */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/budgets" element={<Budgets />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/wallets" element={<Wallets />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/reminders" element={<Reminders />} />
          <Route path="/analysis" element={<Analysis />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

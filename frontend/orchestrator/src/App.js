import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

const AppDashboard = React.lazy(() => import('dashboard/AppDashboard'));
const AppNavBar = React.lazy(() => import('navbar/AppNavBar'));

export default function App() {
  return (
    <Router>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/" element={<AppNavBar />} />
          <Route path="/dashboard" element={<AppDashboard />} />
        </Routes>
      </Suspense>
    <AppDashboard />
    </Router>
  );
}
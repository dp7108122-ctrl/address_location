import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ClientForm from './pages/ClientForm';
import ClientTable from './pages/ClientTable';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
        <Navbar />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Navigate to="/form" replace />} />
            <Route path="/form" element={<ClientForm />} />
            <Route path="/table" element={<ClientTable />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;
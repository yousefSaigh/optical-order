import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import OrderForm from './pages/OrderForm';
import OrderHistory from './pages/OrderHistory';
import AdminPanel from './pages/AdminPanel';
import './styles/App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('order');

  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <div className="nav-brand">
            <h1>Optical Order Manager</h1>
          </div>
          <div className="nav-links">
            <Link to="/" className="nav-link">New Order</Link>
            <Link to="/history" className="nav-link">Order History</Link>
            <Link to="/admin" className="nav-link">Admin Panel</Link>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<OrderForm />} />
            <Route path="/history" element={<OrderHistory />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;


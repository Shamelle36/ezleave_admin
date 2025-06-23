import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './login';
import Signup from './signup';
import Dashboard from './dashboard';
import Employees from './employee';
import Attendance from './attendance';
import LeaveManagement from './leaveManagement';
import Messages from './messages';
import Announcement from './announcement';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/employee" element={<Employees />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/leaveManagement" element={<LeaveManagement />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/announcement" element={<Announcement />} />
      </Routes>
    </Router>
  );
}

export default App;

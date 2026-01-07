import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './login';
import Signup from './signup';
import Dashboard from './dashboard';
import Employees from './employee';
import Attendance from './attendance';
import LeaveManagement from './leaveManagement';
import Announcement from './announcement';
import ForgotPassword from './forgotPassword';
import AuditLogs from './audit_logs';
import LeaveCalendar from './leaveCalendar';
import EmployeeProfile from './employeeProfile';
import UserManagement from './userManagement';
import SetupPassword from './setUpPassword';

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
        <Route path="/announcement" element={<Announcement />} />
        <Route path='/forgotPassword' element={<ForgotPassword/>} />
        <Route path='/audit_logs' element={<AuditLogs/>} />
        <Route path='/leaveCalendar' element={<LeaveCalendar/>} />
        <Route path="/employeeProfile/:id" element={<EmployeeProfile />} />
        <Route path='/userManagement' element={<UserManagement/>} />
        <Route path="/setup-password" element={<SetupPassword />} />
      </Routes>
    </Router>
  );
}

export default App;

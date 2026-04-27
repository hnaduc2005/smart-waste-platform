import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './AdminDashboard.css';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

const wasteData = [
  { name: 'Mon', plastic: 400, organic: 240, glass: 240 },
  { name: 'Tue', plastic: 300, organic: 139, glass: 221 },
  { name: 'Wed', plastic: 200, organic: 380, glass: 229 },
  { name: 'Thu', plastic: 278, organic: 390, glass: 200 },
  { name: 'Fri', plastic: 189, organic: 480, glass: 218 },
  { name: 'Sat', plastic: 239, organic: 380, glass: 250 },
  { name: 'Sun', plastic: 349, organic: 430, glass: 210 }
];

const userGrowthData = [
  { name: 'Jan', users: 400 },
  { name: 'Feb', users: 600 },
  { name: 'Mar', users: 850 },
  { name: 'Apr', users: 1100 },
  { name: 'May', users: 1540 },
  { name: 'Jun', users: 1890 }
];

const AdminDashboardPage: React.FC = () => {
  return (
    <div className="admin-body d-flex" data-bs-theme="dark">
      {/* Sidebar */}
      <nav className="admin-sidebar d-flex flex-column flex-shrink-0 p-3 bg-dark">
        <a href="/" className="d-flex align-items-center mb-3 mb-md-0 me-md-auto text-white text-decoration-none">
          <i className="bi bi-recycle fs-4 me-2 text-success"></i>
          <span className="fs-4 fw-bold">EcoAdmin</span>
        </a>
        <hr className="text-secondary" />
        <ul className="nav nav-pills flex-column mb-auto">
          <li className="nav-item">
            <Link to="/admin" className="nav-link active bg-success text-white" aria-current="page">
              <i className="bi bi-speedometer2 me-2"></i> Dashboard
            </Link>
          </li>
          <li>
            <a href="#" className="nav-link text-white admin-nav-link">
              <i className="bi bi-people me-2"></i> Users
            </a>
          </li>
          <li>
            <a href="#" className="nav-link text-white admin-nav-link">
              <i className="bi bi-trash me-2"></i> Waste Logs
            </a>
          </li>
          <li>
            <a href="#" className="nav-link text-white admin-nav-link">
              <i className="bi bi-bar-chart me-2"></i> Reports
            </a>
          </li>
          <li>
            <a href="#" className="nav-link text-white admin-nav-link">
              <i className="bi bi-gear me-2"></i> Settings
            </a>
          </li>
        </ul>
        <hr className="text-secondary" />
        <div className="dropdown">
          <a href="#" className="d-flex align-items-center text-white text-decoration-none dropdown-toggle" id="dropdownUser1" data-bs-toggle="dropdown" aria-expanded="false">
            <img src="https://github.com/mdo.png" alt="" width="32" height="32" className="rounded-circle me-2 border border-2 border-success" />
            <strong>Admin User</strong>
          </a>
          <ul className="dropdown-menu dropdown-menu-dark text-small shadow" aria-labelledby="dropdownUser1">
            <li><a className="dropdown-item" href="#">Profile</a></li>
            <li><a className="dropdown-item" href="#">Settings</a></li>
            <li><hr className="dropdown-divider" /></li>
            <li><Link className="dropdown-item text-danger" to="/login">Sign out</Link></li>
          </ul>
        </div>
      </nav>

      {/* Main Content */}
      <main className="admin-main flex-grow-1 bg-darker overflow-auto">
        {/* Top Navbar */}
        <header className="navbar navbar-dark sticky-top bg-dark flex-md-nowrap p-3 shadow-sm border-bottom border-secondary">
          <div className="container-fluid d-flex justify-content-between">
            <button className="navbar-toggler d-md-none collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#sidebarMenu" aria-controls="sidebarMenu" aria-expanded="false" aria-label="Toggle navigation">
              <span className="navbar-toggler-icon"></span>
            </button>
            <form className="w-50 me-3 d-none d-md-flex">
               <div className="input-group">
                 <span className="input-group-text bg-transparent border-end-0 border-secondary"><i className="bi bi-search text-secondary"></i></span>
                 <input type="text" className="form-control bg-transparent border-start-0 border-secondary text-white shadow-none placeholder-secondary" placeholder="Search..." aria-label="Search" />
               </div>
            </form>
            <div className="navbar-nav flex-row align-items-center gap-3">
              <div className="nav-item text-nowrap position-relative">
                <a className="nav-link px-3 text-white" href="#">
                  <i className="bi bi-bell fs-5"></i>
                  <span className="position-absolute top-0 start-50 translate-middle badge rounded-pill bg-danger" style={{fontSize: '0.65rem'}}>
                    3+
                  </span>
                </a>
              </div>
              <div className="nav-item text-nowrap">
                <Link className="btn btn-outline-success btn-sm px-3" to="/dashboard">App View</Link>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="container-fluid p-4">
          <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-4 border-bottom border-secondary">
            <h1 className="h2 text-white fw-bold">Dashboard Summary</h1>
            <div className="btn-toolbar mb-2 mb-md-0">
              <div className="btn-group me-2">
                <button type="button" className="btn btn-sm btn-outline-success">Share</button>
                <button type="button" className="btn btn-sm btn-outline-success">Export</button>
              </div>
              <button type="button" className="btn btn-sm btn-success dropdown-toggle d-flex align-items-center gap-1">
                <i className="bi bi-calendar3"></i> This week
              </button>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="row g-4 mb-4">
            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card bg-dark border-secondary h-100 admin-card-hover shine-effect">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="card-title text-secondary text-uppercase mb-0 mt-1">Total Users</h6>
                    <div className="icon-box bg-success bg-opacity-25 text-success rounded-circle d-flex align-items-center justify-content-center" style={{width: '40px', height: '40px'}}>
                      <i className="bi bi-people-fill fs-5"></i>
                    </div>
                  </div>
                  <h2 className="mb-0 text-white fw-bold">1,890</h2>
                  <small className="text-success"><i className="bi bi-arrow-up-short"></i> 12.5% since last month</small>
                </div>
              </div>
            </div>
            
            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card bg-dark border-secondary h-100 admin-card-hover shine-effect">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="card-title text-secondary text-uppercase mb-0 mt-1">Waste Collected (kg)</h6>
                    <div className="icon-box bg-info bg-opacity-25 text-info rounded-circle d-flex align-items-center justify-content-center" style={{width: '40px', height: '40px'}}>
                      <i className="bi bi-trash-fill fs-5"></i>
                    </div>
                  </div>
                  <h2 className="mb-0 text-white fw-bold">45.2k</h2>
                  <small className="text-success"><i className="bi bi-arrow-up-short"></i> 8.2% since last month</small>
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card bg-dark border-secondary h-100 admin-card-hover shine-effect">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="card-title text-secondary text-uppercase mb-0 mt-1">Active AI Scans</h6>
                    <div className="icon-box bg-warning bg-opacity-25 text-warning rounded-circle d-flex align-items-center justify-content-center" style={{width: '40px', height: '40px'}}>
                      <i className="bi bi-camera-fill fs-5"></i>
                    </div>
                  </div>
                  <h2 className="mb-0 text-white fw-bold">12,450</h2>
                  <small className="text-success"><i className="bi bi-arrow-up-short"></i> 24% since last month</small>
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card bg-dark border-secondary h-100 admin-card-hover shine-effect">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="card-title text-secondary text-uppercase mb-0 mt-1">Rewards Claimed</h6>
                    <div className="icon-box bg-danger bg-opacity-25 text-danger rounded-circle d-flex align-items-center justify-content-center" style={{width: '40px', height: '40px'}}>
                      <i className="bi bi-gift-fill fs-5"></i>
                    </div>
                  </div>
                  <h2 className="mb-0 text-white fw-bold">8,320</h2>
                  <small className="text-muted"><i className="bi bi-dash"></i> 1% since last month</small>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="row g-4 mb-4">
            <div className="col-12 col-lg-8">
              <div className="card bg-dark border-secondary h-100 admin-card-hover shadow-sm">
                <div className="card-header border-secondary bg-transparent d-flex justify-content-between align-items-center pt-3 pb-3">
                  <h5 className="card-title text-white mb-0">Waste Collection Demographics</h5>
                </div>
                <div className="card-body">
                  <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                      <BarChart data={wasteData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis dataKey="name" stroke="#888" tick={{fill: '#888'}} axisLine={false} tickLine={false} />
                        <YAxis stroke="#888" tick={{fill: '#888'}} axisLine={false} tickLine={false} />
                        <RechartsTooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff', borderRadius: '8px' }} />
                        <Bar dataKey="plastic" fill="#22c55e" radius={[4, 4, 0, 0]} name="Plastic" />
                        <Bar dataKey="organic" fill="#14b8a6" radius={[4, 4, 0, 0]} name="Organic" />
                        <Bar dataKey="glass" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Glass" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-12 col-lg-4">
              <div className="card bg-dark border-secondary h-100 admin-card-hover shadow-sm">
                <div className="card-header border-secondary bg-transparent pt-3 pb-3">
                  <h5 className="card-title text-white mb-0">User Growth</h5>
                </div>
                <div className="card-body">
                  <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                      <LineChart data={userGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis dataKey="name" stroke="#888" tick={{fill: '#888'}} axisLine={false} tickLine={false} />
                        <YAxis stroke="#888" tick={{fill: '#888'}} axisLine={false} tickLine={false} />
                        <RechartsTooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff', borderRadius: '8px' }} />
                        <Line type="monotone" dataKey="users" stroke="#22c55e" strokeWidth={3} dot={{r: 4, fill: '#22c55e', strokeWidth: 2}} activeDot={{r: 6}} name="Users" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity Table */}
          <div className="card bg-dark border-secondary admin-card-hover shadow-sm mb-4">
            <div className="card-header border-secondary bg-transparent pt-3 pb-3 d-flex justify-content-between align-items-center">
              <h5 className="card-title text-white mb-0">Recent User Registrations</h5>
              <button className="btn btn-sm btn-outline-secondary text-white">View All</button>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-dark table-hover mb-0 admin-table align-middle">
                  <thead className="table-darker text-secondary">
                    <tr>
                      <th scope="col" className="ps-4 fw-normal">User</th>
                      <th scope="col" className="fw-normal">Email</th>
                      <th scope="col" className="fw-normal">Date Joined</th>
                      <th scope="col" className="fw-normal">Status</th>
                      <th scope="col" className="text-end pe-4 fw-normal">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="ps-4 d-flex align-items-center gap-3 py-3">
                        <img src="https://ui-avatars.com/api/?name=John+Doe&background=22c55e&color=fff" alt="avatar" className="rounded-circle" width="40" height="40" />
                        <div>
                          <div className="fw-bold text-white">John Doe</div>
                          <div className="text-secondary small">ID: #4058</div>
                        </div>
                      </td>
                      <td>john.doe@example.com</td>
                      <td>Oct 24, 2023</td>
                      <td><span className="badge bg-success bg-opacity-25 text-success p-2 rounded-pill px-3">Active</span></td>
                      <td className="text-end pe-4">
                        <button className="btn btn-sm btn-link text-info p-0 me-3"><i className="bi bi-pencil-square fs-5"></i></button>
                        <button className="btn btn-sm btn-link text-danger p-0"><i className="bi bi-trash fs-5"></i></button>
                      </td>
                    </tr>
                    <tr>
                      <td className="ps-4 d-flex align-items-center gap-3 py-3">
                        <img src="https://ui-avatars.com/api/?name=Jane+Smith&background=14b8a6&color=fff" alt="avatar" className="rounded-circle" width="40" height="40" />
                        <div>
                          <div className="fw-bold text-white">Jane Smith</div>
                          <div className="text-secondary small">ID: #4059</div>
                        </div>
                      </td>
                      <td>jane.smith@example.com</td>
                      <td>Oct 23, 2023</td>
                      <td><span className="badge bg-warning bg-opacity-25 text-warning p-2 rounded-pill px-3">Pending</span></td>
                      <td className="text-end pe-4">
                         <button className="btn btn-sm btn-link text-info p-0 me-3"><i className="bi bi-pencil-square fs-5"></i></button>
                         <button className="btn btn-sm btn-link text-danger p-0"><i className="bi bi-trash fs-5"></i></button>
                      </td>
                    </tr>
                    <tr>
                      <td className="ps-4 d-flex align-items-center gap-3 py-3">
                        <img src="https://ui-avatars.com/api/?name=Mike+Johnson&background=f59e0b&color=fff" alt="avatar" className="rounded-circle" width="40" height="40" />
                        <div>
                          <div className="fw-bold text-white">Mike Johnson</div>
                          <div className="text-secondary small">ID: #4060</div>
                        </div>
                      </td>
                      <td>mike.j@example.com</td>
                      <td>Oct 21, 2023</td>
                      <td><span className="badge bg-success bg-opacity-25 text-success p-2 rounded-pill px-3">Active</span></td>
                      <td className="text-end pe-4">
                         <button className="btn btn-sm btn-link text-info p-0 me-3"><i className="bi bi-pencil-square fs-5"></i></button>
                         <button className="btn btn-sm btn-link text-danger p-0"><i className="bi bi-trash fs-5"></i></button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
};

export default AdminDashboardPage;

import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

// Import components
import Dashboard from "./components/Dashboard";
import CustomerManagement from "./components/CustomerManagement";
import TemplateManager from "./components/TemplateManager";
import CampaignManager from "./components/CampaignManager";
import FollowUpManager from "./components/FollowUpManager";
import FileUpload from "./components/FileUpload";

// Icons
import { 
  FaHome, 
  FaUsers, 
  FaEnvelope, 
  FaBullhorn, 
  FaCalendarAlt, 
  FaUpload,
  FaBars,
  FaTimes
} from "react-icons/fa";

const queryClient = new QueryClient();

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', path: '/', icon: FaHome },
    { name: 'Customers', path: '/customers', icon: FaUsers },
    { name: 'Templates', path: '/templates', icon: FaEnvelope },
    { name: 'Campaigns', path: '/campaigns', icon: FaBullhorn },
    { name: 'Follow-ups', path: '/followups', icon: FaCalendarAlt },
    { name: 'Import Data', path: '/upload', icon: FaUpload },
  ];

  return (
    <QueryClientProvider client={queryClient}>
      <div className="App bg-gray-50 min-h-screen">
        <BrowserRouter>
          {/* Mobile sidebar overlay */}
          {sidebarOpen && (
            <div className="fixed inset-0 flex z-40 md:hidden">
              <div 
                className="fixed inset-0 bg-gray-600 bg-opacity-75"
                onClick={() => setSidebarOpen(false)}
              />
              <Sidebar navigation={navigation} setSidebarOpen={setSidebarOpen} />
            </div>
          )}

          {/* Desktop sidebar */}
          <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
            <Sidebar navigation={navigation} />
          </div>

          {/* Main content */}
          <div className="md:pl-64 flex flex-col flex-1">
            {/* Top navigation */}
            <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-white shadow">
              <button
                className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                onClick={() => setSidebarOpen(true)}
              >
                <FaBars className="h-6 w-6" />
              </button>
            </div>

            {/* Page content */}
            <main className="flex-1">
              <div className="py-6">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/customers" element={<CustomerManagement />} />
                  <Route path="/templates" element={<TemplateManager />} />
                  <Route path="/campaigns" element={<CampaignManager />} />
                  <Route path="/followups" element={<FollowUpManager />} />
                  <Route path="/upload" element={<FileUpload />} />
                </Routes>
              </div>
            </main>
          </div>
        </BrowserRouter>
        
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </div>
    </QueryClientProvider>
  );
}

// Sidebar Component
const Sidebar = ({ navigation, setSidebarOpen }) => {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-gray-800">
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <h1 className="text-white text-xl font-bold">Bid Tracker</h1>
          {setSidebarOpen && (
            <button
              className="ml-auto md:hidden text-gray-300 hover:text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <FaTimes className="h-6 w-6" />
            </button>
          )}
        </div>
        <nav className="mt-5 flex-1 px-2 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className="text-gray-300 hover:bg-gray-700 hover:text-white group flex items-center px-2 py-2 text-sm font-medium rounded-md"
              onClick={() => setSidebarOpen && setSidebarOpen(false)}
            >
              <item.icon className="text-gray-400 mr-3 flex-shrink-0 h-6 w-6" />
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default App;
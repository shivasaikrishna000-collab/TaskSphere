import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { logout } from '../redux/actions/authActions';
import useTheme from '../hooks/useTheme';
import { toggleTheme } from '../utils/theme';

// Navbar with glassmorphism, profile dropdown, and responsive design
const Navbar = () => {
  const authState = useSelector(state => state.authReducer);
  const dispatch = useDispatch();
  const theme = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isNavbarOpen, setIsNavbarOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
  };

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);
  const toggleNavbar = () => setIsNavbarOpen(!isNavbarOpen);

  const headerClass = theme === 'dark'
    ? 'flex justify-between sticky top-0 p-4 items-center bg-gray-900 text-white glass-dark fade-in'
    : 'flex justify-between sticky top-0 p-4 items-center bg-white glass fade-in';

  return (
    <header className={headerClass}>
      <h2 className="cursor-pointer uppercase font-medium">
        <Link to="/">Task Manager</Link>
      </h2>
      <nav className="flex items-center gap-4">
        {authState.isLoggedIn ? (
          <>
            <div className="hidden md:block">
              <Link to="/tasks/add" className="bg-blue-500 text-white hover:bg-blue-600 font-medium rounded-md px-4 py-2 transition duration-200">
                <i className="fa-solid fa-plus mr-2"></i>Add task
              </Link>
            </div>
            <div className="relative">
              <button onClick={toggleDropdown} className="flex items-center space-x-2 focus:outline-none">
                <span className="font-medium">
                  {authState.user && authState.user.name ? authState.user.name.charAt(0).toUpperCase() : 'U'}
                </span>
                <i className="fa-solid fa-chevron-down"></i>
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                  <div className="py-1">
                    <Link to="/profile" className="block px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                      <i className="fa-solid fa-user mr-2"></i> Profile
                    </Link>
                    <Link to="/settings" className="block px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                      <i className="fa-solid fa-gear mr-2"></i> Settings
                    </Link>
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                      <i className="fa-solid fa-right-from-bracket mr-2"></i> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <Link to="/login" className="text-primary">Login</Link>
        )}
        <button title="Toggle theme" className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition" onClick={() => toggleTheme()}>
          <i className={'fa-solid ' + (theme === 'dark' ? 'fa-sun' : 'fa-moon')}></i>
        </button>
        {/* Mobile menu toggle */}
        <span className="md:hidden cursor-pointer" onClick={toggleNavbar}>
          <i className="fa-solid fa-bars"></i>
        </span>
      </nav>
      {/* Mobile sidebar */}
      <div className={
        'absolute md:hidden right-0 top-0 bottom-0 transition shadow-md w-screen sm:w-9/12 h-screen ' +
        (isNavbarOpen ? 'translate-x-0' : 'translate-x-full') + ' ' +
        (theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-100')
      }>
        <div className='flex'>
          <span className='m-4 ml-auto cursor-pointer' onClick={toggleNavbar}><i className="fa-solid fa-xmark"></i></span>
        </div>
        <ul className='flex flex-col gap-4 uppercase font-medium text-center'>
          {authState.isLoggedIn ? (
            <>
              <li className="bg-blue-600 text-white hover:bg-blue-700 font-medium py-2 px-3 mx-4 rounded-md transition">
                <Link to="/tasks/add" className="block w-full h-full"><i className="fa-solid fa-plus mr-2"></i> Add task</Link>
              </li>
              <li className='py-2 px-3 hover:bg-gray-200 dark:hover:bg-gray-800 transition rounded-md mx-4'><Link to="/settings">Settings</Link></li>
              <li className='py-2 px-3 hover:bg-gray-200 dark:hover:bg-gray-800 transition rounded-md mx-4' onClick={handleLogout}>Logout</li>
            </>
          ) : (
            <li className='py-2 px-3'><Link to="/login">Login</Link></li>
          )}
        </ul>
      </div>
    </header>
  );
};

export default Navbar;
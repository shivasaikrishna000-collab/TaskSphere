import React from 'react'
import Navbar from '../components/Navbar';
import useTheme from '../hooks/useTheme';

const MainLayout = ({ children }) => {
  const theme = useTheme();
  const outerClass = theme === 'dark' ? 'relative bg-gray-900 text-white h-screen w-screen overflow-x-hidden' : 'relative bg-gray-50 h-screen w-screen overflow-x-hidden';
  return (
    <>
      <div className={outerClass}>
        <Navbar />
        {children}
      </div>
    </>
  )
}

export default MainLayout;
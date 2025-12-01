import React, { useState, useEffect } from 'react'
import MainLayout from '../layouts/MainLayout'
import { getTheme, setTheme, THEMES, toggleTheme } from '../utils/theme'

const Settings = () => {
  const [theme, setLocalTheme] = useState(getTheme());

  useEffect(() => {
    setLocalTheme(getTheme());
  }, []);

  const onChangeTheme = (e) => {
    setTheme(e.target.value);
    setLocalTheme(e.target.value);
  }

  return (
    <MainLayout>
      <div className='m-auto my-16 max-w-[800px] bg-white p-8 border-2 shadow-md rounded-md'>
        <h2 className='text-xl mb-4'>Settings</h2>

        <div className='mb-6'>
          <h3 className='font-medium mb-2'>Theme</h3>
          <div className='flex items-center gap-4'>
            <label className='flex items-center gap-2'>
              <input type='radio' name='theme' value={THEMES.LIGHT} checked={theme === THEMES.LIGHT} onChange={onChangeTheme} /> Light
            </label>
            <label className='flex items-center gap-2'>
              <input type='radio' name='theme' value={THEMES.DARK} checked={theme === THEMES.DARK} onChange={onChangeTheme} /> Dark
            </label>
            <button className='ml-4 bg-primary text-white px-3 py-2 rounded-md' onClick={() => { toggleTheme(); setLocalTheme(getTheme()); }}>Toggle</button>
          </div>
        </div>

        <div>
          <h3 className='font-medium mb-2'>Basic</h3>
          <p className='text-sm text-gray-600'>More basic settings can go here.</p>
        </div>
      </div>
    </MainLayout>
  )
}

export default Settings

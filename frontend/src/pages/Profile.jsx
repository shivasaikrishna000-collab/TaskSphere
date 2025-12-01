import React, { useEffect } from 'react'
import { useSelector } from 'react-redux';
import MainLayout from '../layouts/MainLayout';
import Loader from '../components/utils/Loader';

const Profile = () => {
    const authState = useSelector(state => state.authReducer);
    const { user, loading } = authState;

    useEffect(() => {
        document.title = "Profile";
    }, []);

    return (
        <MainLayout>
            <div className='m-auto my-16 max-w-[600px] bg-white p-8 border-2 shadow-md rounded-md fade-in'>
                <h2 className='text-2xl font-semibold mb-6 text-center'>User Profile</h2>
                {loading ? (
                    <Loader />
                ) : (
                    <div className='space-y-4'>
                        <div className='flex items-center justify-between p-4 bg-gray-50 rounded-lg'>
                            <span className='font-medium text-gray-600'>Name</span>
                            <span className='text-lg font-semibold'>{user ? user.name : 'N/A'}</span>
                        </div>
                        <div className='flex items-center justify-between p-4 bg-gray-50 rounded-lg'>
                            <span className='font-medium text-gray-600'>Email</span>
                            <span className='text-lg font-semibold'>{user ? user.email : 'N/A'}</span>
                        </div>
                        <div className='flex items-center justify-between p-4 bg-gray-50 rounded-lg'>
                            <span className='font-medium text-gray-600'>Joined</span>
                            <span className='text-gray-800'>{user && user.createdAt ? new Date(user.createdAt).toDateString() : 'N/A'}</span>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    )
}

export default Profile

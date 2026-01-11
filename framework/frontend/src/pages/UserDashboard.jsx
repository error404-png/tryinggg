import React from 'react';
import { MessageSquare } from 'lucide-react';

const UserDashboard = () => {
    return (
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-center p-8">
            <div className="w-24 h-24 bg-white rounded-full shadow-sm border border-gray-100 flex items-center justify-center mb-6">
                <MessageSquare className="w-10 h-10 text-blue-500" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-3">Welcome to Xenova AI</h1>
            <p className="text-gray-500 max-w-md text-lg">
                Select a project from the sidebar to start collaborating.
            </p>
        </div>
    );
};

export default UserDashboard;

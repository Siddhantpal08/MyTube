import React from 'react';

function ConfirmationModal({ title, message, onConfirm, onCancel }) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
            <div className="p-6 rounded-lg shadow-xl w-full max-w-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
                <p className="text-gray-600 dark:text-gray-400 mt-2">{message}</p>
                <div className="flex justify-end space-x-4 mt-6">
                    <button 
                        onClick={onCancel} 
                        className="px-4 py-2 rounded font-semibold text-gray-800 dark:text-white bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={onConfirm} 
                        className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white font-semibold"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmationModal;
import React, { useState, useEffect } from 'react';
import { FileText, Folder, RefreshCw } from 'lucide-react';
import api from '../api';

const Repositories = () => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchFiles = async () => {
        setLoading(true);
        try {
            const response = await api.get('/repositories');
            setFiles(response.data);
        } catch (error) {
            console.error("Failed to fetch repositories", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFiles();
    }, []);

    return (
        <div className="flex-1 p-8 bg-[var(--bg-primary)] overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">Local Repositories</h1>
                    <p className="text-[var(--text-secondary)]">Files stored in the local repository.</p>
                </div>
                <button
                    onClick={fetchFiles}
                    className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg transition-colors text-[var(--text-secondary)]"
                >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {files.length === 0 && !loading && (
                    <div className="col-span-full text-center py-12 text-[var(--text-secondary)]">
                        <Folder className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No files found in local repository.</p>
                    </div>
                )}

                {files.map((file, index) => (
                    <div key={index} className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4 rounded-xl flex items-center gap-4 hover:border-[var(--accent-primary)] transition-colors">
                        <div className="w-10 h-10 bg-[var(--bg-tertiary)] rounded-lg flex items-center justify-center text-[var(--accent-primary)]">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-[var(--text-primary)] truncate">{file}</p>
                            <p className="text-xs text-[var(--text-secondary)]">Local File</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Repositories;

import React, { useState } from 'react';
import { X, Sparkles, ArrowRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';

const CreateProjectModal = ({ isOpen, onClose, onProjectCreated }) => {
    const [step, setStep] = useState(1); // 1: Details, 2: Thinking, 3: Review
    const [name, setName] = useState('');
    const [description, setDescription] = useState(''); // Brief description
    const [about, setAbout] = useState(''); // Detailed prompt
    const [allowUserChaining, setAllowUserChaining] = useState(false);
    const [suggestedScreens, setSuggestedScreens] = useState([]);

    // Reset state on close
    const handleClose = () => {
        setName('');
        setDescription('');
        setAbout('');
        setAllowUserChaining(false);
        setSuggestedScreens([]);
        setStep(1);
        onClose();
    };

    if (!isOpen) return null;

    const handleAnalyze = async () => {
        setStep(2); // Move to "Thinking" state

        // Simulate thinking delay for effect if API is too fast, or just wait for API
        const minTime = new Promise(resolve => setTimeout(resolve, 2000));

        try {
            const [response] = await Promise.all([
                api.post('/projects/analyze-prompt', { prompt: about || description }),
                minTime
            ]);

            setSuggestedScreens(response.data);
            setStep(3); // Move to Result
        } catch (error) {
            console.error("Failed to analyze prompt", error);
            setSuggestedScreens([
                { name: "Dashboard", description: "Main overview with key metrics." },
                { name: "Settings", description: "User configuration panel." }
            ]);
            setStep(3);
        }
    };

    const handleCreate = async () => {
        try {
            const response = await api.post('/projects', {
                name,
                description,
                about,
                screens: suggestedScreens,
                allow_user_chaining: allowUserChaining
            });
            onProjectCreated(response.data);
            handleClose();
        } catch (error) {
            console.error("Failed to create project", error);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* distinct header strip */}
                <div className="h-16 border-b border-gray-100 flex items-center justify-between px-6 bg-gray-50/50">
                    <h2 className="text-lg font-bold text-gray-800">
                        {step === 1 ? 'Project Details' : step === 2 ? 'AI Configuration' : 'Blueprint Preview'}
                    </h2>
                    <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8 flex-1 overflow-y-auto">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Project Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all"
                                        placeholder="e.g. Corporate Inventory System"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">High-level Goal</label>
                                    <textarea
                                        value={about}
                                        onChange={(e) => setAbout(e.target.value)}
                                        className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all h-32 resize-none"
                                        placeholder="Describe what you want to build... (e.g. A system to track warehouse stock with role-based access control)"
                                    />
                                </div>

                                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <input
                                        type="checkbox"
                                        id="allowChaining"
                                        checked={allowUserChaining}
                                        onChange={(e) => setAllowUserChaining(e.target.checked)}
                                        className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                                    />
                                    <div className="flex-1">
                                        <label htmlFor="allowChaining" className="text-sm font-semibold text-gray-700 block cursor-pointer">
                                            Allow Basic Users to see & edit Context
                                        </label>
                                        <p className="text-xs text-gray-500 mt-1">
                                            If enabled, basic users can see the agent chain and modify context/files for their session, but cannot add/remove agents.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex justify-end pt-4">
                                    <button
                                        onClick={handleAnalyze}
                                        disabled={!name || !about}
                                        className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        Generate Blueprint
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center py-12 space-y-6"
                            >
                                {/* Sleek "Thinking" Pulse */}
                                <div className="relative w-24 h-24 flex items-center justify-center">
                                    <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping"></div>
                                    <div className="relative w-16 h-16 bg-white rounded-full border-2 border-primary/20 flex items-center justify-center shadow-lg">
                                        <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                                    </div>
                                </div>
                                <div className="text-center space-y-2">
                                    <h3 className="text-lg font-medium text-gray-900">Analysing Requirements...</h3>
                                    <p className="text-sm text-gray-500">Constructing architecture and screen layouts</p>
                                </div>
                                {/* Progress Bar */}
                                <div className="w-64 h-1.5 bg-gray-100 rounded-full overflow-hidden mt-4">
                                    <motion.div
                                        className="h-full bg-primary"
                                        initial={{ width: "0%" }}
                                        animate={{ width: "100%" }}
                                        transition={{ duration: 2, ease: "easeInOut" }}
                                    />
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <Check className="w-4 h-4 text-green-500" />
                                        <span>Blueprint Generated</span>
                                    </div>
                                    <span className="text-xs font-semibold px-2 py-1 bg-blue-50 text-blue-600 rounded">AI Suggested Layout</span>
                                </div>

                                {/* Wireframe Sketch / Blueprint Preview */}
                                <div className="grid grid-cols-2 gap-4">
                                    {suggestedScreens.map((screen, idx) => (
                                        <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors bg-gray-50/50">
                                            <div className="relative h-24 mb-3 bg-white border border-dashed border-gray-300 rounded flex items-center justify-center">
                                                <div className="w-3/4 h-2 bg-gray-100 rounded mb-2"></div>
                                                <div className="absolute w-1/2 h-2 bg-gray-100 rounded mt-4"></div>
                                            </div>
                                            <h4 className="font-semibold text-gray-800 text-sm mb-1">{screen.name}</h4>
                                            <p className="text-xs text-gray-500 line-clamp-2">{screen.description}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-end pt-4 gap-3">
                                    <button
                                        onClick={() => setStep(1)}
                                        className="text-gray-500 hover:text-gray-800 px-4 py-2 text-sm font-medium"
                                    >
                                        Back to Edit
                                    </button>
                                    <button
                                        onClick={handleCreate}
                                        className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40"
                                    >
                                        Create Project
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

export default CreateProjectModal;

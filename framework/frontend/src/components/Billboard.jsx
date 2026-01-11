import React from 'react';
import { Sparkles, ArrowDown } from 'lucide-react';

const Billboard = () => {
    return (
        <div className="relative min-h-[80vh] flex flex-col items-center justify-center text-center p-6 border-b border-[var(--border-color)] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[var(--bg-secondary)] via-[var(--bg-primary)] to-[var(--bg-primary)]">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 pointer-events-none"></div>

            <div className="relative z-10 max-w-4xl mx-auto space-y-6 animate-fade-in-up">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 text-sm font-medium">
                    <Sparkles className="w-4 h-4" />
                    <span>Next Gen AI Orchestration</span>
                </div>

                <h1 className="text-6xl md:text-7xl font-bold leading-tight tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">
                    Build Faster with <br /> Modular Agents
                </h1>

                <p className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto">
                    Assemble powerful workflows by combining specialized agents.
                    Swipe down to explore the agent ecosystem.
                </p>

                <div className="pt-12 animate-bounce">
                    <ArrowDown className="w-8 h-8 text-[var(--text-secondary)] mx-auto opacity-50" />
                </div>
            </div>
        </div>
    );
};

export default Billboard;

import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring, useInView, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronDown, Check, Terminal, Shield, Cpu, Play } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Assets (Using placeholders if generation failed, will update paths)
// Assuming these are verified or will be moved to assets
import landingHero from '../assets/landing_hero.png';
import capAgents from '../assets/capability_agents.png';
import capLlm from '../assets/capability_llm.png';
import capGov from '../assets/capability_governance.png';
const landingAbout = "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=2000"; // Fallback URL

const TextCarousel = ({ words }) => {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % words.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [words]);

    return (
        <div className="h-[1.2em] overflow-hidden relative inline-block align-top w-full md:w-auto">
            <AnimatePresence mode="wait">
                <motion.span
                    key={index}
                    initial={{ y: 50, opacity: 0, filter: 'blur(10px)' }}
                    animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                    exit={{ y: -50, opacity: 0, filter: 'blur(10px)' }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 via-purple-700 to-violet-800 drop-shadow-sm pb-1"
                >
                    {words[index]}
                </motion.span>
            </AnimatePresence>
        </div>
    );
};

const Section = ({ children, className = "" }) => (
    <div className={`relative w-full ${className}`}>
        {children}
    </div>
);

const LandingPage = () => {
    const navigate = useNavigate();
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll();
    const { user, isAdmin } = useAuth();

    const handleLaunchApp = () => {
        if (user) {
            if (isAdmin) {
                navigate('/admin');
            } else {
                // If user is logged in but not admin, go to empty dashboard (Sidebar visible)
                // We need a route for this that isn't excluded. Let's use /dashboard
                navigate('/dashboard');
            }
        } else {
            navigate('/login');
        }
    };

    // Parallax for Hero
    const yHero = useTransform(scrollYProgress, [0, 0.2], [0, 200]);
    const opacityHero = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

    return (
        <div ref={containerRef} className="bg-white text-gray-900 overflow-x-hidden font-sans selection:bg-purple-100 selection:text-purple-900">

            {/* Navbar (Landing specific) */}
            <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-6 pointer-events-none">
                <div className="pointer-events-auto flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center text-white font-bold">X</div>
                    <span className="font-bold text-xl tracking-tight">Xenova AI</span>
                </div>
                <div className="pointer-events-auto">
                    <button
                        onClick={handleLaunchApp}
                        className="bg-gray-900 text-white px-6 py-2.5 rounded-full font-medium hover:bg-gray-800 transition-all hover:scale-105 shadow-lg flex items-center gap-2"
                    >
                        Launch App <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </nav>

            {/* SECTION 1: HERO */}
            <Section className="h-screen flex items-center justify-center overflow-hidden">
                <motion.div style={{ y: yHero, opacity: opacityHero }} className="absolute inset-0 z-0">
                    {/* Image Background with Gradient Overlay */}
                    <img
                        src={landingHero}
                        alt="Neural Network"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            console.error("Image failed to load:", e);
                            e.target.style.display = 'none';
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-white/10 to-transparent" />
                </motion.div>

                <div className="relative z-10 max-w-6xl mx-auto text-center px-6">
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="text-6xl md:text-8xl font-bold tracking-tight text-gray-900 mb-6 drop-shadow-sm flex flex-col items-center justify-center gap-2"
                    >
                        <span>The Autonomous</span>
                        <TextCarousel words={[
                            "Enterprise.",
                            "Workforce.",
                            "Intelligence.",
                            "Innovation.",
                            "Orchestration.",
                            "Reasoning.",
                            "Efficiency.",
                            "Governance.",
                            "Evolution.",
                            "Productivity."
                        ]} />
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                        className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto leading-relaxed font-light"
                    >
                        Multi-agent orchestration for a smarter, faster, <br className="hidden md:block" /> and more efficient workforce.
                    </motion.p>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 1 }}
                    className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20"
                >
                    <span className="text-sm font-medium text-gray-400">Discover Capability</span>
                    <ChevronDown className="w-5 h-5 text-gray-400 animate-bounce" />
                </motion.div>
            </Section>

            {/* SECTION 2: CAPABILITIES */}
            <Section className="py-32 px-6 md:px-12 max-w-[1600px] mx-auto">
                <div className="mb-24">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">Engineered for <br /> Intelligence.</h2>
                    <div className="h-1 w-24 bg-purple-600 rounded-full" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <CapabilityCard
                        title="Autonomous Agents"
                        desc="Deploy pre-trained specialized agents that work 24/7."
                        img={capAgents}
                        icon={<Cpu />}
                        delay={0}
                    />
                    <CapabilityCard
                        title="LLM Reasoning"
                        desc="Advanced document intelligence that understands business nuance."
                        img={capLlm}
                        icon={<Terminal />}
                        delay={0.2}
                    />
                    <CapabilityCard
                        title="Human-in-the-Loop"
                        desc="Enterprise-grade governance with complete oversight."
                        img={capGov}
                        icon={<Shield />}
                        delay={0.4}
                    />
                </div>
            </Section>

            {/* SECTION 3: VIBE CODING */}
            <Section className="py-32 bg-gray-50 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 overflow-hidden opacity-10">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-200 via-transparent to-transparent" />
                </div>
                <div className="max-w-4xl mx-auto text-center relative z-10 px-6">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-xl mb-8 text-purple-600">
                            <span className="font-mono text-3xl font-bold">{`{}`}</span>
                        </div>
                        <h2 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 mb-8 leading-tight">
                            "This platform is 99% built with <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">vibe coding</span>."
                        </h2>
                        <p className="text-xl text-gray-500 font-medium">A new paradigm of software generation.</p>
                    </motion.div>
                </div>
            </Section>

            {/* SECTION 4: ABPUT */}
            <Section className="py-32 px-6 md:px-12 max-w-[1600px] mx-auto flex flex-col md:flex-row items-center gap-16">
                <div className="flex-1 space-y-8">
                    <h2 className="text-4xl font-bold text-gray-900">Engineered for <br /> Adaptability.</h2>
                    <p className="text-lg text-gray-600 leading-relaxed">
                        Enterprises struggle with rigid, manual workflows and heavy IT dependency.
                        Xenova AI breaks these silos by enabling anyone to orchestrate powerful AI agents
                        using natural language, creating a fluid, adaptable workforce that evolves with your needs.
                    </p>
                    <ul className="space-y-4">
                        {["Zero IT Dependency", "Instant Deployment", "Secure & Private"].map((item, i) => (
                            <li key={i} className="flex items-center gap-3 text-gray-800 font-medium">
                                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                    <Check className="w-4 h-4" />
                                </div>
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="flex-1">
                    <div className="rounded-3xl overflow-hidden shadow-2xl relative group">
                        <img src={landingAbout} alt="Team" className="w-full h-auto transform group-hover:scale-105 transition-transform duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/20 to-transparent mix-blend-multiply" />
                    </div>
                </div>
            </Section>

            {/* SECTION 5: FOOTER */}
            <footer className="py-12 border-t border-gray-100 bg-white">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2 opacity-50 grayscale hover:grayscale-0 transition-all">
                        <div className="w-6 h-6 bg-gray-900 rounded flex items-center justify-center text-white text-xs font-bold">X</div>
                        <span className="font-semibold text-gray-900">Xenova AI</span>
                    </div>
                    <div className="flex gap-8 text-sm font-medium text-gray-500">
                        <a href="#" className="hover:text-purple-600 transition-colors">Privacy</a>
                        <a href="#" className="hover:text-purple-600 transition-colors">Terms</a>
                        <a href="#" className="hover:text-purple-600 transition-colors">Contact</a>
                    </div>
                    <div className="text-sm text-gray-400">
                        © 2026 Xenova AI Inc.
                    </div>
                </div>
            </footer>
        </div>
    );
};

const CapabilityCard = ({ title, desc, img, icon, delay }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay }}
            className="group relative h-[500px] rounded-3xl overflow-hidden bg-gray-100"
        >
            <div className="absolute inset-0">
                <img src={img} alt={title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80" />
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center mb-6 border border-white/20 text-white">
                    {icon}
                </div>
                <h3 className="text-2xl font-bold mb-3">{title}</h3>
                <p className="text-white/80 leading-relaxed">{desc}</p>
            </div>
        </motion.div>
    )
}

export default LandingPage;

import { motion, AnimatePresence } from 'motion/react';
import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar,
  CartesianGrid
} from 'recharts';
import {
  Shield, TrendingUp, Landmark, Calculator, LineChart as ChartIcon, Calendar, BookOpen,
  ChevronRight, ArrowUpRight, Star, Quote, Lock, FileText, Briefcase, Play, Users, DollarSign
} from 'lucide-react';

export default function App() {
  // SIP Calculator State
  const [monthlyInvestment, setMonthlyInvestment] = useState<number>(10000);
  const [returnRate, setReturnRate] = useState<number>(12);
  const [duration, setDuration] = useState<number>(10);

  // Contact and Appointment Form State
  const [contactTab, setContactTab] = useState<'consultation' | 'appointment'>('consultation');
  
  // Consultation Form Fields (Leads)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  // Appointment Form Fields
  const [clientName, setClientName] = useState('');
  const [appointmentEmail, setAppointmentEmail] = useState('');
  const [appointmentPhone, setAppointmentPhone] = useState('');
  const [service, setService] = useState('Mutual Funds');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');

  // Status and Submission States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Submission Handlers
  const handleConsultationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    const fullName = `${firstName} ${lastName}`.trim();
    if (!fullName || !phone || !email || !message) {
      setError("Please fill out all fields.");
      setIsLoading(false);
      return;
    }

    const payload = {
      name: fullName,
      phone: phone,
      email: email,
      message: message,
      form_type: "Consultation Request",
    };

    console.log("Submitting consultation / lead form data:", payload);

    try {
      // 1. Submit to Formspree
      console.log("Submitting to Formspree...");
      let formspreeRes: Response | null = null;
      try {
        formspreeRes = await fetch("https://formspree.io/f/mvzyqerq", {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.warn("Formspree submission error (non-fatal):", err);
      }

      // 2. Submit to Supabase leads table
      console.log("Submitting to Supabase leads...");
      try {
        const res = await supabase
          .from('leads')
          .insert([{
            name: fullName,
            phone: phone,
            email: email,
            message: message,
          }]);
        console.log("Supabase response (leads):", res);
        if (res.error) {
          console.error("Supabase leads error:", res.error);
        }
      } catch (err) {
        console.warn("Supabase insertion error (non-fatal):", err);
      }

      if (formspreeRes && !formspreeRes.ok) {
        const errText = await formspreeRes.text();
        console.error("Formspree returned error response:", errText);
        throw new Error("Unable to submit request to Formspree. Please check if form fields are correct or try again.");
      }

      setSuccessMessage("Thank you! Your consultation request has been submitted successfully via Formspree and registered in our database.");
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setMessage('');
    } catch (err: any) {
      console.error("Submission error:", err);
      setError(err?.message || "An error occurred while submitting. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppointmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (!clientName || !appointmentPhone || !appointmentEmail || !service || !appointmentDate || !appointmentTime) {
      setError("Please fill out all fields.");
      setIsLoading(false);
      return;
    }

    // Combine date and time to compatible ISO format (e.g., YYYY-MM-DDTHH:MM:00)
    const joinedDateTime = `${appointmentDate}T${appointmentTime}:00`;

    const payload = {
      client_name: clientName,
      phone: appointmentPhone,
      email: appointmentEmail,
      service: service,
      appointment_date: joinedDateTime,
      form_type: "Appointment Booking",
    };

    console.log("Submitting appointment form data:", payload);

    try {
      // 1. Submit to Formspree
      console.log("Submitting to Formspree...");
      let formspreeRes: Response | null = null;
      try {
        formspreeRes = await fetch("https://formspree.io/f/mvzyqerq", {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.warn("Formspree submission error (non-fatal):", err);
      }

      // 2. Submit to Supabase appointments table
      console.log("Submitting to Supabase appointments...");
      try {
        const res = await supabase
          .from('appointments')
          .insert([{
            client_name: clientName,
            phone: appointmentPhone,
            email: appointmentEmail,
            service: service,
            appointment_date: joinedDateTime,
          }]);
        console.log("Supabase response (appointments):", res);
        if (res.error) {
          console.error("Supabase appointments error:", res.error);
        }
      } catch (err) {
        console.warn("Supabase insertion error (non-fatal):", err);
      }

      if (formspreeRes && !formspreeRes.ok) {
        const errText = await formspreeRes.text();
        console.error("Formspree returned error response:", errText);
        throw new Error("Unable to book appointment at this time. Please check your network or try again.");
      }

      setSuccessMessage("Success! Your appointment has been booked. We will check availability and get in touch shortly.");
      setClientName('');
      setAppointmentEmail('');
      setAppointmentPhone('');
      setService('Mutual Funds');
      setAppointmentDate('');
      setAppointmentTime('');
    } catch (err: any) {
      console.error("Submission error:", err);
      setError(err?.message || "An error occurred while booking. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };


  // SIP Calculation Logic
  const p = monthlyInvestment;
  const i = returnRate / 100 / 12;
  const n = duration * 12;
  const investedAmount = p * n;
  let maturityAmount = investedAmount;
  if (i > 0) {
    maturityAmount = p * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
  }
  const estimatedReturns = maturityAmount - investedAmount;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', { 
      style: 'currency', 
      currency: 'INR', 
      maximumFractionDigits: 0 
    }).format(Math.round(val));
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-dark)] text-[var(--color-text-main)] font-[var(--font-sans)] selection:bg-[var(--color-accent)] selection:text-[var(--color-bg-dark)]">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-panel border-b-0 border-x-0 border-t-0 shadow-sm shadow-[var(--color-glass)]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg width="48" height="48" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="headerP" x1="0" y1="0" x2="100" y2="100">
                  <stop offset="0%" stopColor="#00E5FF"/>
                  <stop offset="100%" stopColor="#01579B"/>
                </linearGradient>
                <linearGradient id="headerGreen" x1="0" y1="100" x2="50" y2="50">
                  <stop offset="0%" stopColor="#00E676"/>
                  <stop offset="100%" stopColor="#1DE9B6"/>
                </linearGradient>
                <linearGradient id="headerGold" x1="50" y1="100" x2="100" y2="0">
                  <stop offset="0%" stopColor="#A88B32"/>
                  <stop offset="40%" stopColor="#D4AF37"/>
                  <stop offset="100%" stopColor="#F3E5AB"/>
                </linearGradient>
              </defs>
              <path d="M 25 10 H 65 C 85 10 95 25 95 40 C 95 55 85 70 65 70 H 45 V 90 H 25 Z" fill="url(#headerP)" />
              <path d="M 45 35 H 65 C 75 35 75 45 65 45 H 45 Z" fill="var(--color-bg-dark)" />
              <path d="M 25 90 L 45 45 L 55 65 L 40 90 Z" fill="url(#headerGreen)" />
              <path d="M 40 90 L 65 40 L 55 35 h 25 v 20 l -10 -5 L 50 90 Z" fill="url(#headerGold)" />
            </svg>
            <div className="flex flex-col justify-center">
              <span className="font-sans font-black text-xl leading-none text-white tracking-widest uppercase">Pushker</span>
              <span className="font-sans font-bold text-[10px] leading-tight text-[var(--color-text-muted)] tracking-[0.2em] uppercase">Investments</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8 text-[13px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] font-semibold">
            <a href="#about" className="hover:text-[var(--color-text-main)] transition-colors">About Us</a>
            <a href="#services" className="hover:text-[var(--color-text-main)] transition-colors">Services</a>
            <a href="#contact" className="hover:text-[var(--color-text-main)] transition-colors">Contact</a>
          </div>
          <a href="#contact" onClick={() => setContactTab('appointment')} className="bg-[var(--color-accent)] text-[var(--color-bg-dark)] px-6 py-3 rounded-sm font-bold text-[12px] uppercase tracking-wider hover:bg-white transition-colors">
            Book Appointment
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 min-h-[85vh] flex items-center bg-radial-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 mix-blend-overlay"></div>
        <div className="max-w-7xl mx-auto w-full grid md:grid-cols-2 gap-16 items-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <h1 className="font-[var(--font-serif)] text-4xl md:text-5xl lg:text-6xl leading-[1.1] mb-6 font-normal">
              Empowering Your <br/>
              <span className="text-gradient">Financial Future.</span>
            </h1>
            <p className="text-[var(--color-text-muted)] text-lg md:text-xl leading-relaxed mb-10 max-w-[480px]">
              Honest, transparent, and personalized financial solutions to help you build and protect your wealth by Rajesh Kumar Pushker (Pushker Investment).
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <a href="#contact" onClick={() => setContactTab('consultation')} className="bg-[var(--color-accent)] text-[var(--color-bg-dark)] px-8 py-4 rounded-sm font-bold text-[12px] uppercase tracking-wider hover:bg-white transition-colors flex items-center justify-center gap-2">
                Consult With Us <ArrowUpRight size={16} />
              </a>
              <a href="#services" className="border border-[var(--color-border-glass)] text-[var(--color-text-main)] px-8 py-4 rounded-sm font-bold text-[12px] uppercase tracking-wider hover:bg-[var(--color-glass)] transition-colors flex items-center justify-center">
                Our Services
              </a>
            </div>
            <div className="grid grid-cols-2 gap-8 border-t border-[var(--color-border-glass)] pt-8">
              <div>
                <span className="block text-3xl font-semibold text-[var(--color-accent)] mb-1">30 Yrs</span>
                <span className="text-[11px] uppercase tracking-[0.1em] text-[var(--color-text-muted)]">Financial Sector Experience</span>
              </div>
              <div>
                <span className="block text-3xl font-semibold text-[var(--color-accent)] mb-1">NISM & IRDA</span>
                <span className="text-[11px] uppercase tracking-[0.1em] text-[var(--color-text-muted)]">Registered & Qualified</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="hidden md:flex justify-end"
          >
             <div className="relative w-full max-w-xl">
               <div className="absolute inset-0 bg-[var(--color-accent)] rounded-full blur-[120px] opacity-20"></div>
               {/* Video Container designed to crop the bottom watermark */}
               <div className="w-full glass-panel rounded-2xl border-[var(--color-border-glass)] relative overflow-hidden">
                  <div className="relative w-full pb-[50%]"> 
                     {/* 50% aspect ratio instead of 56.25% (16:9) to hide the bottom portion */}
                     <video 
                        src="/video.mp4" 
                        autoPlay 
                        loop 
                        muted 
                        playsInline
                        className="absolute top-0 left-0 w-full h-auto object-cover pointer-events-none"
                     />
                  </div>
                  {/* Subtle gradient at the bottom to blend with UI */}
                  <div className="absolute bottom-0 w-full h-1/4 bg-gradient-to-t from-[var(--color-surface)] to-transparent pointer-events-none opacity-80"></div>
               </div>
             </div>
          </motion.div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="py-24 px-6 bg-[var(--color-surface)] border-y border-[var(--color-border-glass)]">
        <div className="max-w-7xl mx-auto grid md:grid-cols-12 gap-16 items-center">
           <div className="md:col-span-5 relative flex justify-center items-center">
              {/* Square aspect ratio to match picture, rounded full to crop the corner watermark and provide equal borders */}
              <div className="w-full max-w-[380px] aspect-square glass-panel rounded-full p-[10px] relative shadow-lg">
                 <div className="w-full h-full rounded-full overflow-hidden relative bg-black/20">
                   <img src="/IMAGE-1.png" alt="Rajesh Kumar Pushker" className="w-full h-full object-cover scale-[1.08] origin-center translate-y-[-2%]" />
                 </div>
              </div>
           </div>
           <div className="md:col-span-7">
              <h2 className="text-[12px] uppercase tracking-[0.2em] text-[var(--color-accent)] font-bold mb-4">About Wealth Salahkaar</h2>
              <h3 className="font-[var(--font-serif)] text-3xl md:text-4xl mb-6 leading-tight">Expert guidance backed by 30 years of diverse financial experience.</h3>
              
              <div className="space-y-6 text-[var(--color-text-muted)] text-lg leading-relaxed">
                <p>
                  I am Rajesh Kumar Pushker, a dedicated financial professional with nearly 30 years of experience in the financial sector. My career includes around 10 years of banking experience as a Branch Manager, followed by nearly 20 years as an Investment Advisor helping individuals and families make informed financial decisions.
                </p>
                <p>
                  My mission is to guide investors toward the right investment options according to their financial needs, future goals, risk profile, and family security requirements. I strongly believe that proper financial planning is the foundation of long-term wealth creation and financial stability.
                </p>
                <p>
                  As a NISM and IRDA qualified Registered Investment Advisor, I provide professional guidance in Mutual Funds, Demat Accounts, Shares, Bonds, Debentures, NCDs, MLDs, Fixed Deposits, Recurring Deposits, Life Insurance, Health Insurance, and Financial Portfolio Management.
                </p>
                <p>
                  In addition to investment planning, I also help clients understand tax-saving opportunities, taxation on investments, and strategies for better financial management.
                </p>
              </div>
           </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-[var(--font-serif)] text-4xl mb-4">Our Services</h2>
            <p className="text-[var(--color-text-muted)] max-w-2xl mx-auto text-lg">
              We provide comprehensive financial and investment advisory services designed to help clients achieve financial security and long-term wealth creation.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="glass-panel p-8 rounded-xl">
              <div className="flex items-center gap-4 mb-6">
                 <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center text-[var(--color-accent)]">
                   <Landmark size={24} />
                 </div>
                 <h3 className="text-xl font-medium">Investment Advisory Services</h3>
              </div>
              <ul className="space-y-3 text-[var(--color-text-muted)]">
                 <li className="flex items-start gap-3"><ChevronRight size={18} className="text-[var(--color-accent)] mt-0.5 shrink-0" /> Mutual Fund Investment Guidance</li>
                 <li className="flex items-start gap-3"><ChevronRight size={18} className="text-[var(--color-accent)] mt-0.5 shrink-0" /> Demat Account Opening & Support</li>
                 <li className="flex items-start gap-3"><ChevronRight size={18} className="text-[var(--color-accent)] mt-0.5 shrink-0" /> Share Market & Equity Investment Advisory</li>
                 <li className="flex items-start gap-3"><ChevronRight size={18} className="text-[var(--color-accent)] mt-0.5 shrink-0" /> Bonds, Debentures, NCD & MLD Investment Solutions</li>
                 <li className="flex items-start gap-3"><ChevronRight size={18} className="text-[var(--color-accent)] mt-0.5 shrink-0" /> Fixed Deposit (FD) & Recurring Deposit (RD) Planning</li>
              </ul>
            </div>

            <div className="glass-panel p-8 rounded-xl">
              <div className="flex items-center gap-4 mb-6">
                 <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center text-[var(--color-accent)]">
                   <Shield size={24} />
                 </div>
                 <h3 className="text-xl font-medium">Insurance Services</h3>
              </div>
              <ul className="space-y-3 text-[var(--color-text-muted)]">
                 <li className="flex items-start gap-3"><ChevronRight size={18} className="text-[var(--color-accent)] mt-0.5 shrink-0" /> Life Insurance Planning</li>
                 <li className="flex items-start gap-3"><ChevronRight size={18} className="text-[var(--color-accent)] mt-0.5 shrink-0" /> Health Insurance Advisory</li>
                 <li className="flex items-start gap-3"><ChevronRight size={18} className="text-[var(--color-accent)] mt-0.5 shrink-0" /> Family Protection Planning</li>
                 <li className="flex items-start gap-3"><ChevronRight size={18} className="text-[var(--color-accent)] mt-0.5 shrink-0" /> Retirement & Child Future Planning</li>
              </ul>
            </div>

            <div className="glass-panel p-8 rounded-xl">
              <div className="flex items-center gap-4 mb-6">
                 <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center text-[var(--color-accent)]">
                   <Briefcase size={24} />
                 </div>
                 <h3 className="text-xl font-medium">Wealth & Portfolio Management</h3>
              </div>
              <ul className="space-y-3 text-[var(--color-text-muted)]">
                 <li className="flex items-start gap-3"><ChevronRight size={18} className="text-[var(--color-accent)] mt-0.5 shrink-0" /> Financial Portfolio Management</li>
                 <li className="flex items-start gap-3"><ChevronRight size={18} className="text-[var(--color-accent)] mt-0.5 shrink-0" /> Goal-Based Investment Planning</li>
                 <li className="flex items-start gap-3"><ChevronRight size={18} className="text-[var(--color-accent)] mt-0.5 shrink-0" /> Long-Term Wealth Creation Strategies</li>
                 <li className="flex items-start gap-3"><ChevronRight size={18} className="text-[var(--color-accent)] mt-0.5 shrink-0" /> Risk Assessment & Portfolio Review</li>
                 <li className="flex items-start gap-3"><ChevronRight size={18} className="text-[var(--color-accent)] mt-0.5 shrink-0" /> Retirement Corpus Planning</li>
              </ul>
            </div>

            <div className="glass-panel p-8 rounded-xl">
              <div className="flex items-center gap-4 mb-6">
                 <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center text-[var(--color-accent)]">
                   <FileText size={24} />
                 </div>
                 <h3 className="text-xl font-medium">Tax Saving & Financial Planning</h3>
              </div>
              <ul className="space-y-3 text-[var(--color-text-muted)]">
                 <li className="flex items-start gap-3"><ChevronRight size={18} className="text-[var(--color-accent)] mt-0.5 shrink-0" /> Tax Saving Investment Solutions</li>
                 <li className="flex items-start gap-3"><ChevronRight size={18} className="text-[var(--color-accent)] mt-0.5 shrink-0" /> Guidance on Taxable & Tax-Free Investments</li>
                 <li className="flex items-start gap-3"><ChevronRight size={18} className="text-[var(--color-accent)] mt-0.5 shrink-0" /> Financial Planning According to Individual Needs</li>
                 <li className="flex items-start gap-3"><ChevronRight size={18} className="text-[var(--color-accent)] mt-0.5 shrink-0" /> Wealth Protection & Future Security Planning</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 text-center">
            <p className="text-lg italic text-[var(--color-text-main)] font-[var(--font-serif)]">
              "We focus on providing the right financial advice at the right time so that our clients can make confident and informed financial decisions."
            </p>
          </div>
        </div>
      </section>

      {/* ROI Calculator Section (Kept from Sophisticated Template to fulfill "modern fintech" vibe) */}
      <section className="py-24 px-6 bg-[var(--color-surface)] border-y border-[var(--color-border-glass)]">
        <div className="max-w-4xl mx-auto text-center glass-panel p-8 md:p-12 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--color-accent)] to-transparent"></div>
          <Calculator size={40} className="mx-auto text-[var(--color-accent)] mb-6" />
          <h2 className="font-[var(--font-serif)] text-3xl mb-4">Project Your Growth.</h2>
          <p className="text-[var(--color-text-muted)] mb-8">Utilize our simple calculator tool to see the power of compounding over time.</p>
          
          <div className="text-left border-t border-[var(--color-border-glass)] pt-12 mt-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                {/* Monthly Investment */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-[12px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Monthly Investment (₹)</label>
                    <input 
                      type="number" 
                      min="500" 
                      value={monthlyInvestment}
                      onChange={(e) => setMonthlyInvestment(Math.max(0, Number(e.target.value)))}
                      className="bg-black/30 border border-[var(--color-border-glass)] rounded px-3 py-1.5 text-sm font-medium text-[var(--color-accent)] w-32 text-right focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                    />
                  </div>
                  <input 
                    type="range" 
                    min="500" 
                    max="1000000" 
                    step="500"
                    value={monthlyInvestment}
                    onChange={(e) => setMonthlyInvestment(Number(e.target.value))}
                    className="w-full h-1 bg-[var(--color-border-glass)] rounded-lg appearance-none cursor-pointer accent-[var(--color-accent)]" 
                  />
                  <div className="flex justify-between mt-2 text-xs text-[var(--color-text-muted)] font-medium"><span>₹500</span><span>₹10,00,000</span></div>
                </div>
                
                {/* Expected Return Rate */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-[12px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Expected Return Rate (p.a %)</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="30" 
                      value={returnRate}
                      onChange={(e) => setReturnRate(Math.max(0, Number(e.target.value)))}
                      className="bg-black/30 border border-[var(--color-border-glass)] rounded px-3 py-1.5 text-sm font-medium text-[var(--color-accent)] w-24 text-right focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                    />
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="30" 
                    step="0.5"
                    value={returnRate}
                    onChange={(e) => setReturnRate(Number(e.target.value))}
                    className="w-full h-1 bg-[var(--color-border-glass)] rounded-lg appearance-none cursor-pointer accent-[var(--color-accent)]" 
                  />
                  <div className="flex justify-between mt-2 text-xs text-[var(--color-text-muted)] font-medium"><span>1%</span><span>30%</span></div>
                </div>

                {/* Duration */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-[12px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Time Period (Years)</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="40" 
                      value={duration}
                      onChange={(e) => setDuration(Math.max(1, Number(e.target.value)))}
                      className="bg-black/30 border border-[var(--color-border-glass)] rounded px-3 py-1.5 text-sm font-medium text-[var(--color-accent)] w-24 text-right focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                    />
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="40" 
                    step="1"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full h-1 bg-[var(--color-border-glass)] rounded-lg appearance-none cursor-pointer accent-[var(--color-accent)]" 
                  />
                  <div className="flex justify-between mt-2 text-xs text-[var(--color-text-muted)] font-medium"><span>1 Yr</span><span>40 Yrs</span></div>
                </div>
              </div>

              {/* Display Area */}
              <div className="bg-black/40 p-8 rounded-2xl border border-[var(--color-border-glass)] flex flex-col justify-center h-full">
                <div className="space-y-8">
                  <div>
                    <div className="text-[12px] uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Invested Amount</div>
                    <div className="text-2xl font-medium text-white">{formatCurrency(investedAmount)}</div>
                  </div>
                  <div>
                    <div className="text-[12px] uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Est. Returns</div>
                    <div className="text-2xl font-medium text-[#4ADE80]">{formatCurrency(estimatedReturns)}</div>
                  </div>
                  <div className="pt-6 border-t border-[var(--color-border-glass)]">
                    <div className="text-[12px] uppercase tracking-widest text-[var(--color-text-muted)] mb-3 font-bold">Total Value</div>
                    <div className="text-4xl md:text-5xl font-[var(--font-serif)] text-[var(--color-accent)]">{formatCurrency(maturityAmount)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-32 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16">
          <div>
            <h2 className="font-[var(--font-serif)] text-4xl mb-6">Contact Wealth Salahkaar</h2>
            <p className="text-[var(--color-text-muted)] text-lg mb-10">
              For professional guidance related to investments, insurance, tax-saving strategies, and wealth creation, feel free to contact us.
            </p>
            
            <div className="space-y-8">
               <div>
                  <h4 className="text-[11px] uppercase tracking-widest text-[var(--color-accent)] font-bold mb-2">Advisor Details</h4>
                  <p className="font-medium text-lg">Rajesh Kumar Pushker</p>
                  <p className="text-[var(--color-text-muted)]">Organization: Pushker Investment</p>
               </div>
               
               <div>
                  <h4 className="text-[11px] uppercase tracking-widest text-[var(--color-accent)] font-bold mb-2">Reach Out</h4>
                  <p className="text-[var(--color-text-muted)]">Mobile: <a href="tel:+917007957858" className="text-[var(--color-text-main)] hover:text-[var(--color-accent)] transition-colors">+91-7007957858</a></p>
                  <p className="text-[var(--color-text-muted)]">Office: <span className="text-[var(--color-text-main)]">0522-4332441</span></p>
                  <p className="text-[var(--color-text-muted)] mt-1">Website: <a href="https://wealthsalahkaar.com" target="_blank" rel="noreferrer" className="text-[var(--color-text-main)] hover:text-[var(--color-accent)] transition-colors">wealthsalahkaar.com</a></p>
               </div>

               <div>
                  <h4 className="text-[11px] uppercase tracking-widest text-[var(--color-accent)] font-bold mb-2">Office Address</h4>
                  <p className="text-[var(--color-text-muted)]">
                     Rajajipuram, Lucknow – 226017<br/>
                     Uttar Pradesh, India
                  </p>
               </div>
            </div>
          </div>
          
          <div className="glass-panel p-10 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--color-accent)] to-transparent"></div>
            
            <div className="flex border-b border-[var(--color-border-glass)] mb-8">
              <button 
                type="button"
                onClick={() => {
                  setContactTab('consultation');
                  setSuccessMessage(null);
                  setError(null);
                }}
                className={`flex-1 pb-4 text-[12px] uppercase tracking-wider font-bold transition-colors relative ${
                  contactTab === 'consultation' 
                    ? 'text-[var(--color-accent)]' 
                    : 'text-[var(--color-text-muted)] hover:text-white'
                }`}
              >
                Schedule Consultation
                {contactTab === 'consultation' && (
                  <motion.div 
                    layoutId="activeTabUnderline" 
                    className="absolute bottom-0 left-0 w-full h-[2px] bg-[var(--color-accent)]" 
                  />
                )}
              </button>
              <button 
                type="button"
                onClick={() => {
                  setContactTab('appointment');
                  setSuccessMessage(null);
                  setError(null);
                }}
                className={`flex-1 pb-4 text-[12px] uppercase tracking-wider font-bold transition-colors relative ${
                  contactTab === 'appointment' 
                    ? 'text-[var(--color-accent)]' 
                    : 'text-[var(--color-text-muted)] hover:text-white'
                }`}
              >
                Book Appointment
                {contactTab === 'appointment' && (
                  <motion.div 
                    layoutId="activeTabUnderline" 
                    className="absolute bottom-0 left-0 w-full h-[2px] bg-[var(--color-accent)]" 
                  />
                )}
              </button>
            </div>

            {/* Success and Error messages */}
            <AnimatePresence mode="wait">
              {successMessage && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded mb-6 text-xs font-semibold tracking-wide uppercase"
                >
                  {successMessage}
                </motion.div>
              )}
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded mb-6 text-xs font-semibold tracking-wide uppercase"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {contactTab === 'consultation' ? (
              /* Leads Form */
              <form className="space-y-6" onSubmit={handleConsultationSubmit}>
                <div className="grid grid-cols-2 gap-6">
                   <div>
                      <label className="block text-[11px] uppercase tracking-wider text-[var(--color-text-muted)] mb-2">First Name</label>
                      <input 
                        type="text" 
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full bg-black/20 border border-[var(--color-border-glass)] rounded p-3 text-white focus:outline-none focus:border-[var(--color-accent)] transition-colors" 
                        placeholder="John" 
                      />
                   </div>
                   <div>
                      <label className="block text-[11px] uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Last Name</label>
                      <input 
                        type="text" 
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full bg-black/20 border border-[var(--color-border-glass)] rounded p-3 text-white focus:outline-none focus:border-[var(--color-accent)] transition-colors" 
                        placeholder="Doe" 
                      />
                   </div>
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/20 border border-[var(--color-border-glass)] rounded p-3 text-white focus:outline-none focus:border-[var(--color-accent)] transition-colors" 
                    placeholder="john@example.com" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Phone Number</label>
                  <input 
                    type="tel" 
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-black/20 border border-[var(--color-border-glass)] rounded p-3 text-white focus:outline-none focus:border-[var(--color-accent)] transition-colors" 
                    placeholder="+91 98765 43210" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Message</label>
                  <textarea 
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full bg-black/20 border border-[var(--color-border-glass)] rounded p-3 text-white focus:outline-none focus:border-[var(--color-accent)] transition-colors h-32" 
                    placeholder="How can we help you?"
                  ></textarea>
                </div>
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-[var(--color-accent)] text-black px-6 py-4 rounded-sm font-bold text-[12px] uppercase tracking-[0.1em] hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Submitting Request..." : "Submit Consultation Request"}
                </button>
              </form>
            ) : (
              /* Appointments booking form */
              <form className="space-y-6" onSubmit={handleAppointmentSubmit}>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full bg-black/20 border border-[var(--color-border-glass)] rounded p-3 text-white focus:outline-none focus:border-[var(--color-accent)] transition-colors" 
                    placeholder="John Doe" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Email Address</label>
                    <input 
                      type="email" 
                      required
                      value={appointmentEmail}
                      onChange={(e) => setAppointmentEmail(e.target.value)}
                      className="w-full bg-black/20 border border-[var(--color-border-glass)] rounded p-3 text-white focus:outline-none focus:border-[var(--color-accent)] transition-colors" 
                      placeholder="john@example.com" 
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Phone Number</label>
                    <input 
                      type="tel" 
                      required
                      value={appointmentPhone}
                      onChange={(e) => setAppointmentPhone(e.target.value)}
                      className="w-full bg-black/20 border border-[var(--color-border-glass)] rounded p-3 text-white focus:outline-none focus:border-[var(--color-accent)] transition-colors" 
                      placeholder="+91 98765 43210" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Preferred Financial Service</label>
                  <select 
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    className="w-full bg-[var(--color-surface)] border border-[var(--color-border-glass)] rounded p-3 text-white focus:outline-none focus:border-[var(--color-accent)] transition-colors cursor-pointer"
                  >
                    <option value="Mutual Funds">Mutual Fund Investment & SIPs</option>
                    <option value="Demat & Share Market">Demat Account & Share Market Advisory</option>
                    <option value="Bonds & Fixed Income">Bonds, Debentures, NCD, MLD, FDs</option>
                    <option value="Insurance Planning">Life & Health Insurance Planning</option>
                    <option value="Portfolio Management">Financial Portfolio & Goal-Based Planning</option>
                    <option value="Tax Saving Strategies">Tax Saving Investment Solutions</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Appointment Date</label>
                  <input 
                    type="date" 
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    style={{ colorScheme: 'dark' }}
                    className="w-full bg-black/20 border border-[var(--color-border-glass)] text-white p-3 rounded focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] transition-all cursor-pointer font-sans text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Preferred Time</label>
                  <input 
                    type="time" 
                    required
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    style={{ colorScheme: 'dark' }}
                    className="w-full bg-black/20 border border-[var(--color-border-glass)] text-white p-3 rounded focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] transition-all cursor-pointer font-sans text-sm" 
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-[var(--color-accent)] text-black px-6 py-4 rounded-sm font-bold text-[12px] uppercase tracking-[0.1em] hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Booking..." : "Book Appointment"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border-glass)] bg-[#020408] pt-16 pb-8 px-6 text-center md:text-left">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col md:flex-row items-center gap-3 justify-center md:justify-start mb-6 md:mb-0">
            <svg width="64" height="64" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="footerP" x1="0" y1="0" x2="100" y2="100">
                  <stop offset="0%" stopColor="#00E5FF"/>
                  <stop offset="100%" stopColor="#01579B"/>
                </linearGradient>
                <linearGradient id="footerGreen" x1="0" y1="100" x2="50" y2="50">
                  <stop offset="0%" stopColor="#00E676"/>
                  <stop offset="100%" stopColor="#1DE9B6"/>
                </linearGradient>
                <linearGradient id="footerGold" x1="50" y1="100" x2="100" y2="0">
                  <stop offset="0%" stopColor="#A88B32"/>
                  <stop offset="40%" stopColor="#D4AF37"/>
                  <stop offset="100%" stopColor="#F3E5AB"/>
                </linearGradient>
              </defs>
              <path d="M 25 10 H 65 C 85 10 95 25 95 40 C 95 55 85 70 65 70 H 45 V 90 H 25 Z" fill="url(#footerP)" />
              <path d="M 45 35 H 65 C 75 35 75 45 65 45 H 45 Z" fill="#020408" />
              <path d="M 25 90 L 45 45 L 55 65 L 40 90 Z" fill="url(#footerGreen)" />
              <path d="M 40 90 L 65 40 L 55 35 h 25 v 20 l -10 -5 L 50 90 Z" fill="url(#footerGold)" />
            </svg>
            <div className="flex flex-col justify-center text-center md:text-left">
              <span className="font-sans font-black text-2xl leading-none text-white tracking-widest uppercase">Pushker</span>
              <span className="font-sans font-bold text-[11px] leading-tight text-[var(--color-text-muted)] tracking-[0.2em] uppercase mt-1">Investments</span>
            </div>
          </div>
          <p className="text-[var(--color-text-muted)] text-sm max-w-sm italic">
            "We are committed to helping you build a secure financial future with trusted advice and personalized financial solutions."
          </p>
        </div>
        <div className="max-w-7xl mx-auto pt-8 mt-8 border-t border-[var(--color-border-glass)] flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider">
          <p>© {new Date().getFullYear()} Pushker Investment (Wealth Salahkaar). All rights reserved. | Made by Eklavya</p>
          <div className="flex gap-6">
            <span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-white cursor-pointer transition-colors">Terms of Service</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

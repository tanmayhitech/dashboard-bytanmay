import React, { useState, useEffect } from 'react';
import { useShop } from '../../context/ShopContext';
import { ArrowUpRight, Check, ArrowRight, Shield } from 'lucide-react';

export const MinimalFooter = () => {
  const { navigateTo, setActiveModal } = useShop();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [bombayTime, setBombayTime] = useState('');

  // Realtime Bombay Clock (IST: UTC+5:30)
  useEffect(() => {
    const updateTime = () => {
      const options = {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      };
      setBombayTime(new Intl.DateTimeFormat('en-US', options).format(new Date()));
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setSubscribed(true);
    setTimeout(() => {
      setEmail('');
      setSubscribed(false);
    }, 4000);
  };

  return (
    <footer className="relative w-full bg-[#050505] text-[#EDE7DC] pt-16 pb-12 px-5 sm:px-10 lg:px-14 select-none border-t border-white/[0.04]">
      <div className="max-w-[1760px] mx-auto space-y-16">
        
        {/* Top Tier: Wordmark + VIP Newsletter Box */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start pb-12 border-b border-white/[0.06]">
          
          {/* Brand Wordmark & Ethos */}
          <div className="lg:col-span-6 space-y-4">
            <button
              onClick={() => navigateTo('home')}
              className="font-sans text-xl sm:text-2xl font-black tracking-[0.3em] uppercase text-[#EDE7DC] hover:text-white transition-colors"
            >
              LOOZARS®
            </button>
            <p className="font-mono text-xs text-[#8E8D8A] max-w-md uppercase tracking-wider leading-relaxed">
              AN INDEPENDENT FASHION ATELIER CRAFTING CONTEMPORARY HEAVYWEIGHT SILHOUETTES IN BOMBAY. 
            </p>
            <div className="font-mono text-[10px] text-[#8E1717] tracking-widest uppercase flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8E1717] animate-pulse"></span>
              <span>BOMBAY TIME // {bombayTime || '11:30:00 AM IST'}</span>
            </div>
          </div>

          {/* VIP Drop Early Access Subscription */}
          <div className="lg:col-span-6 space-y-3">
            <span className="font-mono text-[10px] text-[#8E8D8A] tracking-[0.25em] uppercase block">
              SUBSCRIBE TO PRIVATE DROP NOTIFICATIONS
            </span>

            {subscribed ? (
              <div className="p-3 bg-[#111111] border border-[#8E1717]/50 text-[#EDE7DC] font-mono text-xs tracking-wider flex items-center gap-2">
                <Check size={14} className="text-[#A3E635]" />
                <span>CONFIRMED. YOU ARE ON THE PRIVATE ALLOCATION LIST.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex items-center gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ENTER YOUR EMAIL FOR EARLY ACCESS"
                  required
                  className="w-full bg-[#0d0d0d] border border-white/10 px-4 py-3 font-mono text-xs text-[#EDE7DC] placeholder-[#8E8D8A]/60 focus:outline-none focus:border-[#EDE7DC] transition-colors"
                />
                <button
                  type="submit"
                  className="px-5 py-3 bg-[#EDE7DC] text-[#070707] hover:bg-[#8E1717] hover:text-white font-mono text-xs font-bold tracking-widest uppercase transition-all duration-300 flex-shrink-0 flex items-center gap-2"
                >
                  <span>JOIN</span>
                  <ArrowRight size={12} />
                </button>
              </form>
            )}

            <p className="font-mono text-[9px] text-[#8E8D8A]/70 tracking-widest uppercase">
              NO SPAM. ONLY PRIVATE ACCESS TO STRICTLY NUMBERED DROPS.
            </p>
          </div>

        </div>

        {/* Bottom Tier: Links, Policies, Socials, Copyright */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 font-mono text-[10px] tracking-[0.2em] uppercase text-[#8E8D8A]">
          
          {/* Policy Modals */}
          <div className="flex flex-wrap items-center gap-5 sm:gap-7">
            <button onClick={() => setActiveModal('shipping')} className="hover:text-[#EDE7DC] transition-colors">
              SHIPPING
            </button>
            <button onClick={() => setActiveModal('returns')} className="hover:text-[#EDE7DC] transition-colors">
              RETURNS
            </button>
            <button onClick={() => setActiveModal('sizing')} className="hover:text-[#EDE7DC] transition-colors">
              SIZING
            </button>
            <button onClick={() => setActiveModal('contact')} className="hover:text-[#EDE7DC] transition-colors">
              CONTACT
            </button>
            <a
              href="https://www.instagram.com/theloozars/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#EDE7DC] transition-colors flex items-center gap-1 text-[#EDE7DC]"
            >
              <span>INSTAGRAM</span>
              <ArrowUpRight size={10} className="text-[#8E1717]" />
            </a>
          </div>

          {/* Right: Copyright & Admin Portal */}
          <div className="flex items-center gap-4 text-white/40">
            <button
              onClick={() => navigateTo('admin')}
              className="hover:text-[#EDE7DC] transition-colors flex items-center gap-1"
              title="Admin Portal"
            >
              <Shield size={10} />
              <span className="text-[9px]">STAFF</span>
            </button>
            <span>•</span>
            <span>© 2026 LOOZARS ATELIER. ALL RIGHTS RESERVED.</span>
          </div>

        </div>

      </div>
    </footer>
  );
};

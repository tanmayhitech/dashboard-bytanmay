import React, { useEffect } from 'react';
import Lenis from 'lenis';
import { useShop } from './context/ShopContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { SearchModal } from './components/SearchModal';
import { PolicyModals } from './components/PolicyModals';
import { CustomCursor } from './components/CustomCursor';

// Pages
import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { DropsPage } from './pages/DropsPage';
import { AboutPage } from './pages/AboutPage';
import { ProductPage } from './pages/ProductPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { LoginPage } from './pages/auth/LoginPage';
import { AdminPortal } from './pages/admin/AdminPortal';
import { InfluencerPortal } from './pages/influencer/InfluencerPortal';

export const App = () => {
  const { currentView } = useShop();
  const isAdminView = currentView === 'admin';
  const isInfluencerView = currentView === 'influencer';

  // Initialize Lenis smooth scroll for storefront
  useEffect(() => {
    if (isAdminView || isInfluencerView) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.5,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    const rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, [isAdminView, isInfluencerView]);

  // Clean standalone Admin Portal layout (No grain, no storefront header/footer, no custom cursor)
  if (isAdminView) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-[#f4f4f5] font-sans antialiased selection:bg-rose-600 selection:text-white">
        <AdminPortal />
      </div>
    );
  }

  // Clean standalone Creator / Influencer Portal layout
  if (isInfluencerView) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-[#f4f4f5] font-sans antialiased selection:bg-white selection:text-black">
        <InfluencerPortal />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] text-[#EDE7DC] flex flex-col justify-between selection:bg-[#8E1717] selection:text-white relative">
      
      {/* Subtle Analog Film Grain Overlay for Storefront */}
      <div className="film-grain pointer-events-none" />

      {/* Desktop Custom Cursor */}
      <CustomCursor />

      {/* 01 — HEADER */}
      <Header />

      {/* Dynamic View Router */}
      <div className="flex-1 w-full">
        {currentView === 'home' && <HomePage />}
        {currentView === 'shop' && <ShopPage />}
        {currentView === 'drops' && <DropsPage />}
        {currentView === 'about' && <AboutPage />}
        {currentView === 'product' && <ProductPage />}
        {currentView === 'cart' && <CartPage />}
        {currentView === 'checkout' && <CheckoutPage />}
        {currentView === 'confirmation' && <OrderConfirmationPage />}
        {currentView === 'login' && <LoginPage />}
        {currentView === '404' && <NotFoundPage />}
      </div>

      {/* 07 — FOOTER (Non-home pages) */}
      {currentView !== 'home' && <Footer />}

      {/* Global Interactive Drawers & Overlays */}
      <CartDrawer />
      <SearchModal />
      <PolicyModals />

    </div>
  );
};

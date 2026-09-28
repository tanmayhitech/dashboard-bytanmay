import React from 'react';
import { useShop } from '../context/ShopContext';
import { X, Mail, MapPin, Phone, Shield, ArrowRight } from 'lucide-react';

export const PolicyModals = () => {
  const { activeModal, setActiveModal } = useShop();

  if (!activeModal) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      
      {/* Background click */}
      <div className="absolute inset-0" onClick={() => setActiveModal(null)} />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl bg-[#0e0e0e] border border-[#222222] p-6 sm:p-10 shadow-2xl z-10 space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Modal Close */}
        <div className="flex items-center justify-between border-b border-[#1c1c1c] pb-4">
          <span className="font-mono text-xs text-[#A62626] tracking-[0.25em] uppercase font-bold">
            LOOZARS® // {activeModal.toUpperCase()}
          </span>
          <button 
            onClick={() => setActiveModal(null)}
            className="text-[#8E8D8A] hover:text-[#F5F4F0] p-1 transition-colors"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* 1. CONTACT MODAL */}
        {activeModal === 'contact' && (
          <div className="space-y-6 font-mono text-xs text-[#8E8D8A]">
            <h3 className="font-editorial text-2xl sm:text-3xl text-[#F5F4F0] uppercase">
              STUDIO & DIRECT INQUIRIES
            </h3>
            
            <p className="leading-relaxed">
              We operate an independent design studio in Mumbai and dispatch nationwide across India. For customer support, sizing consultation, or editorial collaborations:
            </p>

            <div className="space-y-3 border-t border-[#1a1a1a] pt-4">
              <div className="flex items-center gap-3 text-[#F5F4F0]">
                <Mail size={15} className="text-[#A62626]" />
                <span>support@loozars.in / press@loozars.in</span>
              </div>
              <div className="flex items-center gap-3 text-[#F5F4F0]">
                <MapPin size={15} className="text-[#A62626]" />
                <span>LOOZARS Atelier, Bandra West, Mumbai, MH 400050, India</span>
              </div>
              <div className="flex items-center gap-3 text-[#F5F4F0]">
                <Phone size={15} className="text-[#A62626]" />
                <span>Mon–Sat: 11:00 AM – 8:00 PM IST</span>
              </div>
            </div>
          </div>
        )}

        {/* 2. SHIPPING MODAL */}
        {activeModal === 'shipping' && (
          <div className="space-y-6 font-mono text-xs text-[#8E8D8A]">
            <h3 className="font-editorial text-2xl sm:text-3xl text-[#F5F4F0] uppercase">
              PAN-INDIA SHIPPING POLICY
            </h3>
            
            <div className="space-y-3 leading-relaxed">
              <p className="text-[#F5F4F0] font-bold">• DISPATCH TIMELINE</p>
              <p>All orders from DROP 01 are processed and dispatched within 24 to 48 business hours from our Mumbai facility.</p>
              
              <p className="text-[#F5F4F0] font-bold pt-2">• DELIVERY TIMELINE</p>
              <p>Metro Cities (Mumbai, Delhi NCR, Bengaluru, Hyderabad, Chennai, Kolkata): 2–3 business days.</p>
              <p>Rest of India: 3–5 business days via Delhivery, BlueDart, and DTDC Express.</p>
              
              <p className="text-[#F5F4F0] font-bold pt-2">• SHIPPING CHARGES</p>
              <p>Free standard express shipping on all orders above ₹2,000. Flat ₹99 for orders below ₹2,000.</p>
            </div>
          </div>
        )}

        {/* 3. RETURNS MODAL */}
        {activeModal === 'returns' && (
          <div className="space-y-6 font-mono text-xs text-[#8E8D8A]">
            <h3 className="font-editorial text-2xl sm:text-3xl text-[#F5F4F0] uppercase">
              7-DAY RETURN & EXCHANGE POLICY
            </h3>
            
            <div className="space-y-3 leading-relaxed">
              <p>We want you to wear what feels authentic. If the sizing is not exact, we offer a 7-day hassle-free reverse pickup exchange.</p>
              <p className="text-[#F5F4F0] font-bold pt-2">• CONDITIONS</p>
              <p>1. Garment must be unworn, unwashed, with original brand tags and archive zip bags intact.</p>
              <p>2. Size exchanges are processed immediately once the reverse pickup is scanned.</p>
              <p>3. Store credit or 100% refund to original payment source (UPI/Card) or bank transfer for COD.</p>
            </div>
          </div>
        )}

        {/* 4. SIZE GUIDE MODAL */}
        {activeModal === 'size-guide' && (
          <div className="space-y-6 font-mono text-xs text-[#8E8D8A]">
            <h3 className="font-editorial text-2xl sm:text-3xl text-[#F5F4F0] uppercase">
              BOX STREETWEAR SIZING CHART
            </h3>
            
            <p className="leading-relaxed">
              All LOOZARS garments are engineered with an intentionally oversized drop-shoulder cut. Measurements are in inches.
            </p>

            <div className="overflow-x-auto border border-[#222222]">
              <table className="w-full text-left font-mono text-[11px]">
                <thead className="bg-[#161616] text-[#F5F4F0] border-b border-[#222222]">
                  <tr>
                    <th className="p-2.5">SIZE</th>
                    <th className="p-2.5">CHEST</th>
                    <th className="p-2.5">LENGTH</th>
                    <th className="p-2.5">SHOULDER</th>
                    <th className="p-2.5">FIT PROFILE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#181818] text-[#8E8D8A]">
                  <tr>
                    <td className="p-2.5 font-bold text-[#F5F4F0]">S</td>
                    <td className="p-2.5">44"</td>
                    <td className="p-2.5">29"</td>
                    <td className="p-2.5">21"</td>
                    <td className="p-2.5">Relaxed Boxy</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-[#F5F4F0]">M</td>
                    <td className="p-2.5">46"</td>
                    <td className="p-2.5">30"</td>
                    <td className="p-2.5">22"</td>
                    <td className="p-2.5">Oversized Drop</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-[#F5F4F0]">L</td>
                    <td className="p-2.5">48"</td>
                    <td className="p-2.5">31"</td>
                    <td className="p-2.5">23"</td>
                    <td className="p-2.5">Heavy Street Box</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-[#F5F4F0]">XL</td>
                    <td className="p-2.5">50"</td>
                    <td className="p-2.5">32"</td>
                    <td className="p-2.5">24"</td>
                    <td className="p-2.5">Ultra Oversized</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-[#F5F4F0]">XXL</td>
                    <td className="p-2.5">52"</td>
                    <td className="p-2.5">33"</td>
                    <td className="p-2.5">25"</td>
                    <td className="p-2.5">Maximum Volume</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="pt-2">
          <button
            onClick={() => setActiveModal(null)}
            className="w-full py-3 bg-[#181818] hover:bg-[#A62626] text-[#F5F4F0] font-mono text-xs tracking-widest uppercase transition-colors"
          >
            CLOSE
          </button>
        </div>

      </div>
    </div>
  );
};

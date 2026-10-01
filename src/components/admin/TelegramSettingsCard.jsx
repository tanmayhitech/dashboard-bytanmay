import React, { useState, useEffect } from 'react';
import { 
  getTelegramSettings, 
  updateTelegramSettings, 
  testTelegramConnection,
  DEFAULT_TELEGRAM_CONFIG 
} from '../../services/storeSettingsService';
import { 
  Bell, 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  Eye, 
  EyeOff, 
  Save, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp, 
  HelpCircle,
  ShieldCheck,
  Send
} from 'lucide-react';

export const TelegramSettingsCard = () => {
  const [config, setConfig] = useState(DEFAULT_TELEGRAM_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error' | 'info', message: '' }
  const [showGuide, setShowGuide] = useState(false);
  const [configSource, setConfigSource] = useState('defaults');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const res = await getTelegramSettings();
      if (res.success && res.settings) {
        setConfig(res.settings);
        setConfigSource(res.source);
      }
    } catch (err) {
      console.warn('[TelegramSettingsCard] Failed to load settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (key) => {
    setConfig(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setFeedback(null);
    try {
      const res = await updateTelegramSettings(config);
      if (res.success) {
        setFeedback({
          type: 'success',
          message: 'Telegram integration settings saved successfully to store database.'
        });
      } else {
        setFeedback({
          type: 'error',
          message: res.error || 'Failed to save settings.'
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Error saving settings.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestPing = async () => {
    if (!config.bot_token || !config.admin_chat_ids) {
      setFeedback({
        type: 'error',
        message: 'Please enter both a Bot Token and Admin Chat ID before testing.'
      });
      return;
    }

    setIsTesting(true);
    setFeedback({
      type: 'info',
      message: 'Dispatching test alert to Telegram...'
    });

    try {
      const res = await testTelegramConnection(config);
      if (res.success) {
        setFeedback({
          type: 'success',
          message: `🟢 Test successful! Bot alert delivered to your Telegram app (Message ID: ${res.messageId || 'OK'}).`
        });
      } else {
        setFeedback({
          type: 'error',
          message: res.error || res.reason || 'Telegram API returned an error. Verify your Bot Token and Chat ID.'
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Error sending test ping.'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const isConfigured = Boolean(config.bot_token && config.admin_chat_ids);

  return (
    <div className="bg-[#16161A] border border-[#24242A] rounded-2xl p-5 sm:p-6 space-y-6 font-sans">
      
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#222228] pb-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1C1C24] border border-[#2A2A38] flex items-center justify-center text-zinc-200 shrink-0 mt-0.5">
            <Bell size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-sm sm:text-base font-semibold text-zinc-100">
                Telegram Operations & Dispatch Integration
              </h3>
              {isConfigured && config.is_active ? (
                <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Sync Active
                </span>
              ) : (
                <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 font-semibold">
                  Unconfigured
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Real-time order notifications, VIP alerts, 1-click fulfillment, and inventory restock buttons directly on your smartphone.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start lg:self-center">
          <button
            type="button"
            onClick={() => setShowGuide(prev => !prev)}
            className="px-3 py-1.5 bg-[#1E1E26] hover:bg-[#282834] text-zinc-300 border border-[#2C2C3C] rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <HelpCircle size={13} />
            <span>{showGuide ? 'Hide Setup Guide' : '60s Setup Guide'}</span>
            {showGuide ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {/* Accordion: 60-Second Setup Guide */}
      {showGuide && (
        <div className="p-4 rounded-xl bg-[#121216] border border-[#262634] text-xs space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between pb-2 border-b border-[#22222C]">
            <span className="font-semibold text-zinc-200">How to Create & Connect Your Telegram Bot</span>
            <span className="text-[10px] font-mono text-zinc-500">Zero-Code Setup</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-[#181820] border border-[#262632] rounded-lg space-y-1">
              <span className="font-bold font-mono text-emerald-400 text-[11px]">1. Get Bot Token</span>
              <p className="text-zinc-400 text-[11px]">
                Search <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-white underline font-semibold">@BotFather</a> on Telegram. Send <code className="text-zinc-200 bg-black/40 px-1 py-0.5 rounded">/newbot</code> and copy the HTTP API Token.
              </p>
            </div>

            <div className="p-3 bg-[#181820] border border-[#262632] rounded-lg space-y-1">
              <span className="font-bold font-mono text-sky-400 text-[11px]">2. Get Your Chat ID</span>
              <p className="text-zinc-400 text-[11px]">
                Search <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer" className="text-white underline font-semibold">@userinfobot</a> on Telegram. Tap Start to get your numeric User Id.
              </p>
            </div>

            <div className="p-3 bg-[#181820] border border-[#262632] rounded-lg space-y-1">
              <span className="font-bold font-mono text-purple-400 text-[11px]">3. Paste & Save</span>
              <p className="text-zinc-400 text-[11px]">
                Paste the Token & Chat ID below, click <strong>Test Connection</strong> to verify, and click <strong>Save Configuration</strong>!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Banner */}
      {feedback && (
        <div className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 animate-fadeIn ${
          feedback.type === 'success' 
            ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300' 
            : feedback.type === 'error'
              ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
              : 'bg-[#181820] border-[#2C2C3C] text-zinc-300'
        }`}>
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' && <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />}
            {feedback.type === 'error' && <AlertTriangle size={16} className="text-rose-400 shrink-0" />}
            {feedback.type === 'info' && <Zap size={16} className="text-amber-400 shrink-0 animate-pulse" />}
            <span className="font-medium">{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-zinc-400 hover:text-white text-xs px-2 py-1 rounded"
          >
            ✕
          </button>
        </div>
      )}

      {/* Form Fields: Token & Chat ID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Telegram Bot Token */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
            <span>Telegram Bot Token</span>
            <span className="text-[10px] text-zinc-500 font-mono">From @BotFather</span>
          </label>
          <div className="relative">
            <input
              type={showToken ? 'text' : 'password'}
              value={config.bot_token || ''}
              onChange={(e) => setConfig(prev => ({ ...prev, bot_token: e.target.value.trim() }))}
              placeholder="e.g. 1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
              className="w-full pl-3.5 pr-10 py-2.5 bg-[#121215] border border-[#2A2A36] rounded-xl text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-400 transition-colors shadow-inner"
            />
            <button
              type="button"
              onClick={() => setShowToken(prev => !prev)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 p-1"
            >
              {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>

        {/* Telegram Admin Chat ID(s) */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
            <span>Admin Recipient Chat ID(s)</span>
            <span className="text-[10px] text-zinc-500 font-mono">Comma-separated for multiple</span>
          </label>
          <input
            type="text"
            value={config.admin_chat_ids || ''}
            onChange={(e) => setConfig(prev => ({ ...prev, admin_chat_ids: e.target.value }))}
            placeholder="e.g. 1612319687, 9876543210"
            className="w-full px-3.5 py-2.5 bg-[#121215] border border-[#2A2A36] rounded-xl text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-400 transition-colors shadow-inner"
          />
        </div>
      </div>

      {/* Notification Category Toggles */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-mono">
            Notification Triggers & Channels
          </h4>
          <span className="text-[11px] text-zinc-500">Fine-grained operational filters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
          {[
            { id: 'notify_orders', label: 'New Orders & VIP Alerts', desc: 'Instant dispatch with WhatsApp & 1-Click Ship button' },
            { id: 'notify_returns', label: 'Return Requests & Refunds', desc: 'Approve or reject customer returns via Telegram' },
            { id: 'notify_low_stock', label: 'Critical Low Stock (≤ 5 units)', desc: 'Inventory alerts with 1-Tap restock +20/+50 buttons' },
            { id: 'notify_reviews', label: 'Customer Reviews Moderation', desc: 'Publish or hide product reviews from phone' },
            { id: 'notify_morning_digest', label: 'Morning Executive Briefing', desc: 'Yesterday revenue, AOV, and pending fulfillment' },
            { id: 'notify_night_closing', label: 'Daily Night Closing Report', desc: 'Day revenue tally and dispatch queue' }
          ].map((item) => {
            const isChecked = config[item.id] !== false;
            return (
              <div
                key={item.id}
                onClick={() => handleToggle(item.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex items-start justify-between gap-2.5 ${
                  isChecked 
                    ? 'bg-[#181822] border-[#2E2E40] text-zinc-100' 
                    : 'bg-[#121215] border-[#22222A] text-zinc-500 opacity-60'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="font-semibold text-xs text-zinc-200">{item.label}</div>
                  <div className="text-[11px] text-zinc-400 leading-relaxed">{item.desc}</div>
                </div>
                <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 mt-0.5 ${
                  isChecked ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'border-zinc-700 bg-transparent'
                }`}>
                  {isChecked && <CheckCircle2 size={12} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Footer Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#222228]">
        <div className="flex items-center gap-2 text-[11px] text-zinc-500">
          <ShieldCheck size={14} className="text-emerald-400" />
          <span>RLS Protected: Credentials stored securely in PostgreSQL.</span>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {/* Test Ping Button */}
          <button
            type="button"
            onClick={handleTestPing}
            disabled={isTesting || isLoading}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-[#1E1E26] hover:bg-[#282834] active:scale-[0.98] text-zinc-200 border border-[#2C2C3C] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 min-h-[38px]"
          >
            <Send size={13} className={isTesting ? 'animate-bounce text-amber-400' : 'text-zinc-400'} />
            <span>{isTesting ? 'Sending Test...' : 'Test Connection'}</span>
          </button>

          {/* Save Settings Button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="flex-1 sm:flex-none px-5 py-2.5 bg-white hover:bg-zinc-200 active:scale-[0.98] text-black rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 min-h-[38px] shadow-sm"
          >
            <Save size={13} className="text-black" />
            <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </div>

    </div>
  );
};

export default TelegramSettingsCard;

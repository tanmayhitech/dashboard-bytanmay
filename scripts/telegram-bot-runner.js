import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. Manually parse .env if process.env values are missing
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const envPath = path.join(rootDir, '.env');

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.substring(0, eqIdx).trim();
      const val = trimmed.substring(eqIdx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

// 2. Import core telegram update processor
const { processTelegramUpdate } = await import('../api/telegram-webhook.js');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID || '';

console.log('----------------------------------------------------');
console.log('⚡ LOOZARS® — TELEGRAM BOT LONG-POLLING DAEMON');
console.log(`• Admin Recipient ID: ${TELEGRAM_ADMIN_CHAT_ID ? '[CONFIGURED]' : '[MISSING]'}`);
console.log(`• Bot Token: ${TELEGRAM_BOT_TOKEN ? '[CONFIGURED]' : '[MISSING]'}`);
console.log('----------------------------------------------------');

// Delete webhook so long polling can run
async function setupBot() {
  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteWebhook`);
    const data = await res.json();
    console.log('[TelegramDaemon] Webhook cleared for long-polling:', data.ok ? 'SUCCESS' : data.description);
  } catch (e) {
    console.warn('[TelegramDaemon] deleteWebhook notice:', e.message);
  }
}

let offset = 0;
let isRunning = true;

async function pollUpdates() {
  await setupBot();
  console.log('🟢 [TelegramDaemon] Live listening for commands & button clicks from Tanmay...');

  while (isRunning) {
    try {
      const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=${offset}&timeout=20`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          offset = update.update_id + 1;
          const userText = update.message?.text || update.callback_query?.data || 'interactive_action';
          const fromUser = update.message?.from?.first_name || update.callback_query?.from?.first_name || 'Admin';
          console.log(`⚡ [TelegramDaemon] Processing '${userText}' from ${fromUser}...`);

          try {
            await processTelegramUpdate(update);
            console.log(`✅ [TelegramDaemon] Successfully handled '${userText}'`);
          } catch (handlerErr) {
            console.error(`❌ [TelegramDaemon] Handler error for '${userText}':`, handlerErr);
          }
        }
      } else if (!data.ok) {
        console.warn('[TelegramDaemon] getUpdates error:', data.description);
        await new Promise(r => setTimeout(r, 3000));
      }
    } catch (netErr) {
      console.warn('[TelegramDaemon] Network poll error (retrying in 4s):', netErr.message);
      await new Promise(r => setTimeout(r, 4000));
    }
  }
}

// Start polling loop
pollUpdates();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[TelegramDaemon] Shutting down gracefully...');
  isRunning = false;
  process.exit(0);
});

process.on('SIGTERM', () => {
  isRunning = false;
  process.exit(0);
});

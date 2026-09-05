import { spawn } from 'child_process';
import fs from 'fs';

const ARTIFACT_DIR = '/Users/takatonaoto/.gemini/antigravity/brain/549f561a-7691-4e93-919b-11dd2ac6cedf';
const PORT = 9222;

const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  '--user-data-dir=/tmp/chrome_cdp_profile_2',
  '--window-size=1280,1100',
  'about:blank'
]);

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function sendCDP(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 100000);
    const handler = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === id) {
        ws.removeEventListener('message', handler);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function main() {
  await sleep(1500);

  const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
  const data = await res.json();
  const ws = new WebSocket(data.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r));

  const target = await sendCDP(ws, 'Target.createTarget', { url: 'http://localhost:3000' });
  const pageWs = new WebSocket(`ws://127.0.0.1:${PORT}/devtools/page/${target.targetId}`);
  await new Promise(r => pageWs.addEventListener('open', r));

  await sendCDP(pageWs, 'Page.enable');
  await sendCDP(pageWs, 'Runtime.enable');

  console.log('Navigating to http://localhost:3000...');
  await sendCDP(pageWs, 'Page.navigate', { url: 'http://localhost:3000' });
  await sleep(4000);

  // 1. トップ画面・対面分析タブ
  let screenshot = await sendCDP(pageWs, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(`${ARTIFACT_DIR}/screenshot_1_matchup.png`, Buffer.from(screenshot.data, 'base64'));
  console.log('Saved screenshot_1_matchup.png');

  // 2. カンペボタンをクリックしてチートシートモーダルを開く
  await sendCDP(pageWs, 'Runtime.evaluate', {
    expression: `
      const cheatBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('カンペ'));
      if (cheatBtn) cheatBtn.click();
    `
  });
  await sleep(1500);
  screenshot = await sendCDP(pageWs, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(`${ARTIFACT_DIR}/screenshot_cheatsheet.png`, Buffer.from(screenshot.data, 'base64'));
  console.log('Saved screenshot_cheatsheet.png');

  // カンペを閉じる
  await sendCDP(pageWs, 'Runtime.evaluate', {
    expression: `
      const closeBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('閉じる'));
      if (closeBtn) closeBtn.click();
    `
  });
  await sleep(1000);

  // 3. 対面のアコーディオンを展開（エイトロックスのカード）
  await sendCDP(pageWs, 'Runtime.evaluate', {
    expression: `
      const aatroxCard = Array.from(document.querySelectorAll('h3')).find(h => h.textContent.includes('エイトロックス'));
      if (aatroxCard) {
        const row = aatroxCard.closest('.cursor-pointer');
        if (row) {
          row.click();
        }
      }
    `
  });
  await sleep(1500);
  await sendCDP(pageWs, 'Runtime.evaluate', {
    expression: `window.scrollBy(0, 320);`
  });
  await sleep(1000);
  screenshot = await sendCDP(pageWs, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(`${ARTIFACT_DIR}/screenshot_accordion_aatrox.png`, Buffer.from(screenshot.data, 'base64'));
  console.log('Saved screenshot_accordion_aatrox.png');

  // 4. タブ2「Performance & Gap」をクリック
  await sendCDP(pageWs, 'Runtime.evaluate', {
    expression: `
      const gapTab = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Performance & Gap'));
      if (gapTab) gapTab.click();
    `
  });
  await sleep(1500);
  screenshot = await sendCDP(pageWs, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(`${ARTIFACT_DIR}/screenshot_2_gap.png`, Buffer.from(screenshot.data, 'base64'));
  console.log('Saved screenshot_2_gap.png');

  // 5. 象限2「要改善: 逆転負け」をクリックして展開
  await sendCDP(pageWs, 'Runtime.evaluate', {
    expression: `
      const cards = Array.from(document.querySelectorAll('[role="button"]'));
      const winLossCard = cards.find(c => c.textContent.includes('逆転負け'));
      if (winLossCard) winLossCard.click();
    `
  });
  await sleep(1500);
  screenshot = await sendCDP(pageWs, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(`${ARTIFACT_DIR}/screenshot_3_gap_detail.png`, Buffer.from(screenshot.data, 'base64'));
  console.log('Saved screenshot_3_gap_detail.png');

  // 6. タブ3「Match History」をクリック
  await sendCDP(pageWs, 'Runtime.evaluate', {
    expression: `
      const matchHistoryTab = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Match History'));
      if (matchHistoryTab) matchHistoryTab.click();
    `
  });
  await sleep(1500);
  screenshot = await sendCDP(pageWs, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(`${ARTIFACT_DIR}/screenshot_history_15.png`, Buffer.from(screenshot.data, 'base64'));
  console.log('Saved screenshot_history_15.png');

  // 7. 最初のマッチカードをクリックしてアコーディオン展開
  await sendCDP(pageWs, 'Runtime.evaluate', {
    expression: `
      const firstHeader = document.querySelector('[data-testid="match-card-header"]');
      if (firstHeader) firstHeader.click();
    `
  });
  await sleep(1500);
  screenshot = await sendCDP(pageWs, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(`${ARTIFACT_DIR}/screenshot_history_expanded.png`, Buffer.from(screenshot.data, 'base64'));
  fs.writeFileSync(`${ARTIFACT_DIR}/screenshot_history_graph.png`, Buffer.from(screenshot.data, 'base64'));
  console.log('Saved screenshot_history_graph.png');


  // 8. 下部にスクロールして「さらに15試合を表示」ボタンを撮影
  await sendCDP(pageWs, 'Runtime.evaluate', {
    expression: `window.scrollTo(0, document.body.scrollHeight);`
  });
  await sleep(1000);
  screenshot = await sendCDP(pageWs, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(`${ARTIFACT_DIR}/screenshot_history_load_more.png`, Buffer.from(screenshot.data, 'base64'));
  console.log('Saved screenshot_history_load_more.png');

  ws.close();
  pageWs.close();
  chrome.kill();
  console.log('All screenshots captured successfully!');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  chrome.kill();
  process.exit(1);
});

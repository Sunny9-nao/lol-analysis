import { spawn } from 'child_process';
import fs from 'fs';

const ARTIFACT_DIR = '/Users/takatonaoto/.gemini/antigravity/brain/549f561a-7691-4e93-919b-11dd2ac6cedf';
const PORT = 9222;

const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  '--user-data-dir=/tmp/chrome_cdp_profile_3',
  '--window-size=1280,1050',
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
  await sleep(3500);

  // 0. Matchup Lab でオーンのアコーディオンを展開して過去の対戦履歴とメモの表示を撮影
  console.log('Expanding Ornn accordion in Matchup Lab...');
  await sendCDP(pageWs, 'Runtime.evaluate', {
    expression: `
      const ornnCard = Array.from(document.querySelectorAll('h3')).find(h => h.textContent.includes('オーン'));
      if (ornnCard) {
        ornnCard.scrollIntoView({ behavior: 'instant', block: 'start' });
        ornnCard.closest('.cursor-pointer').click();
      }
    `
  });
  await sleep(1500);
  await sendCDP(pageWs, 'Runtime.evaluate', {
    expression: `window.scrollBy(0, 200);`
  });
  await sleep(600);

  let screenshot = await sendCDP(pageWs, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(`${ARTIFACT_DIR}/screenshot_matchup_ornn_history.png`, Buffer.from(screenshot.data, 'base64'));
  console.log('Saved screenshot_matchup_ornn_history.png');

  // オーンのアコーディオンを閉じる
  await sendCDP(pageWs, 'Runtime.evaluate', {
    expression: `
      const ornnCard = Array.from(document.querySelectorAll('h3')).find(h => h.textContent.includes('オーン'));
      if (ornnCard) {
        ornnCard.closest('.cursor-pointer').click();
      }
    `
  });
  await sleep(600);

  // 1. 直前試合バナーの「詳細を見る」ボタンをクリックしてモーダルを開く
  console.log('Opening MatchDetailModal from RecentMatchBanner...');
  await sendCDP(pageWs, 'Runtime.evaluate', {
    expression: `
      const btn = document.querySelector('[data-testid="recent-match-detail-btn"]');
      if (btn) btn.click();
    `
  });
  await sleep(1500);

  screenshot = await sendCDP(pageWs, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(`${ARTIFACT_DIR}/screenshot_modal_recent.png`, Buffer.from(screenshot.data, 'base64'));
  console.log('Saved screenshot_modal_recent.png');

  // 2. モーダル内のキルピンをホバーしてツールチップと拡大ピンを撮影
  console.log('Hovering over kill event pin...');
  await sendCDP(pageWs, 'Runtime.evaluate', {
    expression: `
      const pin = document.querySelector('[data-testid="modal-timeline-graph"] svg circle.cursor-pointer, [data-testid="modal-timeline-graph"] svg g.cursor-pointer');
      if (pin) {
        const rect = pin.getBoundingClientRect();
        window.__hoverPinX = rect.left + rect.width / 2;
        window.__hoverPinY = rect.top + rect.height / 2;
      }
    `
  });
  const coordsRes = await sendCDP(pageWs, 'Runtime.evaluate', {
    expression: `({ x: window.__hoverPinX, y: window.__hoverPinY })`,
    returnByValue: true
  });
  if (coordsRes.result.value.x) {
    await sendCDP(pageWs, 'Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: coordsRes.result.value.x,
      y: coordsRes.result.value.y
    });
    await sleep(600);
    screenshot = await sendCDP(pageWs, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${ARTIFACT_DIR}/screenshot_modal_graph_hover.png`, Buffer.from(screenshot.data, 'base64'));
    console.log('Saved screenshot_modal_graph_hover.png');
  }

  // モーダルをESCで閉じる
  await sendCDP(pageWs, 'Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
  await sendCDP(pageWs, 'Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape' });
  await sleep(1000);

  // 3. タブ「Match History」に移動してマッチカードをクリックしてモーダルを開く
  console.log('Switching to Match History and opening modal...');
  await sendCDP(pageWs, 'Runtime.evaluate', {
    expression: `
      window.scrollTo(0, 0);
      const tab = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Match History'));
      if (tab) tab.click();
    `
  });
  await sleep(1500);

  // マッチ履歴カード一覧のスクリーンショットを保存
  screenshot = await sendCDP(pageWs, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(`${ARTIFACT_DIR}/screenshot_match_history_redesign.png`, Buffer.from(screenshot.data, 'base64'));
  console.log('Saved screenshot_match_history_redesign.png');

  // 下にスクロールしてマルファイト vs セジュアニ等のカードも撮影
  await sendCDP(pageWs, 'Runtime.evaluate', {
    expression: `window.scrollBy(0, 600);`
  });
  await sleep(800);
  const screenshotScroll = await sendCDP(pageWs, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(`${ARTIFACT_DIR}/screenshot_match_history_scroll.png`, Buffer.from(screenshotScroll.data, 'base64'));
  console.log('Saved screenshot_match_history_scroll.png');

  await sendCDP(pageWs, 'Runtime.evaluate', {
    expression: `
      const header = document.querySelector('[data-testid="match-card-header"]');
      if (header) header.click();
    `
  });
  await sleep(1500);

  screenshot = await sendCDP(pageWs, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(`${ARTIFACT_DIR}/screenshot_modal_history.png`, Buffer.from(screenshot.data, 'base64'));
  console.log('Saved screenshot_modal_history.png');

  // ESCで閉じる
  await sendCDP(pageWs, 'Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
  await sendCDP(pageWs, 'Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape' });
  await sleep(1000);

  // 4. タブ「Performance & Gap」に移動し、象限カードをクリックして表示される試合行をクリックしてモーダルを開く
  console.log('Switching to Gap Analysis and opening modal...');
  await sendCDP(pageWs, 'Runtime.evaluate', {
    expression: `
      const gapTab = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Performance & Gap'));
      if (gapTab) gapTab.click();
    `
  });
  await sleep(1500);

  await sendCDP(pageWs, 'Runtime.evaluate', {
    expression: `
      const cards = Array.from(document.querySelectorAll('[role="button"]'));
      const winLossCard = cards.find(c => c.textContent.includes('逆転負け'));
      if (winLossCard) winLossCard.click();
    `
  });
  await sleep(1200);

  await sendCDP(pageWs, 'Runtime.evaluate', {
    expression: `
      const matchRow = document.querySelector('.cursor-pointer.group');
      if (matchRow) matchRow.click();
    `
  });
  await sleep(1500);

  screenshot = await sendCDP(pageWs, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(`${ARTIFACT_DIR}/screenshot_modal_gap.png`, Buffer.from(screenshot.data, 'base64'));
  console.log('Saved screenshot_modal_gap.png');

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

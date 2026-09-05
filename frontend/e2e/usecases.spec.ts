import { test, expect } from '@playwright/test';

test.describe('LoLRankupLab Usecases E2E Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // 画面がロードされ、サモナー情報が表示されるのを待機
    await expect(page.locator('text=Sunny9')).toBeVisible({ timeout: 10000 });
  });

  test('TC-A1-01: 逆引き検索で Aatrox またはカタカナ「エイトロックス」入力時に対面得意チャンプがレコメンドされる', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/相手チャンプ名で逆引き/);
    await expect(searchInput).toBeVisible();
    await searchInput.fill('エイトロックス');

    // レネクトンなどの候補が表示されること
    await expect(page.locator('text=レネクトン').first()).toBeVisible();
  });

  test('TC-A2-01 & TC-A2-04: カンペモーダルの展開、購入タイムライン表示、ESCキーでのクローズ', async ({ page }) => {
    // ガレンの行にあるカンペボタンを探してクリック
    const garenRow = page.locator('div').filter({ hasText: /^ガレン/ }).first();
    const cheatBtn = page.getByRole('button', { name: 'カンペ' }).first();
    await cheatBtn.click();

    // カンペモーダルが表示されること
    const modal = page.locator('div[role="dialog"]');
    await expect(page.locator('text=試合前カンペ')).toBeVisible();

    // 勝利時の序盤購入タイムラインが表示されること
    await expect(page.locator('text=序盤購入順 (14分まで):')).toBeVisible();

    // ESCキーを押してモーダルが閉じること (U-03検証)
    await page.keyboard.press('Escape');
    await expect(page.locator('text=試合前カンペ')).not.toBeVisible();
  });

  test('TC-B5-04: 弱点・ギャップ分析タブで4象限カードをクリックすると該当試合が展開される', async ({ page }) => {
    // ギャップ分析タブをクリック
    await page.getByRole('button', { name: /Performance & Gap/ }).click();

    // 4象限カードが表示されること
    const winLossCard = page.locator('text=要改善: 逆転負け').first();
    await expect(winLossCard).toBeVisible();

    // カードをクリックして展開
    await winLossCard.click();

    // 逆転負けの試合一覧が展開されること
    await expect(page.locator('text=レーン勝利 → 試合敗北 (逆転負け) の試合一覧')).toBeVisible();

    // 再度クリックして閉じること
    await winLossCard.click();
    await expect(page.locator('text=レーン勝利 → 試合敗北 (逆転負け) の試合一覧')).not.toBeVisible();
  });

  test('TC-A1-03 & TC-A1-04: 逆引き検索のクリアボタン (×) と未対戦チャンプの案内', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/相手チャンプ名で逆引き/);
    await searchInput.fill('Zac');

    // 未対戦の案内が表示されること
    await expect(page.locator('text=対「Zac」の対戦データはまだありません')).toBeVisible();

    // クリアボタン (×) をクリック
    const clearBtn = page.getByRole('button', { name: '入力をクリア' });
    await expect(clearBtn).toBeVisible();
    await clearBtn.click();

    // 検索窓が空になり、未対戦案内が消えること
    await expect(searchInput).toHaveValue('');
    await expect(page.locator('text=対「Zac」の対戦データはまだありません')).not.toBeVisible();
  });

  test('TC-A3-01 & TC-A3-02: 直前試合バナーから反省メモモーダルを開き、要因タグの挿入とESCクローズ', async ({ page }) => {
    // 直前試合バナーの「メモを記録」または「メモを編集」ボタンをクリック
    const noteBtn = page.getByRole('button', { name: /メモを(記録|編集)/ }).first();
    await noteBtn.click();

    // メモモーダルが表示されること
    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(page.locator('text=対面難易度タグ')).toBeVisible();

    // 要因タグ「ガンク被弾」をクリック
    const chip = page.getByRole('button', { name: /ガンク被弾/ });
    await chip.click();

    // テキストエリアに【ガンク被弾】が含まれること
    const textarea = page.locator('textarea');
    await expect(textarea).toContainText('【ガンク被弾】');

    // ESCキーを押してモーダルが閉じること
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });

  test('TC-B2-01: 試合履歴タブで相対時間・絶対日時・GD14バッジが表示される', async ({ page }) => {
    // 試合履歴タブをクリック
    await page.getByRole('button', { name: /Match History/ }).click();

    // 試合履歴の表示とバッジを確認
    await expect(page.locator('text=直近 40 試合中 15 試合を表示')).toBeVisible();
    await expect(page.locator('text=日前').first()).toBeVisible();
    await expect(page.locator('text=GD14:').first()).toBeVisible();
  });

  test('TC-B2-02: 試合履歴の初期15件表示と「さらに15試合を表示」による段階的読み込み', async ({ page }) => {
    // 試合履歴タブをクリック
    await page.getByRole('button', { name: /Match History/ }).click();

    // 初期状態では15件のカードが表示されていること
    const cards = page.locator('[data-testid="match-card"]');
    await expect(cards).toHaveCount(15);

    // 「さらに15試合を表示」ボタンが存在すること
    const loadMoreBtn = page.getByRole('button', { name: /さらに15試合を表示/ });
    await expect(loadMoreBtn).toBeVisible();

    // クリックすると30件に増加すること
    await loadMoreBtn.click();
    await expect(cards).toHaveCount(30);
    await expect(page.locator('text=直近 40 試合中 30 試合を表示')).toBeVisible();
  });

  test('TC-B2-03: マッチカードのクリックによる詳細情報（14分客観データ・序盤購入順）のアコーディオン展開と折りたたみ', async ({ page }) => {
    // 試合履歴タブをクリック
    await page.getByRole('button', { name: /Match History/ }).click();

    // 初期状態ではアコーディオン詳細パネルは表示されていないこと
    const detailPanel = page.locator('[data-testid="match-accordion-panel"]');
    await expect(detailPanel).toHaveCount(0);

    // 最初のマッチカードのヘッダーをクリックして展開
    const firstCardHeader = page.locator('[data-testid="match-card-header"]').first();
    await firstCardHeader.click();

    // アコーディオン詳細パネルが表示され、客観スタッツと購入順が表示されること
    await expect(detailPanel).toBeVisible();
    await expect(detailPanel.locator('text=レーン戦結果 (14分時点)')).toBeVisible();
    await expect(detailPanel.locator('text=ゴールド / CS差 (14分時点)')).toBeVisible();

    // 再度クリックすると折りたたまれること
    await firstCardHeader.click();
    await expect(detailPanel).toHaveCount(0);
  });

  test('TC-B2-04: マッチカード展開時に対面Gold差推移グラフ (SVG) とキル発生マーカーが描画されること', async ({ page }) => {
    // 試合履歴タブをクリック
    await page.getByRole('button', { name: /Match History/ }).click();

    // 最初のマッチカードを展開
    const firstCardHeader = page.locator('[data-testid="match-card-header"]').first();
    await firstCardHeader.click();

    // グラフコンテナとヘッダーが表示されること
    const graphContainer = page.locator('[data-testid="match-timeline-graph-container"]');
    await expect(graphContainer).toBeVisible();
    await expect(graphContainer.locator('text=対面Gold差推移 & キル発生タイムライン')).toBeVisible();

    // SVG チャートが存在し、0G基準線や14分プレート消滅線が表示されること
    const svg = graphContainer.locator('svg');
    await expect(svg).toBeVisible();
    await expect(graphContainer.locator('text=0G')).toBeVisible();
    await expect(graphContainer.locator('text=14分 (プレート消滅)')).toBeVisible();
  });

  test('TC-B2-05: ビルド購入時系列の「序盤 (14分まで)」と「試合全体」のタブ切り替えが動作すること', async ({ page }) => {
    // 試合履歴タブをクリック
    await page.getByRole('button', { name: /Match History/ }).click();

    // 最初のマッチカードを展開
    const firstCardHeader = page.locator('[data-testid="match-card-header"]').first();
    await firstCardHeader.click();

    // ビルド購入時系列が表示されること
    await expect(page.locator('text=ビルド購入時系列 (リコール別):')).toBeVisible();

    // 切り替えボタンが存在すること
    const earlyBtn = page.getByRole('button', { name: '序盤 (14分まで)' });
    const fullBtn = page.getByRole('button', { name: '試合全体' });
    await expect(earlyBtn).toBeVisible();
    await expect(fullBtn).toBeVisible();

    // 「序盤 (14分まで)」をクリック
    await earlyBtn.click();
    await expect(earlyBtn).toHaveClass(/text-\[#1a73e8\]/);

    // 「試合全体」をクリック
    await fullBtn.click();
    await expect(fullBtn).toHaveClass(/text-\[#1a73e8\]/);
  });
});

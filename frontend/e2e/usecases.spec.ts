import { test, expect } from '@playwright/test';

test.describe('LoLRankupLab Usecases E2E Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // サインインモーダルが表示された場合はデモアカウントでサインイン
    const authModal = page.locator('[data-testid="auth-modal"]');
    try {
      await authModal.waitFor({ state: 'visible', timeout: 3000 });
      await page.locator('[data-testid="demo-login-btn"]').click();
      await page.locator('[data-testid="auth-submit-btn"]').click();
    } catch {
      // 既にログイン済みの場合はスルー
    }

    // 画面がロードされ、サモナー情報が表示されるのを待機
    await expect(page.getByRole('heading', { name: 'Sunny9' })).toBeVisible({ timeout: 10000 });
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
    const cheatBtn = page.getByRole('button', { name: 'カンペ' }).first();
    await cheatBtn.click();

    // カンペモーダルが表示されること
    await expect(page.locator('text=試合前カンペ')).toBeVisible();

    // 勝利時の序盤購入タイムラインが表示されること
    await expect(page.locator('text=序盤購入順 (14分まで):')).toBeVisible();

    // ESCキーを押してモーダルが閉じること (U-03検証)
    await page.keyboard.press('Escape');
    await expect(page.locator('text=試合前カンペ')).not.toBeVisible();
  });

  test('TC-A2-05: Matchup Labでチャンピオンカードを展開し、過去の対戦履歴とメモ欄がはみ出さず正常に表示されること', async ({ page }) => {
    // ガレンのカードを探してスクロールしてクリック
    const garenTitle = page.locator('h3').filter({ hasText: 'ガレン' });
    await garenTitle.scrollIntoViewIfNeeded();
    await expect(garenTitle).toBeVisible();
    await garenTitle.click();

    // 過去の対戦履歴見出しが表示されること
    await expect(page.locator('text=過去の対戦履歴 & メモ')).toBeVisible();

    // 過去の試合行にKDA、ビルド、メモ編集ボタンが表示されること
    await expect(page.getByRole('button', { name: '編集' }).first()).toBeVisible({ timeout: 10000 });

    // アコーディオンを閉じる
    await garenTitle.click();
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
    await expect(textarea).toHaveValue(/【ガンク被弾】/);

    // ESCキーを押してモーダルが閉じること
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });

  test('TC-A3-03: 反省メモを入力・タグ選択して「メモを保存する」を実行し、GraphQL経由で保存されUI即時反映および永続化されること', async ({ page }) => {
    // 直前試合バナーの「メモを記録」または「メモを編集」ボタンをクリック
    const noteBtn = page.getByRole('button', { name: /メモを(記録|編集)/ }).first();
    await noteBtn.click();

    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toBeVisible();

    // 難易度タグ「Hard」をクリック
    await page.getByRole('button', { name: 'Hard' }).click();

    // 要因タグ「Lv1-3ソロキル被弾」をクリック
    await page.getByRole('button', { name: /Lv1-3ソロキル被弾/ }).click();

    // テキストエリアに追加のメモを入力
    const textarea = page.locator('textarea');
    await textarea.fill('【Lv1-3ソロキル被弾】 レベル2先行されて急襲された。ウェーブ管理に集中する。');

    // alertが発生しないこと（エラー時は alert(`保存に失敗しました: ...`) が呼ばれる）
    let alertMessage = '';
    page.on('dialog', async (dialog) => {
      alertMessage = dialog.message();
      await dialog.dismiss();
    });

    // 「メモを保存する」ボタンをクリック
    await page.getByRole('button', { name: /メモを保存する/ }).click();

    // モーダルが正常に閉じること
    await expect(modal).not.toBeVisible();
    expect(alertMessage).toBe('');

    // 直前試合バナーに「メモ記録済み」および入力したメモ本文が即時反映されていること
    await expect(page.locator('text=メモ記録済み')).toBeVisible();
    await expect(page.locator('text=レベル2先行されて急襲された').first()).toBeVisible();

    // ページをリロードしても保存されたメモがDBから取得され表示されること（永続化の確認）
    await page.reload();
    await expect(page.locator('text=メモ記録済み')).toBeVisible();
    await expect(page.locator('text=レベル2先行されて急襲された').first()).toBeVisible();
  });

  test('TC-B2-01: 試合履歴タブで相対時間・絶対日時・レーンバッジが表示され、カード一覧には14分差バッジや「対面」ラベルが表示されず、メモ欄がボタン化されていること', async ({ page }) => {
    // 試合履歴タブをクリック
    await page.getByRole('button', { name: /Match History/ }).click();

    // 試合履歴の表示とバッジを確認
    await expect(page.locator('text=/直近 \\d+ 試合中 15 試合を表示/')).toBeVisible();
    await expect(page.locator('text=日前').first()).toBeVisible();
    await expect(page.locator('text=KDA').first()).toBeVisible();
    // レーンバッジ（TOP, JUNGLE等）が表示されていること
    await expect(page.locator('[data-testid="match-card"]').first().locator('text=TOP').first()).toBeVisible();
    // 一覧カード内には14分差バッジや「対面」、自明なキュー名（Ranked Solo）が出ないこと
    await expect(page.locator('[data-testid="match-card"]').first().locator('text=14分差:')).not.toBeVisible();
    await expect(page.locator('[data-testid="match-card"]').first().locator('text=対面')).not.toBeVisible();
    await expect(page.locator('[data-testid="match-card"]').first().locator('text=Ranked Solo')).not.toBeVisible();
    // ヘッダーに「CLASSIC (サモナーズリフト)」が出ないこと
    await expect(page.locator('text=サモナーズリフト')).not.toBeVisible();
    // メモ編集またはメモ追加ボタンが表示されていること
    await expect(page.locator('[data-testid="match-card"]').first().getByRole('button', { name: /メモ(編集|追加)/ })).toBeVisible();
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
    await expect(page.locator('text=/直近 \\d+ 試合中 30 試合を表示/')).toBeVisible();
  });

  test('TC-B2-03: マッチカードのクリックによる試合詳細モーダル（14分客観データ・購入順・メモ）の開閉', async ({ page }) => {
    // 試合履歴タブをクリック
    await page.getByRole('button', { name: /Match History/ }).click();

    // 初期状態では試合詳細モーダルは表示されていないこと
    const modal = page.locator('[data-testid="match-detail-modal"]');
    await expect(modal).toHaveCount(0);

    // 最初のマッチカードをクリックしてモーダルを開く
    const firstCardHeader = page.locator('[data-testid="match-card-header"]').first();
    await firstCardHeader.click();

    // 試合詳細モーダルが表示され、客観スタッツと勝敗・スコアが表示されること
    await expect(modal).toBeVisible();
    await expect(modal.locator('text=レーン戦結果 (14分時点)')).toBeVisible();
    await expect(modal.locator('text=ゴールド / CS差 (14分時点)')).toBeVisible();
    await expect(modal.locator('text=ゴールド比較タイムライン')).toBeVisible();

    // 閉じるボタンをクリックするとモーダルが閉じること
    const closeBtn = modal.locator('[data-testid="modal-close-button"]');
    await closeBtn.click();
    await expect(modal).toHaveCount(0);

    // 再度開き、ESCキーでも閉じられること
    await firstCardHeader.click();
    await expect(modal).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(modal).toHaveCount(0);
  });

  test('TC-B2-04: 試合詳細モーダル内に対面Gold差推移グラフ (SVG) が描画され、14分破線がなくキルピンが表示されること', async ({ page }) => {
    // 試合履歴タブをクリック
    await page.getByRole('button', { name: /Match History/ }).click();

    // 最初のマッチカードをクリックしてモーダルを開く
    const firstCardHeader = page.locator('[data-testid="match-card-header"]').first();
    await firstCardHeader.click();

    const modal = page.locator('[data-testid="match-detail-modal"]');
    await expect(modal).toBeVisible();

    // グラフコンテナとヘッダーが表示されること
    const graphContainer = modal.locator('[data-testid="modal-timeline-graph"]');
    await expect(graphContainer).toBeVisible();
    await expect(graphContainer.locator('text=ゴールド比較タイムライン')).toBeVisible();

    // SVG チャートが存在し、0基準線が表示され、14分プレート消滅線は存在しないこと
    const svg = graphContainer.locator('svg');
    await expect(svg).toBeVisible();
    await expect(graphContainer.locator('text=14分 (プレート消滅)')).toHaveCount(0);

    // 凡例のチェック（自有利キル、対面有利キル、直接対決）
    await expect(graphContainer.locator('text=自有利キル')).toBeVisible();
    await expect(graphContainer.locator('text=対面有利キル')).toBeVisible();
    await expect(graphContainer.locator('text=直接対決')).toBeVisible();

    // モーダルを閉じる
    await page.keyboard.press('Escape');
  });

  test('TC-B2-05: 試合詳細モーダル内のビルド購入時系列の「序盤 (14分まで)」と「試合全体」のタブ切り替えが動作すること', async ({ page }) => {
    // 試合履歴タブをクリック
    await page.getByRole('button', { name: /Match History/ }).click();

    // 最初のマッチカードをクリックしてモーダルを開く
    const firstCardHeader = page.locator('[data-testid="match-card-header"]').first();
    await firstCardHeader.click();

    const modal = page.locator('[data-testid="match-detail-modal"]');
    await expect(modal).toBeVisible();

    // ビルド購入時系列が表示されること
    await expect(modal.locator('text=ビルド購入時系列 (リコール別):')).toBeVisible();

    // 切り替えボタンが存在すること
    const earlyBtn = modal.getByRole('button', { name: '序盤 (14分まで)' });
    const fullBtn = modal.getByRole('button', { name: '試合全体' });
    await expect(earlyBtn).toBeVisible();
    await expect(fullBtn).toBeVisible();

    // 「序盤 (14分まで)」をクリック
    await earlyBtn.click();
    await expect(earlyBtn).toHaveClass(/text-\[#1a73e8\]/);

    // 「試合全体」をクリック
    await fullBtn.click();
    await expect(fullBtn).toHaveClass(/text-\[#1a73e8\]/);

    // モーダルを閉じる
    await page.keyboard.press('Escape');
  });

  test('TC-B2-06: 直前試合バナーの「詳細を見る」ボタンからも試合詳細モーダルが開くこと', async ({ page }) => {
    // 直前試合バナー内の「詳細を見る」ボタンをクリック
    const bannerDetailBtn = page.locator('[data-testid="recent-match-detail-btn"]');
    await expect(bannerDetailBtn).toBeVisible();
    await bannerDetailBtn.click();

    // 試合詳細モーダルが表示されること
    const modal = page.locator('[data-testid="match-detail-modal"]');
    await expect(modal).toBeVisible();
    await expect(modal.locator('text=ゴールド比較タイムライン')).toBeVisible();

    // ESCキーで閉じること
    await page.keyboard.press('Escape');
    await expect(modal).toHaveCount(0);
  });

  test('TC-AUTH-01: ログアウトするとサインインモーダルが表示され、サインインすると自分専用のサモナー画面に復帰すること', async ({ page }) => {
    // ヘッダーのログアウトボタンをクリック
    const logoutBtn = page.locator('[data-testid="header-logout-btn"]');
    await expect(logoutBtn).toBeVisible();
    await logoutBtn.click();

    // ログアウト後にサインインモーダルが表示されること
    const authModal = page.locator('[data-testid="auth-modal"]');
    await expect(authModal).toBeVisible();

    // 再度デモログイン
    await page.locator('[data-testid="demo-login-btn"]').click();
    await page.locator('[data-testid="auth-submit-btn"]').click();

    // 個人サモナー画面に復帰すること
    await expect(page.getByRole('heading', { name: 'Sunny9' })).toBeVisible();
  });
});

# frozen_string_literal: true

require "time"

puts "=== リアルな対面分析サンプルデータ（約65試合）を生成中... ==="

summoner = Summoner.find_or_initialize_by(game_name: "Sunny9", tag_line: "hono")
summoner.assign_attributes(
  puuid: "sample_puuid_sunny9_hono",
  summoner_level: 84,
  profile_icon_id: 907,
  is_private: false,
  last_synced_at: Time.current
)
summoner.save!

# マスタ確認・生成
CHAMPION_MASTERS = {
  "Jax" => { name: "ジャックス", title: "武器の達人" },
  "Aatrox" => { name: "エイトロックス", title: "ダーキンの暴剣" },
  "Renekton" => { name: "レネクトン", title: "砂漠の大虐殺者" },
  "Darius" => { name: "ダリウス", title: "ノクサスの戦斧" },
  "Garen" => { name: "ガレン", title: "デマーシアの勇士" },
  "Fiora" => { name: "フィオラ", title: "誇り高きデュエリスト" },
  "Camille" => { name: "カミール", title: "鋼の影" },
  "Malphite" => { name: "マルファイト", title: "巨岩の破片" },
  "Riven" => { name: "リヴェン", title: "放浪の追放者" },
  "Yasuo" => { name: "ヤスオ", title: "許されざる者" },
  "Illaoi" => { name: "イラオイ", title: "大海神の神官" }
}.freeze

CHAMPION_MASTERS.each do |c_name, info|
  champ = Champion.find_or_initialize_by(champion_name: c_name)
  champ.assign_attributes(
    name: info[:name],
    title: info[:title],
    image_url: "https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/#{c_name}.png"
  )
  champ.save!
end

# 定義データ
# [my_champ, opp_champ, win, kills, deaths, assists, cs, duration_min, items, tag, note_content]
MATCH_DATA = [
  # --- Jax vs Darius (8 matches: 4W 4L, Hard) ---
  [ "Jax", "Darius", true, 7, 2, 5, 240, 28, [ 3078, 3153, 3047, 3053 ], "Hard", "Lv1で不用意に殴り合わない。相手のQ外周をQで内側に飛び込んで回避したのが勝因。" ],
  [ "Jax", "Darius", false, 2, 6, 1, 145, 22, [ 3078, 3047 ], "Hard", "Lv3で無理に仕掛けてガンク刺さった。フラッシュ温存必須。相手のゴースト中に戦ってはいけない。" ],
  [ "Jax", "Darius", true, 5, 1, 4, 210, 26, [ 3078, 3153, 3047 ], "Hard", "ボットRKファーストビルドが刺さった。スローかけて引き打ちして勝ち。" ],
  [ "Jax", "Darius", false, 1, 5, 2, 130, 20, [ 3078 ], "Hard", "Eを相手の引っ張り（E）の前に無駄撃ちしてしまい、そのまま轢き殺された。" ],
  [ "Jax", "Darius", true, 8, 3, 6, 260, 31, [ 3078, 3153, 6333, 3053 ], "Hard", "ガンク呼んでLv6前に1キル取れた。後半サイドレーンで完全に主導権握れた。" ],
  [ "Jax", "Darius", false, 3, 7, 0, 160, 24, [ 3078, 3047 ], "Hard", "タワー下でのダイブ警戒が甘かった。フリーズされたらJGを呼んでウェーブ押し切るべき。" ],
  [ "Jax", "Darius", true, 4, 2, 8, 225, 27, [ 3078, 3153, 3047 ], "Hard", "相手がゴースト切ったタイミングで引いて、ゴースト切れてからオールイン。完璧。" ],
  [ "Jax", "Darius", false, 2, 4, 3, 175, 25, [ 3078, 3153 ], "Hard", "血の怒り（5スタック）溜まった状態での殴り合いは絶対に勝てない。スタックリセットを意識。" ],

  # --- Jax vs Garen (7 matches: 5W 2L, Easy/Even) ---
  [ "Jax", "Garen", true, 6, 1, 4, 250, 27, [ 3078, 3153, 3047 ], "Easy", "ガレンのQサイレンスモーション見てからE起動で完全に無効化。超有利。" ],
  [ "Jax", "Garen", true, 8, 0, 5, 280, 29, [ 3078, 3153, 3053, 6333 ], "Easy", "EでQを透かしてスタン➜AA＋W＋引くのショートトレード徹底で完勝。" ],
  [ "Jax", "Garen", false, 3, 4, 1, 180, 25, [ 3078, 3047 ], "Even", "Eの最中に相手のE（回転）フルヒット受けて痛かった。回転中は少し距離を取るべき。" ],
  [ "Jax", "Garen", true, 5, 2, 3, 230, 26, [ 3078, 3153, 3047 ], "Easy", "ガレンのパッシブ回復を定期的なQジャンプAAで阻害し続けるのがコツ。" ],
  [ "Jax", "Garen", true, 9, 2, 7, 270, 30, [ 3078, 3153, 3053 ], "Easy", "ディバインサンダラー（トリフォ）完成以降は殴り負けない。" ],
  [ "Jax", "Garen", false, 1, 5, 2, 150, 23, [ 3078 ], "Even", "Lv6のウルト（真実のダメージ）の削り幅を見誤ってデスした。HP4割切ったら即リコール。" ],
  [ "Jax", "Garen", true, 4, 1, 6, 215, 25, [ 3078, 3153, 3047 ], "Easy", "ウェーブコントロール意識してフリーズ勝ち。" ],

  # --- Jax vs Aatrox (6 matches: 2W 4L, Hard) ---
  [ "Jax", "Aatrox", false, 2, 6, 2, 140, 23, [ 3078, 3047 ], "Hard", "エイトロックスのQ先端を貰いすぎ。Q3の範囲内にQで飛び込むべきだった。" ],
  [ "Jax", "Aatrox", true, 7, 2, 4, 260, 29, [ 3078, 3153, 3075 ], "Hard", "初手ブランブルベスト（重傷）がかなり効いた。回復を止めれば勝てる。" ],
  [ "Jax", "Aatrox", false, 1, 5, 1, 160, 24, [ 3078 ], "Hard", "W（鎖）に捕まったら横に逃げること。直線に逃げて引き戻されてコンボ喰らった。" ],
  [ "Jax", "Aatrox", false, 3, 5, 4, 190, 26, [ 3078, 3153 ], "Hard", "Lv9以降のQクールダウン短縮時に間合いを詰められなかった。" ],
  [ "Jax", "Aatrox", true, 6, 3, 5, 240, 28, [ 3078, 3153, 3075 ], "Hard", "Q1とQ2を歩いて避けて、Q3の瞬間にジャックスQで懐に入りEスタン。理想的。" ],
  [ "Jax", "Aatrox", false, 0, 4, 2, 135, 21, [ 3078 ], "Hard", "相手のウルト（ワールドエンダー）発動中は絶対に殴り合わず引き撃ち。" ],

  # --- Jax vs Fiora (5 matches: 3W 2L, Even) ---
  [ "Jax", "Fiora", true, 5, 2, 3, 230, 26, [ 3078, 3153, 3047 ], "Even", "ジャックスのE（反撃）のスタンを、フィオラのW（パリィ）で返されないよう発動タイミングをズラす心理戦。" ],
  [ "Jax", "Fiora", false, 2, 5, 1, 170, 24, [ 3078, 3047 ], "Even", "Eを即座に再発動したら読まれてパリィスタン喰らって即死。Eは最大時間維持する。" ],
  [ "Jax", "Fiora", true, 7, 3, 4, 255, 28, [ 3078, 3153, 3053 ], "Even", "急所が正面に出たら壁に背中を預けて防ぐ小技が有効だった。" ],
  [ "Jax", "Fiora", true, 4, 1, 5, 220, 25, [ 3078, 3153 ], "Even", "後半サイドプッシュ対決。集団戦寄りで差をつけた。" ],
  [ "Jax", "Fiora", false, 3, 6, 0, 180, 27, [ 3078, 3153 ], "Even", "急所4箇所全部割られた。移動速度差で追いつけない。" ],

  # --- Jax vs Camille (5 matches: 4W 1L, Easy) ---
  [ "Jax", "Camille", true, 8, 1, 6, 270, 28, [ 3078, 3153, 3047 ], "Easy", "カミールのQ2（真実ダメージ）をジャックスのEで完全無効化。マッチアップ的に有利。" ],
  [ "Jax", "Camille", true, 6, 0, 4, 240, 26, [ 3078, 3153 ], "Easy", "相手のE（フックショット）突進に合わせてEでスタン返す。" ],
  [ "Jax", "Camille", true, 5, 2, 5, 220, 25, [ 3078, 3153 ], "Easy", "序盤のパッシブシールドがある時はショートトレード避ける。" ],
  [ "Jax", "Camille", false, 2, 4, 1, 160, 23, [ 3078 ], "Easy", "敵JGのLv3ガンクで崩された。視界確保を怠らない。" ],
  [ "Jax", "Camille", true, 7, 2, 3, 250, 27, [ 3078, 3153, 3053 ], "Easy", "カミールRされても中にJaxがいれば殴り勝てる。" ],

  # --- Jax vs Malphite (4 matches: 1W 3L, Hard) ---
  [ "Jax", "Malphite", false, 1, 4, 2, 150, 24, [ 3078, 3111 ], "Hard", "マルファイトのE（攻撃速度低下）がジャックスに刺さりすぎる。殴り合いにならない。" ],
  [ "Jax", "Malphite", false, 0, 5, 1, 130, 21, [ 3078 ], "Hard", "相手アーマー積まれるとダメージ通らない。APビルドかスプリットに切り替えるべき。" ],
  [ "Jax", "Malphite", true, 4, 2, 7, 210, 28, [ 3078, 3153, 3157 ], "Hard", "レーン戦は捨ててファーム徹底。集団戦で後衛アサシンして勝ち。" ],
  [ "Jax", "Malphite", false, 2, 6, 0, 160, 25, [ 3078 ], "Hard", "彗星Qポーク耐えられない。サステイン系ルーン＋息継ぎ必須。" ],

  # --- Aatrox vs Darius (6 matches: 4W 2L, Even) ---
  [ "Aatrox", "Darius", true, 6, 1, 5, 240, 27, [ 6630, 3053, 3047 ], "Even", "エイトロックス側が間合いを制圧できれば有利。Q先端当て続けて寄せ付けない。" ],
  [ "Aatrox", "Darius", true, 8, 2, 4, 260, 28, [ 6630, 3156, 3047 ], "Even", "W引っ張りに成功したら即Q3で大ダメージ。相手のゴースト中はE後退で安全圏維持。" ],
  [ "Aatrox", "Darius", false, 2, 5, 1, 155, 22, [ 6630 ], "Even", "Eで引き込まれた後にQ外して殴り倒された。冷静にWで引き離す。" ],
  [ "Aatrox", "Darius", true, 5, 0, 6, 230, 26, [ 6630, 3053 ], "Even", "Lv1〜2は無理せずファーム。Lv3以降のQコンボでヘルス差をつける。" ],
  [ "Aatrox", "Darius", false, 1, 4, 2, 170, 25, [ 6630 ], "Even", "相手がニンバス＋ゴーストで強引に突っ込んできた時の対処が遅れた。" ],
  [ "Aatrox", "Darius", true, 7, 3, 7, 280, 31, [ 6630, 3053, 3075 ], "Even", "重傷買われたがウルトの回復量増加で押し切った。" ],

  # --- Aatrox vs Jax (5 matches: 3W 2L, Even) ---
  [ "Aatrox", "Jax", true, 7, 2, 4, 250, 28, [ 6630, 3053, 3047 ], "Even", "ジャックスがQで飛んでくるタイミングにQ3を合わせるとスタン入って完封できる。" ],
  [ "Aatrox", "Jax", false, 2, 5, 2, 160, 24, [ 6630 ], "Even", "ジャックスのEスタンの間にボコボコにされた。Eモーション見えたらEで距離取る。" ],
  [ "Aatrox", "Jax", true, 5, 1, 6, 230, 27, [ 6630, 3053 ], "Even", "Wの鎖がジャックスのジャンプ後によく刺さった。" ],
  [ "Aatrox", "Jax", true, 6, 3, 5, 245, 29, [ 6630, 3156 ], "Even", "序盤の主導権取れたのが大きい。" ],
  [ "Aatrox", "Jax", false, 3, 6, 1, 180, 26, [ 6630 ], "Even", "後半サイドレーンで1v1勝てなくなった。集団戦に寄るべき。" ],

  # --- Aatrox vs Fiora (4 matches: 1W 3L, Hard) ---
  [ "Aatrox", "Fiora", false, 1, 5, 1, 140, 22, [ 6630 ], "Hard", "Q3のモーションが大きいので確実にフィオラのWパリィでスタン返される。最悪。" ],
  [ "Aatrox", "Fiora", false, 2, 6, 0, 160, 25, [ 6630 ], "Hard", "Q3をわざと外してパリィを空振りさせるフェイクが必要。" ],
  [ "Aatrox", "Fiora", true, 5, 2, 4, 220, 27, [ 6630, 3075 ], "Hard", "ブランブル＋忍び足袋で耐え凌ぎ、集団戦で大活躍して勝利。" ],
  [ "Aatrox", "Fiora", false, 0, 4, 2, 130, 21, [ 6630 ], "Hard", "スプリットプッシュ止められず。BAN候補筆頭。" ],

  # --- Aatrox vs Renekton (5 matches: 2W 3L, Hard) ---
  [ "Aatrox", "Renekton", false, 2, 4, 1, 150, 23, [ 6630 ], "Hard", "レネクトンのフューリーWスタンからのバーストで一瞬で半分消し飛ぶ。フューリー管理注意。" ],
  [ "Aatrox", "Renekton", true, 6, 1, 5, 240, 28, [ 6630, 3053, 3047 ], "Hard", "Lv1〜2でQポークしてフューリーを溜めさせなかったのが勝因。" ],
  [ "Aatrox", "Renekton", false, 1, 5, 0, 140, 21, [ 6630 ], "Hard", "ダイブされてレーン終了。Lv6のHP増加ウルトを計算に入れていなかった。" ],
  [ "Aatrox", "Renekton", true, 4, 2, 6, 210, 26, [ 6630, 3053 ], "Hard", "中盤以降はスケール勝ち。焦らず耐えるのが正解。" ],
  [ "Aatrox", "Renekton", false, 3, 5, 2, 175, 25, [ 6630 ], "Hard", "序盤のローム止められず他レーン崩壊。" ],

  # --- Renekton vs Riven (4 matches: 3W 1L, Easy) ---
  [ "Renekton", "Riven", true, 8, 1, 4, 220, 24, [ 6630, 3047, 3053 ], "Easy", "リヴェンのQ3に合わせて強化Wスタンで即座にキャンセル。超有利。" ],
  [ "Renekton", "Riven", true, 6, 0, 5, 210, 23, [ 6630, 3053 ], "Easy", "フューリー溜めてE➜強化W➜Q➜E引きで一方的トレード。" ],
  [ "Renekton", "Riven", false, 3, 4, 2, 180, 26, [ 6630 ], "Easy", "Lv1で不用意に殴り合いすぎてリヴェンのパッシブで競り負けた。Lv1は自重。" ],
  [ "Renekton", "Riven", true, 7, 2, 6, 240, 27, [ 6630, 3053, 3075 ], "Easy", "タワー下ダイブきれいに決めて勝利。" ],

  # --- Renekton vs Yasuo (3 matches: 3W 0L, Easy) ---
  [ "Renekton", "Yasuo", true, 9, 0, 4, 230, 22, [ 6630, 3053, 3047 ], "Easy", "ヤスオの風殺（W）はレネクトンに一切効かない。強化Wでシールドごと粉砕。" ],
  [ "Renekton", "Yasuo", true, 7, 1, 5, 200, 21, [ 6630, 3053 ], "Easy", "Eで接近してスタン決めるだけで勝てる。" ],
  [ "Renekton", "Yasuo", true, 10, 2, 3, 250, 25, [ 6630, 3053 ], "Easy", "完全なカウンターピック。カモ。" ],

  # --- Renekton vs Illaoi (3 matches: 1W 2L, Hard) ---
  [ "Renekton", "Illaoi", false, 1, 5, 0, 140, 21, [ 6630 ], "Hard", "触手（E）抜かれたら絶対引くこと。殴り合ったら魂ごと破壊される。" ],
  [ "Renekton", "Illaoi", false, 2, 6, 1, 160, 23, [ 6630 ], "Hard", "相手ウルト発動時に飛び込んでしまい触手乱舞で即死。R見たら即Eで逃げる。" ],
  [ "Renekton", "Illaoi", true, 5, 2, 4, 210, 27, [ 6630, 3053, 3047 ], "Hard", "触手Eをサイドステップで避け続け、外した瞬間だけ殴るヒット＆アウェイ徹底。" ]
].freeze

imported_count = 0
ActiveRecord::Base.transaction do
  MATCH_DATA.each_with_index do |data, index|
    my_champ, opp_champ, win, kills, deaths, assists, cs, duration_min, items, tag, note_content = data

    match_id = "JP1_SAMPLE_#{1000 + index}"
    game_duration = duration_min * 60
    game_creation = (MATCH_DATA.size - index).days.ago

    match = Match.find_or_initialize_by(match_id: match_id)
    match.assign_attributes(
      game_mode: "CLASSIC",
      queue_id: 420,
      game_duration: game_duration,
      game_creation: game_creation,
      raw_info: {}
    )
    match.save!

    participant = MatchParticipant.find_or_initialize_by(summoner: summoner, match: match)
    participant.assign_attributes(
      champion_name: my_champ,
      opponent_champion_name: opp_champ,
      position: "TOP",
      win: win,
      kills: kills,
      deaths: deaths,
      assists: assists,
      cs: cs,
      gold_earned: cs * 20 + kills * 300,
      total_damage_dealt: (kills * 2500 + duration_min * 400),
      items: items,
      spells: [ 12, 4 ], # Teleport, Flash
      created_at: game_creation,
      updated_at: game_creation
    )
    participant.save!

    if note_content.present?
      note = participant.match_note || participant.build_match_note
      note.assign_attributes(
        content: note_content,
        matchup_tag: tag,
        created_at: game_creation,
        updated_at: game_creation
      )
      note.save!
    end

    imported_count += 1
  end
end

# テストユーザーを作成してサモナーに紐付け
test_user = User.find_or_initialize_by(email: "test@example.com")
test_user.password = "password123"
test_user.summoner = summoner
test_user.save!
puts "=== テストユーザーを作成しました: test@example.com / password123 (Auth Token: #{test_user.auth_token}) ==="

puts "=== 完了: #{imported_count} 試合分のリアルな対面分析サンプルデータを投入しました！ ==="

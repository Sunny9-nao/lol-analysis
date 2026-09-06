const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || "http://localhost:3001/graphql";

const AUTH_TOKEN_KEY = "lol_rankup_auth_token";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function removeAuthToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export async function fetchGraphQL<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed with HTTP ${response.status}`);
  }

  const result = await response.json();
  if (result.errors && result.errors.length > 0) {
    throw new Error(result.errors.map((e: { message: string }) => e.message).join(", "));
  }

  return result.data;
}

// サモナー情報・試合一覧・使用チャンピオン一覧を取得するクエリ
export const SEARCH_SUMMONER_QUERY = `
  query SearchSummoner($gameName: String!, $tagLine: String!, $force: Boolean) {
    searchSummoner(gameName: $gameName, tagLine: $tagLine, force: $force) {
      id
      puuid
      gameName
      tagLine
      riotId
      summonerLevel
      profileIconId
      profileIconUrl
      isPrivate
      lastSyncedAt
      recentWinRate
      syncStatus
      syncError
      matchParticipants {
        id
        matchId
        championName
        opponentChampionName
        position
        win
        kills
        deaths
        assists
        kdaRatio
        cs
        goldEarned
        totalDamageDealt
        items
        spells
        formattedDuration
        gameMode
        queueId
        queueName
        gameCreation
        champion {
          name
          title
          imageUrl
        }
        opponentChampion {
          name
          title
          imageUrl
        }
        matchNote {
          id
          content
          matchupTag
          updatedAt
        }
        goldDiffAt14
        csDiffAt14
        laneOutcome
        earlyItems {
          timestamp
          itemId
        }
        goldTimeline {
          minute
          goldDiff
          myGold
          oppGold
        }
        killEvents {
          minute
          timestamp
          category
          label
          killer
          victim
        }
        itemTimeline {
          timestamp
          itemId
        }
      }
      playedChampions {
        championName
        matchCount
        winCount
        winRate
        mostPlayedPosition
        champion {
          name
          title
          imageUrl
        }
      }
    }
  }
`;

// 特定チャンピオンに対する対面サマリ一覧を取得するクエリ
export const GET_MATCHUP_SUMMARIES_QUERY = `
  query GetMatchupSummaries($gameName: String!, $tagLine: String!, $championName: String!, $position: String) {
    searchSummoner(gameName: $gameName, tagLine: $tagLine) {
      matchupSummaries(championName: $championName, position: $position) {
        opponentChampionName
        matchCount
        winCount
        winRate
        averageKda
        averageCsPerMinute
        hardCount
        evenCount
        easyCount
        latestNote {
          id
          content
          matchupTag
          updatedAt
        }
        opponentChampion {
          name
          title
          imageUrl
        }
      }
    }
  }
`;

// 特定対面の詳細対戦履歴を取得するクエリ
export const GET_MATCHUP_DETAIL_QUERY = `
  query GetMatchupDetail($gameName: String!, $tagLine: String!, $championName: String!, $opponentChampionName: String!, $position: String) {
    searchSummoner(gameName: $gameName, tagLine: $tagLine) {
      matchupDetail(championName: $championName, opponentChampionName: $opponentChampionName, position: $position) {
        championName
        opponentChampionName
        matchCount
        winCount
        winRate
        averageKda
        averageCsPerMinute
        hardCount
        evenCount
        easyCount
        champion {
          name
          imageUrl
        }
        opponentChampion {
          name
          imageUrl
        }
        participants {
          id
          matchId
          championName
          opponentChampionName
          position
          win
          kills
          deaths
          assists
          kdaRatio
          cs
          goldEarned
          totalDamageDealt
          items
          spells
          formattedDuration
          gameMode
          queueId
          queueName
          gameCreation
          champion {
            name
            title
            imageUrl
          }
          opponentChampion {
            name
            title
            imageUrl
          }
          matchNote {
            id
            content
            matchupTag
            updatedAt
          }
          goldDiffAt14
          csDiffAt14
          laneOutcome
          earlyItems {
            timestamp
            itemId
          }
          goldTimeline {
            minute
            goldDiff
            myGold
            oppGold
          }
          killEvents {
            minute
            timestamp
            category
            label
            killer
            victim
          }
          itemTimeline {
            timestamp
            itemId
          }
        }
      }
    }
  }
`;

// 反省メモの作成・更新 Mutation
export const SAVE_MATCH_NOTE_MUTATION = `
  mutation SaveMatchNote($input: SaveMatchNoteInput!) {
    saveMatchNote(input: $input) {
      matchNote {
        id
        content
        matchupTag
        updatedAt
      }
      errors
    }
  }
`;

// 相手チャンピオンに対する逆引きカウンターレコメンド取得クエリ
export const GET_COUNTER_RECOMMENDATIONS_QUERY = `
  query GetCounterRecommendations($gameName: String!, $tagLine: String!, $opponentChampionName: String!, $position: String) {
    searchSummoner(gameName: $gameName, tagLine: $tagLine) {
      counterRecommendations(opponentChampionName: $opponentChampionName, position: $position) {
        championName
        opponentChampionName
        matchCount
        winCount
        winRate
        averageKda
        averageCsPerMinute
        hardCount
        evenCount
        easyCount
        champion {
          name
          title
          imageUrl
        }
        latestNote {
          id
          content
          matchupTag
          updatedAt
        }
      }
    }
  }
`;

// ログイン中のユーザー自身のアカウント情報
export const ME_QUERY = `
  query Me {
    me {
      id
      email
      summoner {
        id
        gameName
        tagLine
        riotId
      }
    }
  }
`;

// ログインユーザー本人のサモナーデータ取得（個人専用）
export const MY_SUMMONER_QUERY = `
  query MySummoner($force: Boolean) {
    mySummoner(force: $force) {
      id
      puuid
      gameName
      tagLine
      riotId
      summonerLevel
      profileIconId
      profileIconUrl
      isPrivate
      lastSyncedAt
      recentWinRate
      syncStatus
      syncError
      matchParticipants {
        id
        matchId
        championName
        opponentChampionName
        position
        win
        kills
        deaths
        assists
        kdaRatio
        cs
        goldEarned
        totalDamageDealt
        items
        spells
        formattedDuration
        gameMode
        queueId
        queueName
        gameCreation
        champion {
          name
          title
          imageUrl
        }
        opponentChampion {
          name
          title
          imageUrl
        }
        matchNote {
          id
          content
          matchupTag
          updatedAt
        }
        earlyItems {
          timestamp
          itemId
        }
        goldTimeline {
          minute
          goldDiff
          myGold
          oppGold
        }
        killEvents {
          minute
          timestamp
          category
          label
          killer
          victim
        }
        itemTimeline {
          timestamp
          itemId
        }
      }
      playedChampions {
        championName
        matchCount
        winCount
        winRate
        mostPlayedPosition
        champion {
          name
          title
          imageUrl
        }
      }
    }
  }
`;

// サインイン Mutation
export const SIGN_IN_MUTATION = `
  mutation SignIn($email: String!, $password: String!) {
    signIn(input: { email: $email, password: $password }) {
      user {
        id
        email
        summoner {
          id
          gameName
          tagLine
          riotId
        }
      }
      authToken
      errors
    }
  }
`;

// サインアップ Mutation
export const SIGN_UP_MUTATION = `
  mutation SignUp($email: String!, $password: String!) {
    signUp(input: { email: $email, password: $password }) {
      user {
        id
        email
      }
      authToken
      errors
    }
  }
`;

// 自身の Riot ID 登録・連携 Mutation
export const LINK_SUMMONER_MUTATION = `
  mutation LinkSummoner($gameName: String!, $tagLine: String!) {
    linkSummoner(input: { gameName: $gameName, tagLine: $tagLine }) {
      user {
        id
        email
      }
      summoner {
        id
        gameName
        tagLine
        riotId
      }
      errors
    }
  }
`;

// アカウントおよび個人データの完全削除 Mutation
export const DELETE_ACCOUNT_MUTATION = `
  mutation DeleteAccount {
    deleteAccount(input: {}) {
      success
      errors
    }
  }
`;

// 試合同期の非同期開始 Mutation
export const SYNC_MY_SUMMONER_MUTATION = `
  mutation SyncMySummoner($force: Boolean) {
    syncMySummoner(input: { force: $force }) {
      syncStatus
      errors
      summoner {
        id
        gameName
        tagLine
        syncStatus
        syncError
      }
    }
  }
`;



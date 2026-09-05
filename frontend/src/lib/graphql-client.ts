import { Summoner, MatchupDetail, MatchNote } from "@/types/graphql";

const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || "http://localhost:3001/graphql";

export async function fetchGraphQL<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
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

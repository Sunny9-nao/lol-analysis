# frozen_string_literal: true

class TimelineAnalysisService
  attr_reader :timeline_data, :match_raw_info, :puuid, :opponent_champion_name

  def initialize(timeline_data:, match_raw_info:, puuid:, opponent_champion_name: nil)
    @timeline_data = timeline_data
    @match_raw_info = match_raw_info
    @puuid = puuid
    @opponent_champion_name = opponent_champion_name
  end

  def analyze
    return empty_result if timeline_data.blank? || match_raw_info.blank?

    participants = match_raw_info.dig("info", "participants") || []
    my_pid, opp_pid = resolve_participant_ids(participants)
    return empty_result unless my_pid

    frames = timeline_data.dig("info", "frames") || []
    return empty_result if frames.empty?

    # 14分時点（存在しなければ最終フレーム）を取得
    target_frame_index = [ 14, frames.length - 1 ].min
    target_frame = frames[target_frame_index]

    gold_diff_at_14, cs_diff_at_14, lane_outcome = calculate_diffs(target_frame, my_pid, opp_pid)
    early_items = extract_items(frames, my_pid, max_frame_index: target_frame_index)
    item_timeline = extract_items(frames, my_pid)
    gold_timeline = extract_gold_timeline(frames, my_pid, opp_pid)
    kill_events = extract_kill_events(frames, my_pid, opp_pid, participants)

    {
      gold_diff_at_14: gold_diff_at_14,
      cs_diff_at_14: cs_diff_at_14,
      lane_outcome: lane_outcome,
      early_items: early_items,
      item_timeline: item_timeline,
      gold_timeline: gold_timeline,
      kill_events: kill_events
    }
  end

  private

  def resolve_participant_ids(participants)
    my_p = participants.find { |p| p["puuid"] == puuid }
    return [ nil, nil ] unless my_p

    my_pid = my_p["participantId"]
    my_pos = my_p["teamPosition"].presence || my_p["individualPosition"]
    my_team = my_p["teamId"]

    # 対面の特定: 同じレーンポジションかつ敵チーム、または opponent_champion_name
    opp_p = participants.find do |p|
      pos = p["teamPosition"].presence || p["individualPosition"]
      p["teamId"] != my_team && (pos == my_pos || (opponent_champion_name.present? && p["championName"] == opponent_champion_name))
    end

    opp_pid = opp_p&.dig("participantId")
    [ my_pid, opp_pid ]
  end

  def calculate_diffs(target_frame, my_pid, opp_pid)
    p_frames = target_frame["participantFrames"] || {}
    my_frame = p_frames[my_pid.to_s]
    return [ nil, nil, nil ] unless my_frame

    my_gold = my_frame["totalGold"] || 0
    my_cs = (my_frame["minionsKilled"] || 0) + (my_frame["jungleMinionsKilled"] || 0)

    if opp_pid && (opp_frame = p_frames[opp_pid.to_s])
      opp_gold = opp_frame["totalGold"] || 0
      opp_cs = (opp_frame["minionsKilled"] || 0) + (opp_frame["jungleMinionsKilled"] || 0)

      gd = my_gold - opp_gold
      csd = my_cs - opp_cs

      outcome = if gd >= 500 || csd >= 20
                  "win"
      elsif gd <= -500 || csd <= -20
                  "loss"
      else
                  "even"
      end

      [ gd, csd, outcome ]
    else
      [ nil, nil, nil ]
    end
  end

  def extract_items(frames, my_pid, max_frame_index: nil)
    items = []
    target_frames = max_frame_index ? frames[0..max_frame_index] : frames

    target_frames.each do |frame|
      events = frame["events"] || []
      events.each do |event|
        next unless event["participantId"] == my_pid

        case event["type"]
        when "ITEM_PURCHASED"
          item_id = event["itemId"]
          next if item_id.blank? || item_id.zero?

          ts_ms = event["timestamp"] || 0
          minutes = (ts_ms / 60000).to_i
          seconds = ((ts_ms % 60000) / 1000).to_i
          ts_str = format("%02d:%02d", minutes, seconds)

          items << { "timestamp" => ts_str, "itemId" => item_id }
        when "ITEM_UNDO"
          items.pop if items.any?
        end
      end
    end

    items
  end

  def extract_gold_timeline(frames, my_pid, opp_pid)
    timeline = []
    frames.each_with_index do |frame, minute|
      p_frames = frame["participantFrames"] || {}
      my_f = p_frames[my_pid.to_s]
      next unless my_f

      my_gold = my_f["totalGold"] || 0
      opp_gold = opp_pid && p_frames[opp_pid.to_s] ? (p_frames[opp_pid.to_s]["totalGold"] || 0) : nil
      gd = opp_gold ? (my_gold - opp_gold) : nil

      timeline << {
        "minute" => minute,
        "gold_diff" => gd,
        "my_gold" => my_gold,
        "opp_gold" => opp_gold
      }
    end
    timeline
  end

  def extract_kill_events(frames, my_pid, opp_pid, participants)
    kill_events = []
    frames.each do |frame|
      (frame["events"] || []).each do |ev|
        next unless ev["type"] == "CHAMPION_KILL"

        ts = ev["timestamp"] || 0
        min = (ts / 60000).to_i
        sec = ((ts % 60000) / 1000).to_i
        ts_str = format("%02d:%02d", min, sec)
        minute_float = (ts / 60000.0).round(1)

        killer_id = ev["killerId"]
        victim_id = ev["victimId"]

        is_my_kill = (killer_id == my_pid)
        is_my_death = (victim_id == my_pid)
        is_opp_kill = opp_pid && (killer_id == opp_pid)
        is_opp_death = opp_pid && (victim_id == opp_pid)

        category, label = if is_my_kill && is_opp_death
                            [ "solo_kill_opp", "対面キル" ]
        elsif is_opp_kill && is_my_death
                            [ "death_to_opp", "対面にデス" ]
        elsif is_my_kill
                            [ "my_kill", "キル獲得" ]
        elsif is_my_death
                            [ "my_death", "デス" ]
        elsif is_opp_kill
                            [ "opp_kill", "対面がキル獲得" ]
        elsif is_opp_death
                            [ "opp_death", "対面がデス" ]
        end

        next unless category

        killer_part = killer_id.to_i.positive? ? participants.find { |p| p["participantId"] == killer_id } : nil
        victim_part = victim_id.to_i.positive? ? participants.find { |p| p["participantId"] == victim_id } : nil

        killer_champ = killer_part&.dig("championName") || "タワー/ミニオン"
        victim_champ = victim_part&.dig("championName") || "Unknown"

        kill_events << {
          "minute" => minute_float,
          "timestamp" => ts_str,
          "category" => category,
          "label" => label,
          "killer" => killer_champ,
          "victim" => victim_champ
        }
      end
    end
    kill_events
  end

  def empty_result
    {
      gold_diff_at_14: nil,
      cs_diff_at_14: nil,
      lane_outcome: nil,
      early_items: [],
      item_timeline: [],
      gold_timeline: [],
      kill_events: []
    }
  end
end

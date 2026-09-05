# frozen_string_literal: true

client = RiotApiClient.new
summoner = Summoner.find_by(game_name: "Sunny9", tag_line: "hono")
unless summoner
  puts "Summoner not found!"
  exit 1
end

puts "Backfilling timelines for #{summoner.game_name}##{summoner.tag_line}..."
matches = summoner.matches.where(queue_id: 420).order(game_creation: :desc)
puts "Found #{matches.count} solo/duo matches."

matches.each_with_index do |match, idx|
  print "[#{idx + 1}/#{matches.count}] #{match.match_id}... "

  timeline = match.raw_timeline.presence
  if timeline.blank?
    sleep 0.08 # Rate limit safety
    begin
      timeline = client.fetch_match_timeline(match.match_id, region: "asia")
      match.update!(raw_timeline: timeline)
    rescue => e
      puts "Error fetching timeline: #{e.message}"
      next
    end
  end

  participant = match.match_participants.find_by(summoner: summoner)
  unless participant
    puts "No participant record."
    next
  end

  insights = TimelineAnalysisService.new(
    timeline_data: timeline,
    match_raw_info: match.raw_info,
    puuid: summoner.puuid,
    opponent_champion_name: participant.opponent_champion_name
  ).analyze

  participant.update!(
    gold_diff_at_14: insights[:gold_diff_at_14],
    cs_diff_at_14: insights[:cs_diff_at_14],
    lane_outcome: insights[:lane_outcome],
    early_items: insights[:early_items]
  )
  puts "GD@14: #{insights[:gold_diff_at_14]}, Outcome: #{insights[:lane_outcome]}, EarlyItems: #{insights[:early_items]&.count}"
end

puts "Done backfilling timelines!"

# frozen_string_literal: true

require 'rails_helper'

RSpec.describe TimelineAnalysisService do
  let(:puuid) { 'user-puuid-1' }
  let(:match_raw_info) do
    {
      'info' => {
        'participants' => [
          { 'puuid' => puuid, 'participantId' => 1, 'championName' => 'Renekton', 'teamPosition' => 'TOP', 'teamId' => 100 },
          { 'puuid' => 'opp-puuid', 'participantId' => 6, 'championName' => 'Ornn', 'teamPosition' => 'TOP', 'teamId' => 200 }
        ]
      }
    }
  end

  let(:timeline_data) do
    {
      'info' => {
        'frames' => [
          {
            'participantFrames' => {
              '1' => { 'totalGold' => 500, 'minionsKilled' => 0, 'jungleMinionsKilled' => 0 },
              '6' => { 'totalGold' => 500, 'minionsKilled' => 0, 'jungleMinionsKilled' => 0 }
            },
            'events' => [
              { 'type' => 'ITEM_PURCHASED', 'participantId' => 1, 'itemId' => 1055, 'timestamp' => 3000 }
            ]
          },
          {
            'participantFrames' => {
              '1' => { 'totalGold' => 1200, 'minionsKilled' => 10, 'jungleMinionsKilled' => 0 },
              '6' => { 'totalGold' => 900, 'minionsKilled' => 8, 'jungleMinionsKilled' => 0 }
            },
            'events' => [
              {
                'type' => 'CHAMPION_KILL',
                'timestamp' => 65000,
                'killerId' => 1,
                'victimId' => 6,
                'assistingParticipantIds' => []
              }
            ]
          }
        ]
      }
    }
  end

  describe '#analyze' do
    it 'correctly extracts gold_diff, kill_events, and item_timeline' do
      service = described_class.new(
        timeline_data: timeline_data,
        match_raw_info: match_raw_info,
        puuid: puuid,
        opponent_champion_name: 'Ornn'
      )

      result = service.analyze

      expect(result[:gold_timeline].length).to eq(2)
      expect(result[:gold_timeline][0]['gold_diff']).to eq(0)
      expect(result[:gold_timeline][1]['gold_diff']).to eq(300)

      expect(result[:kill_events].length).to eq(1)
      expect(result[:kill_events][0]['category']).to eq('solo_kill_opp')
      expect(result[:kill_events][0]['label']).to eq('対面キル')
      expect(result[:kill_events][0]['killer']).to eq('Renekton')
      expect(result[:kill_events][0]['victim']).to eq('Ornn')

      expect(result[:item_timeline].length).to eq(1)
      expect(result[:item_timeline][0]['itemId']).to eq(1055)
    end
  end
end

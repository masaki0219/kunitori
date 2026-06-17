import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { resolveAIDiscards, runAISetupTurn, runAITurn } from '../ai/aiPlayer';
import BoardView from '../components/board/BoardView';
import ActionBar, { BuildMode } from '../components/Hud/ActionBar';
import DiceDisplay from '../components/Hud/DiceDisplay';
import PlayerPanel from '../components/Hud/PlayerPanel';
import ResourceBar from '../components/Hud/ResourceBar';
import CardModal from '../components/modals/CardModal';
import DevCardEffectModal from '../components/modals/DevCardEffectModal';
import DiscardModal from '../components/modals/DiscardModal';
import StealTargetModal from '../components/modals/StealTargetModal';
import TradeModal from '../components/modals/TradeModal';
import { playersAdjacentToHex } from '../game/board';
import { getBuildableEdges, getBuildableVertices } from '../game/build';
import { isValidSetupFort } from '../game/setup';
import { ResourceType } from '../game/types';
import { useGameStore } from '../store/gameStore';
import { aiEvaluateTrade } from '../ai/aiPlayer';

function setupBuildableEdges(state: ReturnType<typeof useGameStore.getState>): number[] {
  if (state.setup.pendingRoadFromVertex === null) return [];
  const vertex = state.board.vertices[state.setup.pendingRoadFromVertex];
  return vertex.edgeIds.filter((eid) => !state.roads.some((r) => r.edgeId === eid));
}

function setupBuildableVertices(state: ReturnType<typeof useGameStore.getState>): number[] {
  if (state.setup.pendingRoadFromVertex !== null) return [];
  return state.board.vertices.filter((v) => isValidSetupFort(state, v.id)).map((v) => v.id);
}

export default function GameScreen() {
  const state = useGameStore();
  const [buildMode, setBuildMode] = useState<BuildMode>(null);
  const [showTrade, setShowTrade] = useState(false);
  const [showCards, setShowCards] = useState(false);
  const [devCardEffect, setDevCardEffect] = useState<{ mode: 'harvest' | 'requisition'; index: number } | null>(null);
  const aiRunning = useRef(false);

  const currentPlayer = state.players.find((p) => p.id === state.currentPlayer);

  useEffect(() => {
    if (!currentPlayer) return;
    if (!currentPlayer.isAI) return;
    if (aiRunning.current) return;
    if (state.phase === 'gameOver') return;
    aiRunning.current = true;
    const task = state.phase === 'setupPlacement' ? runAISetupTurn() : runAITurn();
    task.finally(() => { aiRunning.current = false; });
  }, [state.currentPlayer, state.phase, state.setup.index, currentPlayer?.isAI]);

  useEffect(() => {
    if (state.phase !== 'discard') return;
    resolveAIDiscards();
  }, [state.phase, state.discardQueue]);

  if (!currentPlayer) return null;

  const isHumanTurn = !currentPlayer.isAI;

  const guideText = (() => {
    switch (state.phase) {
      case 'setupPlacement':
        return state.setup.pendingRoadFromVertex === null ? '砦を置く場所を選んでください' : '街道を置く場所を選んでください';
      case 'roll':
        return 'サイコロを振ってください';
      case 'discard':
        return 'カードを捨ててください';
      case 'moveBandit':
        return '野盗を動かす場所を選んでください';
      case 'steal':
        return '略奪する相手を選んでください';
      case 'main':
        return buildMode ? `${buildMode === 'road' ? '街道' : buildMode === 'fort' ? '砦' : '城'}を置く場所を選んでください` : '交易・建設・カード・手番終了を選べます';
      default:
        return '';
    }
  })();

  const buildableVertexIds =
    state.phase === 'setupPlacement'
      ? setupBuildableVertices(state)
      : buildMode === 'fort'
      ? getBuildableVertices(state, state.currentPlayer)
      : buildMode === 'castle'
      ? state.buildings.filter((b) => b.owner === state.currentPlayer && b.type === 'fort').map((b) => b.vertexId)
      : [];

  const buildableEdgeIds =
    state.phase === 'setupPlacement'
      ? setupBuildableEdges(state)
      : buildMode === 'road'
      ? getBuildableEdges(state, state.currentPlayer)
      : [];

  const selectableHexIds = state.phase === 'moveBandit' ? state.board.hexes.filter((h) => h.id !== state.banditHexId).map((h) => h.id) : [];

  const onVertexPress = (vertexId: number) => {
    if (!isHumanTurn) return;
    if (state.phase === 'setupPlacement') {
      if (state.setup.pendingRoadFromVertex === null) state.placeSetupFort(vertexId);
      return;
    }
    if (state.phase !== 'main') return;
    if (buildMode === 'fort') { state.buildFort(vertexId); setBuildMode(null); }
    else if (buildMode === 'castle') { state.buildCastle(vertexId); setBuildMode(null); }
  };

  const onEdgePress = (edgeId: number) => {
    if (!isHumanTurn) return;
    if (state.phase === 'setupPlacement') {
      state.placeSetupRoad(edgeId);
      return;
    }
    if (state.phase !== 'main') return;
    if (buildMode === 'road') { state.buildRoad(edgeId); if (state.freeRoadsLeft <= 1) setBuildMode(null); }
  };

  const onHexPress = (hexId: number) => {
    if (!isHumanTurn) return;
    if (state.phase === 'moveBandit') state.moveBandit(hexId);
  };

  const discardTarget = state.phase === 'discard'
    ? state.players.find((p) => state.discardQueue.includes(p.id) && !p.isAI)
    : undefined;

  const stealCandidates = state.phase === 'steal'
    ? state.players.filter((p) => playersAdjacentToHex(state, state.banditHexId).includes(p.id) && p.id !== state.currentPlayer)
    : [];

  const handlePlayCard = (index: number) => {
    const card = currentPlayer.cards[index];
    if (card === 'harvest' || card === 'requisition') {
      setDevCardEffect({ mode: card, index });
    } else {
      state.playCard(index);
      if (card === 'warlord') setShowCards(false);
    }
  };

  return (
    <View style={styles.container}>
      <PlayerPanel state={state} />
      <View style={styles.boardWrap}>
        <BoardView
          geo={state.board}
          buildings={state.buildings}
          roads={state.roads}
          players={state.players}
          banditHexId={state.banditHexId}
          buildableVertexIds={isHumanTurn ? buildableVertexIds : []}
          buildableEdgeIds={isHumanTurn ? buildableEdgeIds : []}
          selectableHexIds={isHumanTurn ? selectableHexIds : []}
          onVertexPress={onVertexPress}
          onEdgePress={onEdgePress}
          onHexPress={onHexPress}
        />
      </View>

      <Text style={styles.guide}>{guideText}</Text>
      <DiceDisplay dice={state.dice} />
      <ResourceBar resources={currentPlayer.resources} />

      <ScrollView style={styles.log} horizontal={false}>
        {state.log.slice(-5).map((l, i) => (
          <Text key={i} style={styles.logLine}>{l}</Text>
        ))}
      </ScrollView>

      <ActionBar
        phase={state.phase}
        buildMode={buildMode}
        onSetBuildMode={setBuildMode}
        onRoll={() => state.rollDice()}
        onOpenTrade={() => setShowTrade(true)}
        onOpenCard={() => setShowCards(true)}
        onEndTurn={() => { setBuildMode(null); state.endTurn(); }}
        disabled={!isHumanTurn}
      />

      {discardTarget ? (
        <DiscardModal player={discardTarget} onConfirm={(give) => state.discardCards(discardTarget.id, give)} />
      ) : null}

      {state.phase === 'steal' && stealCandidates.length > 1 && isHumanTurn ? (
        <StealTargetModal candidates={stealCandidates} onSelect={(id) => state.stealFrom(id)} />
      ) : null}

      {showTrade ? (
        <TradeModal
          currentPlayer={currentPlayer}
          otherPlayers={state.players.filter((p) => p.id !== currentPlayer.id)}
          onBankTrade={(give, take) => state.bankTrade(give, take)}
          onProposeTrade={(toPlayer, give, want) => {
            state.proposeTrade(toPlayer, give, want);
            const target = state.players.find((p) => p.id === toPlayer)!;
            if (target.isAI) {
              const accept = aiEvaluateTrade(target, give, want);
              setTimeout(() => useGameStore.getState().respondTrade(accept), 300);
            }
          }}
          onClose={() => setShowTrade(false)}
        />
      ) : null}

      {showCards ? (
        <CardModal
          state={state}
          onBuy={() => state.buyCard()}
          onPlay={handlePlayCard}
          onClose={() => setShowCards(false)}
        />
      ) : null}

      {devCardEffect ? (
        <DevCardEffectModal
          mode={devCardEffect.mode}
          onConfirmHarvest={(picks: ResourceType[]) => {
            state.playCard(devCardEffect.index, { picks });
            setDevCardEffect(null);
          }}
          onConfirmRequisition={(resource: ResourceType) => {
            state.playCard(devCardEffect.index, { resource });
            setDevCardEffect(null);
          }}
          onCancel={() => setDevCardEffect(null)}
        />
      ) : null}

      {state.pendingTrade && !state.players.find((p) => p.id === state.pendingTrade!.to)!.isAI ? (
        <View style={styles.respondOverlay}>
          <View style={styles.respondCard}>
            <Text style={styles.respondText}>
              {state.players.find((p) => p.id === state.pendingTrade!.from)?.name} からの交易提案です
            </Text>
            <View style={styles.respondRow}>
              <Text onPress={() => state.respondTrade(true)} style={styles.respondAccept}>承諾</Text>
              <Text onPress={() => state.respondTrade(false)} style={styles.respondReject}>拒否</Text>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F0' },
  boardWrap: { alignItems: 'center' },
  guide: { textAlign: 'center', fontSize: 13, color: '#444', paddingVertical: 4 },
  log: { maxHeight: 60, paddingHorizontal: 12 },
  logLine: { fontSize: 11, color: '#777' },
  respondOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  respondCard: { backgroundColor: '#fff', borderRadius: 12, padding: 20, width: '80%', gap: 16 },
  respondText: { fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
  respondRow: { flexDirection: 'row', justifyContent: 'space-around' },
  respondAccept: { color: '#07814E', fontWeight: 'bold', fontSize: 16 },
  respondReject: { color: '#C0392B', fontWeight: 'bold', fontSize: 16 },
});

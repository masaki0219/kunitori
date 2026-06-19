import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { resolveAIDiscards, runAISetupTurn, runAITurn } from '../ai/aiPlayer';
import BoardView from '../components/board/BoardView';
import ActionBar, { BuildMode } from '../components/Hud/ActionBar';
import DiceTray from '../components/Hud/DiceTray';
import EventLog from '../components/Hud/EventLog';
import PlayerHandPanel from '../components/Hud/PlayerHandPanel';
import PlayerPanel from '../components/Hud/PlayerPanel';
import TopBar from '../components/Hud/TopBar';
import CardModal from '../components/modals/CardModal';
import DevCardEffectModal from '../components/modals/DevCardEffectModal';
import DiscardModal from '../components/modals/DiscardModal';
import RulesModal from '../components/modals/RulesModal';
import StealTargetModal from '../components/modals/StealTargetModal';
import TradeModal from '../components/modals/TradeModal';
import { PALETTE, RADIUS, SPACING, TYPE, ELEVATION } from '../config/theme';
import { playersAdjacentToHex } from '../game/board';
import { getBuildableEdges, getBuildableVertices } from '../game/build';
import { isValidSetupFort } from '../game/setup';
import { ResourceType } from '../game/types';
import { useGameStore } from '../store/gameStore';
import { aiEvaluateTrade } from '../ai/aiPlayer';
import { useNetStore } from '../net/netStore';

const TOP_RESERVE_COMPACT = 40;
const TOP_RESERVE_RICH = 64;
const BOTTOM_RESERVE_COMPACT = 88;
const BOTTOM_RESERVE_RICH = 132;

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
  const { mode, role, mySeat, status, dispatch } = useNetStore();
  const [buildMode, setBuildMode] = useState<BuildMode>(null);
  const [showTrade, setShowTrade] = useState(false);
  const [showCards, setShowCards] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [devCardEffect, setDevCardEffect] = useState<{ mode: 'harvest' | 'requisition'; index: number } | null>(null);
  const aiRunning = useRef(false);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const compact = height < 600;
  const topReserve = (compact ? TOP_RESERVE_COMPACT : TOP_RESERVE_RICH) + insets.top;
  const bottomReserve = (compact ? BOTTOM_RESERVE_COMPACT : BOTTOM_RESERVE_RICH) + insets.bottom;
  const boardSize = Math.min(
    height - topReserve - bottomReserve,
    width * (compact ? 0.74 : 0.56)
  );

  const currentPlayer = state.players.find((p) => p.id === state.currentPlayer);

  useEffect(() => {
    const net = useNetStore.getState();
    if (!(net.mode === 'local' || net.role === 'host')) return; // ゲストはAIを動かさない
    if (!currentPlayer) return;
    if (!currentPlayer.isAI) return;
    if (aiRunning.current) return;
    if (state.phase === 'gameOver') return;
    aiRunning.current = true;
    const task = state.phase === 'setupPlacement' ? runAISetupTurn() : runAITurn();
    task.finally(() => { aiRunning.current = false; });
  }, [state.currentPlayer, state.phase, state.setup.index, currentPlayer?.isAI]);

  useEffect(() => {
    const net = useNetStore.getState();
    if (!(net.mode === 'local' || net.role === 'host')) return; // ゲストはAIを動かさない
    if (state.phase !== 'discard') return;
    resolveAIDiscards();
  }, [state.phase, state.discardQueue]);

  if (!currentPlayer) return null;

  const isMyTurn = mode === 'local'
    ? !currentPlayer.isAI                                  // 従来のパススルー
    : state.currentPlayer === mySeat && !currentPlayer.isAI; // オンラインは自席のみ

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
    if (!isMyTurn) return;
    if (state.phase === 'setupPlacement') {
      if (state.setup.pendingRoadFromVertex === null) dispatch({ t: 'placeSetupFort', vertexId });
      return;
    }
    if (state.phase !== 'main') return;
    if (buildMode === 'fort') { dispatch({ t: 'buildFort', vertexId }); setBuildMode(null); }
    else if (buildMode === 'castle') { dispatch({ t: 'buildCastle', vertexId }); setBuildMode(null); }
  };

  const onEdgePress = (edgeId: number) => {
    if (!isMyTurn) return;
    if (state.phase === 'setupPlacement') {
      dispatch({ t: 'placeSetupRoad', edgeId });
      return;
    }
    if (state.phase !== 'main') return;
    if (buildMode === 'road') { dispatch({ t: 'buildRoad', edgeId }); if (state.freeRoadsLeft <= 1) setBuildMode(null); }
  };

  const onHexPress = (hexId: number) => {
    if (!isMyTurn) return;
    if (state.phase === 'moveBandit') dispatch({ t: 'moveBandit', hexId });
  };

  const discardTarget = state.phase === 'discard'
    ? mode === 'online'
      ? (mySeat != null && state.discardQueue.includes(mySeat) ? state.players.find((p) => p.id === mySeat) : undefined)
      : state.players.find((p) => state.discardQueue.includes(p.id) && !p.isAI)
    : undefined;

  const stealCandidates = state.phase === 'steal'
    ? state.players.filter((p) => playersAdjacentToHex(state, state.banditHexId).includes(p.id) && p.id !== state.currentPlayer)
    : [];

  const showWaiting = mode === 'online' && state.currentPlayer !== mySeat && state.phase !== 'gameOver';
  const turnName = state.players[state.currentPlayer]?.name ?? '';

  const handlePlayCard = (index: number) => {
    const card = currentPlayer.cards[index];
    if (card === 'harvest' || card === 'requisition') {
      setDevCardEffect({ mode: card, index });
    } else {
      dispatch({ t: 'playCard', index });
      if (card === 'warlord') setShowCards(false);
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={[PALETTE.wood500, PALETTE.wood900]} style={StyleSheet.absoluteFill} />

      {showWaiting && !compact ? (
        <View style={styles.turnBanner}>
          <Text style={styles.turnBannerText}>{turnName} のターンです</Text>
        </View>
      ) : null}
      {mode === 'online' && status !== 'connected' ? (
        <View style={styles.netBanner}>
          <Text style={styles.netBannerText}>通信状態: {statusLabel(status)}（再接続を試みています）</Text>
        </View>
      ) : null}

      <View style={[styles.boardWrap, { top: topReserve, bottom: bottomReserve }]}>
        <BoardView
          size={boardSize}
          geo={state.board}
          buildings={state.buildings}
          roads={state.roads}
          players={state.players}
          banditHexId={state.banditHexId}
          buildableVertexIds={isMyTurn ? buildableVertexIds : []}
          buildableEdgeIds={isMyTurn ? buildableEdgeIds : []}
          selectableHexIds={isMyTurn ? selectableHexIds : []}
          onVertexPress={onVertexPress}
          onEdgePress={onEdgePress}
          onHexPress={onHexPress}
        />
      </View>

      <TopBar
        style={[styles.topBar, { top: insets.top + SPACING.sm, left: insets.left + SPACING.md, right: insets.right + SPACING.md }]}
        onMenu={() => useGameStore.getState().goToScreen('title')}
        onRules={() => setShowRules(true)}
      />

      <EventLog
        style={[styles.eventLog, { top: topReserve, left: insets.left + SPACING.md, width: compact ? 150 : 200 }]}
        log={state.log}
        guideText={guideText}
        compact={compact}
      />

      <PlayerPanel
        style={[styles.playerRail, { top: topReserve, right: insets.right + SPACING.md, width: compact ? 140 : 168 }]}
        state={state}
        compact={compact}
      />

      <View style={[styles.bottomBar, { left: insets.left + SPACING.sm, right: insets.right + SPACING.sm, bottom: insets.bottom + SPACING.sm }]}>
        <PlayerHandPanel style={styles.handGroup} state={state} compact={compact} />

        <DiceTray
          style={styles.diceGroup}
          phase={state.phase}
          dice={state.dice}
          onRoll={() => dispatch({ t: 'rollDice' })}
          onEndTurn={() => { setBuildMode(null); dispatch({ t: 'endTurn' }); }}
          disabled={!isMyTurn}
        />

        <ActionBar
          style={styles.actionGroup}
          phase={state.phase}
          buildMode={buildMode}
          player={currentPlayer}
          onSetBuildMode={setBuildMode}
          onRoll={() => dispatch({ t: 'rollDice' })}
          onOpenTrade={() => setShowTrade(true)}
          onOpenCard={() => setShowCards(true)}
          onOpenRules={() => setShowRules(true)}
          onEndTurn={() => { setBuildMode(null); dispatch({ t: 'endTurn' }); }}
          disabled={!isMyTurn}
          compact={compact}
        />
      </View>

      {showRules ? <RulesModal onClose={() => setShowRules(false)} /> : null}

      {discardTarget ? (
        <DiscardModal player={discardTarget} onConfirm={(give) => dispatch({ t: 'discardCards', playerId: discardTarget.id, give })} />
      ) : null}

      {state.phase === 'steal' && stealCandidates.length > 1 && isMyTurn ? (
        <StealTargetModal candidates={stealCandidates} onSelect={(id) => dispatch({ t: 'stealFrom', targetId: id })} />
      ) : null}

      {showTrade ? (
        <TradeModal
          currentPlayer={currentPlayer}
          otherPlayers={state.players.filter((p) => p.id !== currentPlayer.id)}
          onBankTrade={(give, take) => dispatch({ t: 'bankTrade', give, take })}
          onProposeTrade={(toPlayer, give, want) => {
            dispatch({ t: 'proposeTrade', toPlayer, give, want });
            const target = state.players.find((p) => p.id === toPlayer)!;
            if (target.isAI && (mode === 'local' || role === 'host')) {
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
          onBuy={() => dispatch({ t: 'buyCard' })}
          onPlay={handlePlayCard}
          onClose={() => setShowCards(false)}
        />
      ) : null}

      {devCardEffect ? (
        <DevCardEffectModal
          mode={devCardEffect.mode}
          onConfirmHarvest={(picks: ResourceType[]) => {
            dispatch({ t: 'playCard', index: devCardEffect.index, payload: { picks } });
            setDevCardEffect(null);
          }}
          onConfirmRequisition={(resource: ResourceType) => {
            dispatch({ t: 'playCard', index: devCardEffect.index, payload: { resource } });
            setDevCardEffect(null);
          }}
          onCancel={() => setDevCardEffect(null)}
        />
      ) : null}

      {state.pendingTrade && (
        mode === 'online'
          ? state.pendingTrade.to === mySeat
          : !state.players.find((p) => p.id === state.pendingTrade!.to)!.isAI
      ) ? (
        <View style={styles.respondOverlay}>
          <View style={styles.respondCard}>
            <Text style={styles.respondText}>
              {state.players.find((p) => p.id === state.pendingTrade!.from)?.name} からの交易提案です
            </Text>
            <View style={styles.respondRow}>
              <Text onPress={() => dispatch({ t: 'respondTrade', accept: true })} style={styles.respondAccept}>承諾</Text>
              <Text onPress={() => dispatch({ t: 'respondTrade', accept: false })} style={styles.respondReject}>拒否</Text>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function statusLabel(s: string) {
  return s === 'connected' ? '接続済み' : s === 'connecting' ? '接続中…'
    : s === 'disconnected' ? '切断' : s === 'error' ? 'エラー' : '待機';
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  boardWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', justifyContent: 'center' },
  topBar: { position: 'absolute' },
  eventLog: { position: 'absolute' },
  playerRail: { position: 'absolute' },
  bottomBar: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  handGroup: { flexShrink: 0 },
  diceGroup: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  actionGroup: { flexShrink: 0 },
  respondOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  respondCard: { backgroundColor: PALETTE.washi, borderRadius: RADIUS.lg, padding: 20, width: '50%', gap: 16, ...ELEVATION.floating },
  respondText: { ...TYPE.body, fontWeight: 'bold', textAlign: 'center', color: PALETTE.ink },
  respondRow: { flexDirection: 'row', justifyContent: 'space-around' },
  respondAccept: { color: PALETTE.brandGreen, fontWeight: 'bold', fontSize: 16 },
  respondReject: { color: PALETTE.vermilion, fontWeight: 'bold', fontSize: 16 },
  turnBanner: { position: 'absolute', top: SPACING.sm, alignSelf: 'center', backgroundColor: 'rgba(7,129,78,0.85)', paddingVertical: 6, paddingHorizontal: SPACING.md, borderRadius: RADIUS.md, zIndex: 5 },
  turnBannerText: { color: '#fff', fontWeight: 'bold' },
  netBanner: { position: 'absolute', top: SPACING.sm, alignSelf: 'center', backgroundColor: '#FBE9E7', paddingVertical: 6, paddingHorizontal: SPACING.md, borderRadius: RADIUS.md, zIndex: 5 },
  netBannerText: { color: '#C0392B', fontSize: 12 },
});

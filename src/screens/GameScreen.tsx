import React, { useEffect, useRef, useState } from 'react';
import { Image, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { resolveAIDiscards, runAISetupTurn, runAITurn } from '../ai/aiPlayer';
import BoardView from '../components/board/BoardView';
import ActionBar, { BuildMode } from '../components/Hud/ActionBar';
import DiceTray from '../components/Hud/DiceTray';
import EventLog from '../components/Hud/EventLog';
import PlayerHandPanel from '../components/Hud/PlayerHandPanel';
import PlayerPanel from '../components/Hud/PlayerPanel';
import TopBar from '../components/Hud/TopBar';
import StampPicker from '../components/Hud/StampPicker';
import StampDisplay from '../components/Hud/StampDisplay';
import VassalModal from '../components/modals/VassalModal';
import DiscardModal from '../components/modals/DiscardModal';
import RulesModal from '../components/modals/RulesModal';
import SettingsModal from '../components/modals/SettingsModal';
import ConfirmDialog from '../components/modals/ConfirmDialog';
import StealTargetModal from '../components/modals/StealTargetModal';
import TradeModal from '../components/modals/TradeModal';
import { PALETTE, RADIUS, SPACING, TYPE, ELEVATION } from '../config/theme';
import { TABLE_IMAGE } from '../config/assets';
import { playersAdjacentToHex } from '../game/board';
import { getBuildableEdges, getBuildableVertices } from '../game/build';
import { isValidSetupFort } from '../game/setup';
import { effectiveTradeRate } from '../game/trade';
import { ResourceType } from '../game/types';
import { useGameStore } from '../store/gameStore';
import { aiEvaluateTrade } from '../ai/aiPlayer';
import { useNetStore } from '../net/netStore';

const TOP_RESERVE = 56; // 港ラベルが画面上端で切れないよう盤面を下げる。帯中心=(topReserve+(height-bottomReserve))/2 のため +2 で約1px下がる。
const BOTTOM_RESERVE = 72;

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
  const { mode, role, mySeat, status, dispatch, sendStamp } = useNetStore();
  const [buildMode, setBuildMode] = useState<BuildMode>(null);
  const [showTrade, setShowTrade] = useState(false);
  const [showCards, setShowCards] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showConfirmHome, setShowConfirmHome] = useState(false);
  const [showStamp, setShowStamp] = useState(false);
  const aiRunning = useRef(false);
  const [aiTick, setAiTick] = useState(0);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const compact = height < 600;
  const topReserve = TOP_RESERVE + insets.top;
  const bottomReserve = BOTTOM_RESERVE + insets.bottom;
  // 盤面サイズ：横幅主導で大きく取り、上下は「海のフチ」だけ HUD の下に潜り込むのを許容する。
  // 陸地は SVG の中央 ~75% に収まるため、SVG 自体を安全域より少し大きくしても陸は被らない。
  const boardSize = Math.min(
    width * 0.80,                          // 横：左右パネルの隙間に収まる上限
    height - insets.top - insets.bottom,   // 縦：ほぼ全高（海フチが上下HUDへ僅かにはみ出す）
    720                                    // 巨大化しすぎ防止の上限
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
    task.finally(() => {
      aiRunning.current = false;
      // ガード解除は再レンダリングを伴わないため、AI→AI の連続手番が取りこぼされる。
      // 次がAIの「自律開始局面」のときだけ再評価を強制する（discardは人間待ちのため除外＝無限ループ防止）。
      const s = useGameStore.getState();
      const cur = s.players.find((p) => p.id === s.currentPlayer);
      if (cur?.isAI && (s.phase === 'roll' || s.phase === 'setupPlacement')) {
        setAiTick((t) => t + 1);
      }
    });
  }, [state.currentPlayer, state.phase, state.setup.index, currentPlayer?.isAI, aiTick]);

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

  // 表示基準。ローカルは手番者＝自分（従来挙動）、オンラインは自席で固定。
  const viewerId = mode === 'online' && mySeat != null ? mySeat : state.currentPlayer;

  const guideText = (() => {
    switch (state.phase) {
      case 'setupPlacement':
        return state.setup.pendingRoadFromVertex === null ? '砦を置く場所を選んでください' : '街道を置く場所を選んでください';
      case 'roll':
        return 'サイコロを振ってください';
      case 'discard':
        return '年貢を供出してください';
      case 'moveBandit':
        return '一揆を起こす場所を選んでください';
      case 'steal':
        return '略奪する相手を選んでください';
      case 'main':
        return buildMode ? `${buildMode === 'road' ? '街道' : buildMode === 'fort' ? '砦' : '城'}を置く場所を選んでください` : '建設・交易・登用が行えます';
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
    if (buildMode === 'road') { dispatch({ t: 'buildRoad', edgeId }); setBuildMode(null); }
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

  const turnName = state.players[state.currentPlayer]?.name ?? '';

  const tradeRates: Record<ResourceType, number> = {
    timber: effectiveTradeRate(state, currentPlayer.id, 'timber'),
    stone: effectiveTradeRate(state, currentPlayer.id, 'stone'),
    rice: effectiveTradeRate(state, currentPlayer.id, 'rice'),
    horse: effectiveTradeRate(state, currentPlayer.id, 'horse'),
    iron: effectiveTradeRate(state, currentPlayer.id, 'iron'),
  };

  const quitToHome = () => {
    useNetStore.getState().leaveRoom();
    useGameStore.getState().quitToHome();
  };

  return (
    <View style={styles.root}>
      <Image
        source={TABLE_IMAGE}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />

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
        onSettings={() => setShowSettings(true)}
        onRules={() => setShowRules(true)}
        onStamp={mode === 'online' ? () => setShowStamp(true) : undefined}
      />

      <StampDisplay style={{ top: insets.top + 56 }} />

      <EventLog
        style={[styles.eventLog, { top: insets.top + 56, left: insets.left + SPACING.md, width: compact ? 150 : 190 }]}
        log={state.log}
        guideText={guideText}
        isMyTurn={isMyTurn}
        turnName={turnName}
        compact={compact}
        players={state.players}
      />

      <PlayerPanel
        style={[styles.playerRail, { top: insets.top + 56, right: insets.right + SPACING.md, width: compact ? 132 : 156 }]}
        state={state}
        viewerId={viewerId}
        compact={compact}
      />

      {/* 下部：手札(左)／サイコロ＋手番終了(中央)／建設ドック(右) を1本のフレックス行で配置 */}
      <View
        style={[styles.bottomRow, {
          left: insets.left + SPACING.sm,
          right: insets.right + SPACING.sm,
          bottom: insets.bottom + SPACING.sm,
        }]}
        pointerEvents="box-none"
      >
        <PlayerHandPanel state={state} viewerId={viewerId} compact={compact} />

        <View style={styles.rightStack} pointerEvents="box-none">
          <View style={styles.diceRow} pointerEvents="box-none">
            <DiceTray
              phase={state.phase}
              dice={state.dice}
              onRoll={() => dispatch({ t: 'rollDice' })}
              onEndTurn={() => { setBuildMode(null); dispatch({ t: 'endTurn' }); }}
              disabled={!isMyTurn}
            />
          </View>

          <ActionBar
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
      </View>

      {showRules ? <RulesModal onClose={() => setShowRules(false)} /> : null}

      {showStamp ? (
        <StampPicker
          onPick={(stampId) => sendStamp(stampId)}
          onClose={() => setShowStamp(false)}
        />
      ) : null}

      {showSettings ? (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onQuitToHome={() => { setShowSettings(false); setShowConfirmHome(true); }}
        />
      ) : null}

      {showConfirmHome ? (
        <ConfirmDialog
          title="ホームに戻りますか？"
          message="現在の対局は破棄されます。よろしいですか？"
          confirmLabel="ホームに戻る"
          cancelLabel="続ける"
          destructive
          onConfirm={() => { setShowConfirmHome(false); quitToHome(); }}
          onCancel={() => setShowConfirmHome(false)}
        />
      ) : null}

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
          rates={tradeRates}
          onBankTrade={(give, take) => {
            try { dispatch({ t: 'bankTrade', give, take }); }
            catch (e) { console.error('[bankTrade] crash', e); }
          }}
          onProposeTrade={(toPlayer, give, want) => {
            try {
              dispatch({ t: 'proposeTrade', toPlayer, give, want });
              const target = useGameStore.getState().players.find((p) => p.id === toPlayer);
              if (target?.isAI && (mode === 'local' || role === 'host')) {
                const accept = aiEvaluateTrade(target, give, want);
                setTimeout(() => {
                  try { useGameStore.getState().respondTrade(accept); }
                  catch (e) { console.error('[respondTrade async] crash', e); }
                }, 300);
              }
            } catch (e) { console.error('[proposeTrade] crash', e); }
          }}
          onClose={() => setShowTrade(false)}
        />
      ) : null}

      {showCards ? (
        <VassalModal
          state={state}
          onRecruit={() => dispatch({ t: 'recruitVassal' })}
          onClose={() => setShowCards(false)}
        />
      ) : null}

      {(() => {
        const pt = state.pendingTrade;
        if (!pt) return null;
        const toPlayer = state.players.find((p) => p.id === pt.to);
        const fromPlayer = state.players.find((p) => p.id === pt.from);
        const shouldShow = mode === 'online' ? pt.to === mySeat : toPlayer ? !toPlayer.isAI : false;
        if (!shouldShow) return null;
        return (
          <View style={styles.respondOverlay}>
            <View style={styles.respondCard}>
              <Text style={styles.respondText}>{fromPlayer?.name ?? '相手'} からの交易提案です</Text>
              <View style={styles.respondRow}>
                <Text onPress={() => dispatch({ t: 'respondTrade', accept: true })} style={styles.respondAccept}>承諾</Text>
                <Text onPress={() => dispatch({ t: 'respondTrade', accept: false })} style={styles.respondReject}>拒否</Text>
              </View>
            </View>
          </View>
        );
      })()}
    </View>
  );
}

function statusLabel(s: string) {
  return s === 'connected' ? '接続済み' : s === 'connecting' ? '接続中…'
    : s === 'disconnected' ? '切断' : s === 'error' ? 'エラー' : '待機';
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  boardWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', justifyContent: 'center', ...ELEVATION.floating },
  topBar: { position: 'absolute' },
  eventLog: { position: 'absolute' },
  playerRail: { position: 'absolute' },
  bottomRow: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  rightStack: { alignItems: 'flex-end', gap: SPACING.sm },
  diceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: SPACING.md },
  respondOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  respondCard: { backgroundColor: PALETTE.washi, borderRadius: RADIUS.lg, padding: 20, width: '50%', gap: 16, ...ELEVATION.floating },
  respondText: { ...TYPE.body, fontWeight: 'bold', textAlign: 'center', color: PALETTE.ink },
  respondRow: { flexDirection: 'row', justifyContent: 'space-around' },
  respondAccept: { color: PALETTE.brandGreen, fontWeight: 'bold', fontSize: 16 },
  respondReject: { color: PALETTE.vermilion, fontWeight: 'bold', fontSize: 16 },
  netBanner: { position: 'absolute', top: SPACING.sm, alignSelf: 'center', backgroundColor: '#FBE9E7', paddingVertical: 6, paddingHorizontal: SPACING.md, borderRadius: RADIUS.md, zIndex: 5 },
  netBannerText: { color: '#C0392B', fontSize: 12 },
});

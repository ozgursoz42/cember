import React, { useState, useEffect } from 'react';
import { ShoppingBag, Star, Check, Sparkles, Shield, Zap, Lock, ArrowLeft, X } from 'lucide-react';
import {
  PLAYER_PADDLE_SKINS,
  OPPONENT_PADDLE_SKINS,
  BALL_SKINS,
  SINGLE_GAME_BOOSTERS,
  ShopPaddleSkin,
  ShopBallSkin,
  ShopBooster,
  getShopState,
  getAvailableStars,
  buyPaddleSkin,
  buyBallSkin,
  equipPlayerSkin,
  equipOpponentSkin,
  equipBallSkin,
  buyBooster,
  toggleActiveMatchBooster,
  ShopState,
} from '../shopData';
import { soundEngine } from '../utils/audio';

interface ShopModalProps {
  onClose: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'player' | 'opponent' | 'ball' | 'boosters'>('player');
  const [shopState, setShopState] = useState<ShopState>(getShopState());
  const [availableStars, setAvailableStars] = useState<number>(getAvailableStars());
  const [toastMsg, setToastMsg] = useState<string>('');

  const refreshState = () => {
    setShopState(getShopState());
    setAvailableStars(getAvailableStars());
  };

  useEffect(() => {
    refreshState();
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  };

  const handleBuyPlayerSkin = (skin: ShopPaddleSkin) => {
    soundEngine.playClick();
    if (shopState.unlockedItemIds.includes(skin.id)) {
      equipPlayerSkin(skin.id);
      showToast(`✨ ${skin.name} Kuşanıldı!`);
      refreshState();
    } else {
      const ok = buyPaddleSkin(skin, false);
      if (ok) {
        soundEngine.playScore(true);
        showToast(`🎉 ${skin.name} Satın Alındı ve Kuşanıldı!`);
        refreshState();
      } else {
        showToast('❌ Yeterli Yıldızın Yok! Bölümleri geçerek yıldız kazan.');
      }
    }
  };

  const handleBuyOpponentSkin = (skin: ShopPaddleSkin) => {
    soundEngine.playClick();
    if (shopState.unlockedItemIds.includes(skin.id)) {
      equipOpponentSkin(skin.id);
      showToast(`🤖 Rakip Çubuğu: ${skin.name} Seçildi!`);
      refreshState();
    } else {
      const ok = buyPaddleSkin(skin, true);
      if (ok) {
        soundEngine.playScore(true);
        showToast(`🎉 Rakip Çubuğu: ${skin.name} Satın Alındı!`);
        refreshState();
      } else {
        showToast('❌ Yeterli Yıldızın Yok! Bölümleri geçerek yıldız kazan.');
      }
    }
  };

  const handleBuyBallSkin = (skin: ShopBallSkin) => {
    soundEngine.playClick();
    if (shopState.unlockedItemIds.includes(skin.id)) {
      equipBallSkin(skin.id);
      showToast(`⚽ Top Kaplaması: ${skin.name} Kuşanıldı!`);
      refreshState();
    } else {
      const ok = buyBallSkin(skin);
      if (ok) {
        soundEngine.playScore(true);
        showToast(`🎉 Top Kaplaması: ${skin.name} Satın Alındı ve Kuşanıldı!`);
        refreshState();
      } else {
        showToast('❌ Yeterli Yıldızın Yok! Bölümleri geçerek yıldız kazan.');
      }
    }
  };

  const handleBuyBooster = (booster: ShopBooster) => {
    soundEngine.playClick();
    const ok = buyBooster(booster);
    if (ok) {
      soundEngine.playScore(true);
      showToast(`⚡ ${booster.name} Alındı! Sıradaki maçta otomatik aktif.`);
      refreshState();
    } else {
      showToast('❌ Yeterli Yıldızın Yok!');
    }
  };

  const handleToggleBooster = (boosterId: string) => {
    soundEngine.playClick();
    toggleActiveMatchBooster(boosterId);
    refreshState();
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative w-full h-full max-h-[92vh] max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-4 flex flex-col shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white leading-none">ARENA MAĞAZASI</h3>
              <p className="text-[10px] font-bold text-slate-400 mt-0.5">Çubuklar & Tek Maçlık Güçler</p>
            </div>
          </div>

          {/* Star Balance Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-amber-400/30 to-amber-500/20 border border-amber-400/60 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400 animate-spin" style={{ animationDuration: '8s' }} />
            <span className="font-mono text-sm font-black text-white">{availableStars}</span>
            <span className="text-[10px] font-extrabold uppercase text-amber-300">YILDIZ</span>
          </div>

          <button
            id="close-shop-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition active:scale-95 ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toast Notification */}
        {toastMsg && (
          <div className="w-full mt-2 px-3 py-1.5 rounded-xl bg-slate-950/95 border border-amber-500/60 text-amber-300 text-xs font-bold text-center shadow-lg animate-in fade-in duration-150">
            {toastMsg}
          </div>
        )}

        {/* Tabs Bar */}
        <div className="w-full my-2.5 p-1 bg-slate-950/70 rounded-2xl border border-slate-800 grid grid-cols-4 gap-1">
          <button
            id="tab-player-paddles"
            onClick={() => {
              soundEngine.playClick();
              setActiveTab('player');
            }}
            className={`py-2 px-1 rounded-xl text-[10px] sm:text-[11px] font-black transition flex items-center justify-center gap-1 truncate ${
              activeTab === 'player'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🎨</span>
            <span>Bizim</span>
          </button>

          <button
            id="tab-opp-paddles"
            onClick={() => {
              soundEngine.playClick();
              setActiveTab('opponent');
            }}
            className={`py-2 px-1 rounded-xl text-[10px] sm:text-[11px] font-black transition flex items-center justify-center gap-1 truncate ${
              activeTab === 'opponent'
                ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🤖</span>
            <span>Rakip</span>
          </button>

          <button
            id="tab-ball-skins"
            onClick={() => {
              soundEngine.playClick();
              setActiveTab('ball');
            }}
            className={`py-2 px-1 rounded-xl text-[10px] sm:text-[11px] font-black transition flex items-center justify-center gap-1 truncate ${
              activeTab === 'ball'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>⚽</span>
            <span>Top</span>
          </button>

          <button
            id="tab-boosters"
            onClick={() => {
              soundEngine.playClick();
              setActiveTab('boosters');
            }}
            className={`py-2 px-1 rounded-xl text-[10px] sm:text-[11px] font-black transition flex items-center justify-center gap-1 truncate ${
              activeTab === 'boosters'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>⚡</span>
            <span>Güçler</span>
          </button>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 my-1">
          {/* TAB 1: PLAYER PADDLES */}
          {activeTab === 'player' && (
            <div className="space-y-2">
              <p className="text-[11px] font-medium text-slate-400 px-1">
                Kendi oyundaki çubuğunun renk stilini özelleştir. Yıldızla bir kez satın al, istediğin zaman kuşan!
              </p>

              {PLAYER_PADDLE_SKINS.map((skin) => {
                const isUnlocked = shopState.unlockedItemIds.includes(skin.id);
                const isEquipped = shopState.equippedPlayerSkinId === skin.id;

                return (
                  <div
                    key={skin.id}
                    className={`p-3 rounded-2xl border transition flex items-center justify-between gap-3 ${
                      isEquipped
                        ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                        : isUnlocked
                        ? 'bg-slate-950/60 border-slate-800'
                        : 'bg-slate-950/40 border-slate-800/80 opacity-90'
                    }`}
                  >
                    {/* Visual Color Preview */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-12 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center relative overflow-hidden shadow-inner shrink-0">
                        <div
                          className="w-9 h-3.5 rounded-full shadow-md transition-all"
                          style={{
                            backgroundColor: skin.color,
                            boxShadow: `0 0 10px ${skin.glowColor}`,
                          }}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-black text-white truncate">{skin.name}</span>
                          <span className="text-xs">{skin.icon}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight">{skin.description}</p>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="shrink-0">
                      {isEquipped ? (
                        <span className="px-3 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-400/60 text-cyan-300 font-extrabold text-[11px] flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> KUŞANILDI
                        </span>
                      ) : isUnlocked ? (
                        <button
                          id={`equip-player-skin-${skin.id}`}
                          onClick={() => handleBuyPlayerSkin(skin)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-[11px] border border-slate-700 transition active:scale-95"
                        >
                          KUŞAN
                        </button>
                      ) : (
                        <button
                          id={`buy-player-skin-${skin.id}`}
                          onClick={() => handleBuyPlayerSkin(skin)}
                          disabled={availableStars < skin.priceStars}
                          className={`px-3 py-1.5 rounded-xl font-black text-[11px] flex items-center gap-1 transition active:scale-95 ${
                            availableStars >= skin.priceStars
                              ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md hover:brightness-110'
                              : 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed'
                          }`}
                        >
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{skin.priceStars} YILDIZ</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: OPPONENT PADDLES */}
          {activeTab === 'opponent' && (
            <div className="space-y-2">
              <p className="text-[11px] font-medium text-slate-400 px-1">
                Rakibinin çubuğunu değiştirerek sahayı istediğin gibi renklendir!
              </p>

              {OPPONENT_PADDLE_SKINS.map((skin) => {
                const isUnlocked = shopState.unlockedItemIds.includes(skin.id);
                const isEquipped = shopState.equippedOpponentSkinId === skin.id;

                return (
                  <div
                    key={skin.id}
                    className={`p-3 rounded-2xl border transition flex items-center justify-between gap-3 ${
                      isEquipped
                        ? 'bg-rose-950/40 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.25)]'
                        : isUnlocked
                        ? 'bg-slate-950/60 border-slate-800'
                        : 'bg-slate-950/40 border-slate-800/80 opacity-90'
                    }`}
                  >
                    {/* Visual Color Preview */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-12 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center relative overflow-hidden shadow-inner shrink-0">
                        <div
                          className="w-9 h-3.5 rounded-full shadow-md transition-all"
                          style={{
                            backgroundColor: skin.color,
                            boxShadow: `0 0 10px ${skin.glowColor}`,
                          }}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-black text-white truncate">{skin.name}</span>
                          <span className="text-xs">{skin.icon}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight">{skin.description}</p>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="shrink-0">
                      {isEquipped ? (
                        <span className="px-3 py-1.5 rounded-xl bg-rose-500/20 border border-rose-400/60 text-rose-300 font-extrabold text-[11px] flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> SEÇİLDİ
                        </span>
                      ) : isUnlocked ? (
                        <button
                          id={`equip-opp-skin-${skin.id}`}
                          onClick={() => handleBuyOpponentSkin(skin)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-[11px] border border-slate-700 transition active:scale-95"
                        >
                          SEÇ
                        </button>
                      ) : (
                        <button
                          id={`buy-opp-skin-${skin.id}`}
                          onClick={() => handleBuyOpponentSkin(skin)}
                          disabled={availableStars < skin.priceStars}
                          className={`px-3 py-1.5 rounded-xl font-black text-[11px] flex items-center gap-1 transition active:scale-95 ${
                            availableStars >= skin.priceStars
                              ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md hover:brightness-110'
                              : 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed'
                          }`}
                        >
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{skin.priceStars} YILDIZ</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: BALL SKINS */}
          {activeTab === 'ball' && (
            <div className="space-y-2">
              <p className="text-[11px] font-medium text-slate-400 px-1">
                Farklı renk ve özel ışımalı top seçenekleri. Yıldızla bir kez satın al, sahada parıldat!
              </p>

              {BALL_SKINS.map((skin) => {
                const isUnlocked = shopState.unlockedItemIds.includes(skin.id);
                const isEquipped = shopState.equippedBallSkinId === skin.id;

                return (
                  <div
                    key={skin.id}
                    className={`p-3 rounded-2xl border transition flex items-center justify-between gap-3 ${
                      isEquipped
                        ? 'bg-indigo-950/40 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.25)]'
                        : isUnlocked
                        ? 'bg-slate-950/60 border-slate-800'
                        : 'bg-slate-950/40 border-slate-800/80 opacity-90'
                    }`}
                  >
                    {/* Visual Ball Preview */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-12 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center relative overflow-hidden shadow-inner shrink-0">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black shadow-md transition-all"
                          style={{
                            background: `radial-gradient(circle at 35% 35%, #ffffff, ${skin.color} 70%, #0f172a 100%)`,
                            boxShadow: `0 0 12px ${skin.glowColor}`,
                          }}
                        >
                          {skin.icon}
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-black text-white truncate">{skin.name}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight">{skin.description}</p>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="shrink-0">
                      {isEquipped ? (
                        <span className="px-3 py-1.5 rounded-xl bg-purple-500/20 border border-purple-400/60 text-purple-300 font-extrabold text-[11px] flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> KUŞANILDI
                        </span>
                      ) : isUnlocked ? (
                        <button
                          id={`equip-ball-skin-${skin.id}`}
                          onClick={() => handleBuyBallSkin(skin)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-[11px] border border-slate-700 transition active:scale-95"
                        >
                          KUŞAN
                        </button>
                      ) : (
                        <button
                          id={`buy-ball-skin-${skin.id}`}
                          onClick={() => handleBuyBallSkin(skin)}
                          disabled={availableStars < skin.priceStars}
                          className={`px-3 py-1.5 rounded-xl font-black text-[11px] flex items-center gap-1 transition active:scale-95 ${
                            availableStars >= skin.priceStars
                              ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md hover:brightness-110'
                              : 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed'
                          }`}
                        >
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{skin.priceStars} YILDIZ</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 4: SINGLE-GAME BOOSTERS */}
          {activeTab === 'boosters' && (
            <div className="space-y-2">
              <div className="bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-2xl text-[11px] text-amber-200 leading-snug flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Tek Oyunluk Özellikler:</strong> Her satın alma sadece 1 oyunda geçerlidir. Oyuna başladığında aktif olan güçler otomatik kullanılır!
                </span>
              </div>

              {SINGLE_GAME_BOOSTERS.map((booster) => {
                const count = shopState.boosterCounts[booster.id] || 0;
                const isActiveForNext = shopState.activeMatchBoosterIds.includes(booster.id);

                return (
                  <div
                    key={booster.id}
                    className={`p-3 rounded-2xl border transition flex items-center justify-between gap-3 ${
                      isActiveForNext && count > 0
                        ? 'bg-amber-950/40 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                        : 'bg-slate-950/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-xl shrink-0 shadow-inner">
                        {booster.icon}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-white truncate">{booster.name}</span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-400 text-slate-950">
                            {booster.badgeText}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{booster.description}</p>
                        
                        {count > 0 && (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-mono text-cyan-300 font-extrabold">
                              Sahip Olunan: {count} Adet
                            </span>
                            <button
                              id={`toggle-booster-${booster.id}`}
                              onClick={() => handleToggleBooster(booster.id)}
                              className={`px-2 py-0.5 rounded-lg text-[9px] font-black border transition ${
                                isActiveForNext
                                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                                  : 'bg-slate-800 border-slate-700 text-slate-400'
                              }`}
                            >
                              {isActiveForNext ? '✓ MAÇTA AKTİF' : 'MAÇTA PASİF'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Buy Button */}
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      <button
                        id={`buy-booster-${booster.id}`}
                        onClick={() => handleBuyBooster(booster)}
                        disabled={availableStars < booster.priceStars}
                        className={`px-3 py-1.5 rounded-xl font-black text-[11px] flex items-center gap-1 transition active:scale-95 ${
                          availableStars >= booster.priceStars
                            ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-slate-950 shadow-md hover:brightness-110'
                            : 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed'
                        }`}
                      >
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>{booster.priceStars} YILDIZ</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Close */}
        <button
          id="close-shop-action-btn"
          onClick={onClose}
          className="mt-2 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs active:scale-[0.99] transition"
        >
          MAĞAZADAN ÇIK
        </button>
      </div>
    </div>
  );
};

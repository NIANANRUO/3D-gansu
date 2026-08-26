import React, { useCallback, useEffect, useRef, useState } from "react";
import { GANSU_PHOTOS, type PhotoData } from "../data/photo-manifest";
import { CinematicPhotoCard } from "./CinematicPhotoCard";
import { CinematicAudioPlayer } from "./CinematicAudioPlayer";
import { FloatingPoeticParchment } from "./FloatingPoeticParchment";

export const CinematicRingStage: React.FC = () => {
  const totalCards = GANSU_PHOTOS.length; // 18
  const angleStep = 360 / totalCards; // 20°

  // 物理摄像机 3D 空间旋转角度 (X轴俯仰 + Y轴环绕) - 默认 -1°
  const [currentAngle, setCurrentAngle] = useState(0);
  const [currentTilt, setCurrentTilt] = useState(-1);
  const targetAngleRef = useRef(0);
  const currentAngleRef = useRef(0);
  const targetTiltRef = useRef(-1);
  const currentTiltRef = useRef(-1);
  const velocityXRef = useRef(0);
  const velocityYRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);

  // 用户点击微放大凸显的卡片索引 (null 代表未放大)
  const [enlargedIndex, setEnlargedIndex] = useState<number | null>(null);

  // 摄像机镜头与场景控制 (默认：焦距 45%, 景深 20% 苍茫虚化, 俯仰 -1°)
  const [zoom, setZoom] = useState(0.45);
  const [dofIntensity, setDofIntensity] = useState(0.2);
  const [isAutoOrbit, setIsAutoOrbit] = useState(true);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const lastXRef = useRef(0);
  const lastYRef = useRef(0);
  const lastTimeRef = useRef(0);

  // 3D 几何常数与 Dolly 推进
  const radius = 760;
  const dollyZ = Math.round((zoom - 0.9) * 950 - 320);

  // 电影级重型摄影轨道 3D 双轴空间阻尼模拟
  useEffect(() => {
    let animId: number;

    const updatePhysics = () => {
      // 自动漫游巡航 (仅在未放大且未拖动时自动慢速旋转)
      if (isAutoOrbit && !isDraggingRef.current && enlargedIndex === null) {
        targetAngleRef.current += 0.045;
      }

      // Y 轴水平环绕惯性阻尼插值
      const diffX = targetAngleRef.current - currentAngleRef.current;
      currentAngleRef.current += diffX * 0.075;
      setCurrentAngle(currentAngleRef.current);

      // X 轴垂直俯仰惯性阻尼插值
      const diffY = targetTiltRef.current - currentTiltRef.current;
      currentTiltRef.current += diffY * 0.075;
      setCurrentTilt(currentTiltRef.current);

      // 计算当前正对镜头的照片序号 (0 ~ 17)
      const normAngle = ((-currentAngleRef.current % 360) + 360) % 360;
      const rawIdx = Math.round(normAngle / angleStep) % totalCards;
      setActiveIndex(rawIdx);

      animId = requestAnimationFrame(updatePhysics);
    };

    animId = requestAnimationFrame(updatePhysics);
    return () => cancelAnimationFrame(animId);
  }, [angleStep, isAutoOrbit, totalCards, enlargedIndex]);

  // 按住鼠标左键 3D 空间全方位拖动旋转手势
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest(".no-drag")) return;

    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    lastXRef.current = e.clientX;
    lastYRef.current = e.clientY;
    lastTimeRef.current = performance.now();
    velocityXRef.current = 0;
    velocityYRef.current = 0;
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const now = performance.now();
    const dt = Math.max(1, now - lastTimeRef.current);
    const dx = e.clientX - lastXRef.current;
    const dy = e.clientY - lastYRef.current;

    // 水平拖动 -> Y 轴环绕旋转
    const angleDelta = (dx / window.innerWidth) * 115;
    targetAngleRef.current += angleDelta;
    currentAngleRef.current += angleDelta * 0.45;

    // 垂直拖动 -> X 轴俯仰倾斜 (-32° ~ +22°)
    const tiltDelta = (dy / window.innerHeight) * 55;
    targetTiltRef.current = Math.min(22, Math.max(-32, targetTiltRef.current - tiltDelta));
    currentTiltRef.current = Math.min(22, Math.max(-32, currentTiltRef.current - tiltDelta * 0.45));

    velocityXRef.current = (dx / dt) * 16;
    velocityYRef.current = (dy / dt) * 8;
    lastXRef.current = e.clientX;
    lastYRef.current = e.clientY;
    lastTimeRef.current = now;
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    const dist = Math.hypot(e.clientX - startXRef.current, e.clientY - startYRef.current);
    if (dist < 6 && (e.target as HTMLElement).classList.contains("cinematic-stage-viewport")) {
      setEnlargedIndex(null);
      setShowSettingsPanel(false);
    }

    targetAngleRef.current += velocityXRef.current * 0.45;
    targetTiltRef.current = Math.min(22, Math.max(-32, targetTiltRef.current - velocityYRef.current * 0.25));
  }, []);

  // 滚轮控制
  useEffect(() => {
    let lastWheel = 0;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const now = performance.now();
      if (now - lastWheel < 30) return;
      lastWheel = now;

      if (e.ctrlKey || e.shiftKey) {
        setZoom((prev) => Math.min(1.5, Math.max(0.35, prev - e.deltaY * 0.0015)));
      } else {
        const delta = (e.deltaY || e.deltaX) * 0.085;
        targetAngleRef.current -= delta;
      }
    };

    const node = containerRef.current;
    if (node) {
      node.addEventListener("wheel", handleWheel, { passive: false });
      return () => node.removeEventListener("wheel", handleWheel);
    }
  }, []);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setEnlargedIndex(null);
        setShowDetailDrawer(false);
        setShowSettingsPanel(false);
      } else if (e.key === "ArrowLeft") {
        rotateToPrev();
      } else if (e.key === "ArrowRight") {
        rotateToNext();
      } else if (e.key === " ") {
        e.preventDefault();
        setIsAutoOrbit((prev) => !prev);
      } else if (e.key === "i" || e.key === "I") {
        setShowDetailDrawer((prev) => !prev);
      } else if (e.key === "+" || e.key === "=") {
        setZoom((prev) => Math.min(1.5, prev + 0.1));
      } else if (e.key === "-" || e.key === "_") {
        setZoom((prev) => Math.max(0.35, prev - 0.1));
      } else if (e.key === "Enter" || e.key === "f" || e.key === "F") {
        setEnlargedIndex((prev) => (prev === activeIndex ? null : activeIndex));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex]);

  // 点击卡片
  const handleCardClick = useCallback((targetIndex: number) => {
    if (enlargedIndex === targetIndex) {
      setEnlargedIndex(null);
      return;
    }

    const targetCardAngle = -targetIndex * angleStep;
    const cur = targetAngleRef.current;
    let diff = ((targetCardAngle - cur) % 360 + 540) % 360 - 180;
    targetAngleRef.current = cur + diff;
    setEnlargedIndex(targetIndex);
  }, [angleStep, enlargedIndex]);

  const rotateToPrev = useCallback(() => {
    targetAngleRef.current += angleStep;
    if (enlargedIndex !== null) {
      const nextIdx = (activeIndex - 1 + totalCards) % totalCards;
      setEnlargedIndex(nextIdx);
    }
  }, [activeIndex, angleStep, enlargedIndex, totalCards]);

  const rotateToNext = useCallback(() => {
    targetAngleRef.current -= angleStep;
    if (enlargedIndex !== null) {
      const nextIdx = (activeIndex + 1) % totalCards;
      setEnlargedIndex(nextIdx);
    }
  }, [activeIndex, angleStep, enlargedIndex, totalCards]);

  const currentPhoto: PhotoData = GANSU_PHOTOS[activeIndex] || GANSU_PHOTOS[0];
  const isCurrentEnlarged = enlargedIndex === activeIndex;

  return (
    <div
      ref={containerRef}
      className="cinematic-stage-viewport"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* 3D 摄像机与环形圆柱舞台 */}
      <div className="camera-perspective-rig">
        <div
          className="cylinder-carousel-ring"
          style={{
            transform: `translateZ(${dollyZ}px) rotateX(${currentTilt}deg) rotateY(${currentAngle}deg)`,
          }}
        >
          {GANSU_PHOTOS.map((photo, idx) => (
            <CinematicPhotoCard
              key={photo.id}
              photo={photo}
              index={idx}
              currentAngle={currentAngle}
              totalCards={totalCards}
              radius={radius}
              dofIntensity={dofIntensity}
              isEnlarged={enlargedIndex === idx}
              hasEnlargedCard={enlargedIndex !== null}
              onCardClick={handleCardClick}
            />
          ))}
        </div>
      </div>

      {/* 右侧悬浮半透明宣纸 + 逐字水墨挥毫题诗笺 */}
      {enlargedIndex !== null && (
        <FloatingPoeticParchment
          photo={currentPhoto}
          onClose={() => setEnlargedIndex(null)}
        />
      )}

      {/* 古典宋体宣纸金丝播放台 (全古风化设计) */}
      <footer className="compact-cinema-hud no-drag">
        {/* 上一景按钮 */}
        <button
          type="button"
          className="classical-nav-btn btn-prev"
          onClick={rotateToPrev}
          title="上一景 (←)"
          aria-label="上一景"
        >
          <span>〈</span>
        </button>

        {/* 当前景地金石篆刻信息 */}
        <div
          className="compact-info-center"
          onClick={() => handleCardClick(activeIndex)}
          title={isCurrentEnlarged ? "点击归卷还原" : "点击揽胜微放细赏"}
          style={{ cursor: "pointer" }}
        >
          <div className="compact-title-row">
            <span className="compact-serial">「{String(activeIndex + 1).padStart(2, "0")}」</span>
            <h2 className="compact-title">{currentPhoto.title}</h2>
            <span className="compact-coord">{currentPhoto.coordinates}</span>
          </div>
          <p className="compact-poem">“{currentPhoto.poem}”</p>
        </div>

        {/* 揽胜细赏 / 归卷还原 */}
        <button
          type="button"
          className={`classical-pill-btn btn-zoom-action${isCurrentEnlarged ? " is-enlarged-active" : ""}`}
          onClick={() => handleCardClick(activeIndex)}
          title={isCurrentEnlarged ? "点击归卷还原 (Esc)" : "点击揽胜细赏 (Enter / F)"}
        >
          <span className="classical-seal-dot">{isCurrentEnlarged ? "归" : "赏"}</span>
          <span className="btn-text-songti">{isCurrentEnlarged ? "归卷还原" : "揽胜细赏"}</span>
        </button>

        {/* 环游漫步巡航 */}
        <button
          type="button"
          className={`classical-pill-btn${isAutoOrbit && enlargedIndex === null ? " is-active" : ""}`}
          onClick={() => setIsAutoOrbit(!isAutoOrbit)}
          title="空格键切换环游漫步"
        >
          <span className="classical-seal-dot">{isAutoOrbit && enlargedIndex === null ? "游" : "歇"}</span>
          <span className="btn-text-songti">{isAutoOrbit && enlargedIndex === null ? "环游漫步" : "驻足观赏"}</span>
        </button>

        {/* 观象调景 (镜位与景深) */}
        <div className="bottom-hud-tool-anchor">
          <button
            type="button"
            className={`classical-pill-btn btn-settings-toggle${showSettingsPanel ? " is-active" : ""}`}
            onClick={() => setShowSettingsPanel(!showSettingsPanel)}
            title="调节镜头焦距、景深与俯仰视角"
          >
            <span className="classical-seal-dot">镜</span>
            <span className="btn-text-songti">视界调控</span>
          </button>

          {/* 向上展开的古典观景台调控面板 */}
          {showSettingsPanel && (
            <div className="bottom-toolbox-popup-panel no-drag">
              <div className="popup-header">
                <span className="popup-title">「 观象调景 · 视界之维 」</span>
                <button type="button" className="popup-close-btn" onClick={() => setShowSettingsPanel(false)}>✕</button>
              </div>

              {/* 1. 镜头焦距缩放 */}
              <div className="control-slider-group">
                <div className="slider-header">
                  <span className="slider-label">镜头推拉 · 空间焦距</span>
                  <span className="slider-val">{Math.round(zoom * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.35"
                  max="1.45"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="classical-range-input"
                />
                <div className="slider-quick-actions">
                  <button type="button" onClick={() => setZoom(0.45)}>远眺全景 45%</button>
                  <button type="button" onClick={() => setZoom(0.90)}>舒朗适中 90%</button>
                  <button type="button" onClick={() => setZoom(1.25)}>细品微距 125%</button>
                </div>
              </div>

              {/* 2. 景深虚实控制 */}
              <div className="control-slider-group">
                <div className="slider-header">
                  <span className="slider-label">气象景深 · 空间虚实</span>
                  <span className="slider-val">
                    {dofIntensity === 0 ? "绝对清透 (0%)" : `苍茫虚化 (${Math.round(dofIntensity * 100)}%)`}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1.0"
                  step="0.1"
                  value={dofIntensity}
                  onChange={(e) => setDofIntensity(parseFloat(e.target.value))}
                  className="classical-range-input"
                />
              </div>

              {/* 3. 俯仰视角控制 */}
              <div className="control-slider-group">
                <div className="slider-header">
                  <span className="slider-label">俯仰天际 · 视界角度</span>
                  <span className="slider-val">{Math.round(currentTilt)}°</span>
                </div>
                <input
                  type="range"
                  min="-30"
                  max="20"
                  step="1"
                  value={Math.round(currentTilt)}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    targetTiltRef.current = val;
                    currentTiltRef.current = val;
                    setCurrentTilt(val);
                  }}
                  className="classical-range-input"
                />
              </div>

              <div className="toolbox-shortcuts-hint">
                <span>按住鼠标左键可全向 3D 旋转，按 Esc 键归卷还原</span>
              </div>
            </div>
          )}
        </div>

        {/* 古典苍茫配乐播放器 */}
        <CinematicAudioPlayer />

        {/* 典籍胜迹志 */}
        <button
          type="button"
          className={`classical-pill-btn btn-detail${showDetailDrawer ? " is-active" : ""}`}
          onClick={() => setShowDetailDrawer(!showDetailDrawer)}
          title="查看该胜迹历史与地理详注 (快捷键 I)"
        >
          <span className="classical-seal-dot">志</span>
          <span className="btn-text-songti">{showDetailDrawer ? "收卷隐志" : "胜迹详志"}</span>
        </button>

        {/* 下一景按钮 */}
        <button
          type="button"
          className="classical-nav-btn btn-next"
          onClick={rotateToNext}
          title="下一景 (→)"
          aria-label="下一景"
        >
          <span>〉</span>
        </button>
      </footer>

      {/* 典籍详注抽屉 (线装书古典宣纸形制) */}
      {showDetailDrawer && (
        <div className="archival-detail-drawer no-drag">
          <div className="drawer-header">
            <div className="drawer-title-box">
              <h3>《陇上名胜 · {currentPhoto.title}》</h3>
              <span className="drawer-dynasty">〔{currentPhoto.dynasty} · {currentPhoto.coordinates}〕</span>
            </div>
            <button
              type="button"
              className="drawer-close-btn"
              onClick={() => setShowDetailDrawer(false)}
            >
              ✕
            </button>
          </div>

          <p className="drawer-poem">“{currentPhoto.poem}”</p>
          <p className="drawer-desc">{currentPhoto.description}</p>
          <p className="drawer-location">【 地理坐标 】{currentPhoto.location}</p>

          <div className="drawer-seal-stamp">
            <span>{currentPhoto.seal}</span>
          </div>
        </div>
      )}
    </div>
  );
};

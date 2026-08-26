import React, { useMemo } from "react";
import type { PhotoData } from "../data/photo-manifest";

interface Props {
  photo: PhotoData;
  index: number;
  currentAngle: number;
  totalCards: number;
  radius: number;
  dofIntensity: number;
  isEnlarged: boolean; // 用户点击后的专属 3D 微放大偏左凸显状态
  hasEnlargedCard: boolean; // 是否当前有任意卡片被放大
  onCardClick: (index: number) => void;
}

export const CinematicPhotoCard: React.FC<Props> = ({
  photo,
  index,
  currentAngle,
  totalCards,
  radius,
  dofIntensity,
  isEnlarged,
  hasEnlargedCard,
  onCardClick,
}) => {
  const cardAngle = (index * 360) / totalCards;

  const relativeAngle = useMemo(() => {
    let rel = ((cardAngle + currentAngle) % 360 + 360) % 360;
    if (rel > 180) rel -= 360;
    return rel;
  }, [cardAngle, currentAngle]);

  const rad = (relativeAngle * Math.PI) / 180;
  const cosVal = Math.cos(rad);

  const isFocused = Math.abs(relativeAngle) < 11;

  // 景深与亮度计算
  let depthBlur = isFocused ? 0 : Math.max(0, (1 - cosVal) * 3.2 * dofIntensity);
  let brightness = isFocused ? 1.05 : 0.6 + 0.4 * Math.max(0, cosVal);
  let saturate = isFocused ? 1.08 : 0.8 + 0.2 * Math.max(0, cosVal);
  let opacity = 0.45 + 0.55 * Math.max(0, (cosVal + 0.2) / 1.2);
  let zIndex = Math.round((cosVal + 1) * 100);

  // 3D 原生向左偏置与浮凸微放大
  let scaleTransform = "";
  if (isEnlarged) {
    zIndex = 999;
    opacity = 1.0;
    brightness = 1.1;
    saturate = 1.12;
    depthBlur = 0;
    // 向左位移 180px，向前浮凸 85px，等比缩放 1.16x，为右侧浮动宣纸留出开阔空间
    scaleTransform = " translateX(-180px) translateZ(85px) scale(1.16)";
  } else if (hasEnlargedCard) {
    // 放大状态下，其余 17 张侧翼卡片幽暗隐退为大漠远景
    opacity = 0.12;
    brightness = 0.32;
    saturate = 0.45;
    depthBlur = Math.max(1.5, depthBlur);
  } else if (isFocused) {
    scaleTransform = " translateZ(35px) scale(1.05)";
  }

  const cardStyle: React.CSSProperties = {
    transform: `rotateY(${cardAngle}deg) translateZ(${radius}px)${scaleTransform}`,
    zIndex,
    filter: depthBlur > 0.1 ? `blur(${depthBlur.toFixed(1)}px) brightness(${brightness.toFixed(2)}) saturate(${saturate.toFixed(2)})` : `brightness(${brightness.toFixed(2)}) saturate(${saturate.toFixed(2)})`,
    opacity,
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCardClick(index);
  };

  return (
    <div
      className={`cinematic-card-slot${isFocused ? " is-focused" : ""}${isEnlarged ? " is-hero-enlarged" : ""}`}
      style={cardStyle}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`${photo.title} · 点击左移细赏并展开题诗`}
    >
      {/* 典藏画框主体 */}
      <div className="archival-museum-frame">
        {/* 铜蚀角花 */}
        <div className="frame-corner corner-tl" />
        <div className="frame-corner corner-tr" />
        <div className="frame-corner corner-bl" />
        <div className="frame-corner corner-br" />

        {/* 摄影高清照片 */}
        <div className="card-photo-wrapper">
          <img
            src={photo.image}
            alt={photo.title}
            loading={index < 6 ? "eager" : "lazy"}
            draggable={false}
          />
          {/* 照片表层极微弱胶片高光 */}
          <div className="photo-film-glare" />
        </div>

        {/* 卡片下边缘典藏铭牌 */}
        <div className="card-mini-plaque">
          <span className="card-serial">{String(photo.index).padStart(2, "0")}</span>
          <span className="card-name">{photo.title.split("·")[1]?.trim() || photo.title}</span>
          <span className="card-seal-mini">{photo.seal}</span>
        </div>
      </div>
    </div>
  );
};

export function CinematicLighting() {
  return (
    <div className="cinematic-lighting-rig" aria-hidden="true">
      {/* 顶部主聚光灯光束 */}
      <div className="spotlight-cone" />
      <div className="spotlight-glow" />

      {/* 戏剧性电影上下遮幅（Letterbox） */}
      <div className="cinema-mask-top" />
      <div className="cinema-mask-bottom" />

      {/* 地面黑曜石镜面反射反射带 */}
      <div className="obsidian-floor-reflection" />
    </div>
  );
}

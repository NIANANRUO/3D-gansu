import { SilkRoadLivingCanvas } from "./components/SilkRoadLivingCanvas";
import { CinematicLighting } from "./components/CinematicLighting";
import { CinematicRingStage } from "./components/CinematicRingStage";
import "./cinematic-carousel.css";

export default function App() {
  return (
    <main className="cinematic-main-room">
      {/* 1. WebGL 活化丝路大漠背景 */}
      <SilkRoadLivingCanvas />

      {/* 2. 电影级聚光灯、暗角与黑曜石倒影层 */}
      <CinematicLighting />

      {/* 3. 顶部电影片头 (干净清爽，无任何悬浮重叠按钮) */}
      <header className="cinematic-header">
        <div className="header-left">
          <span className="cinema-kicker">GANSU CINEMATIC 3D PANORAMA</span>
          <h1 className="cinema-title">陇上行 · 3D 环形全景长卷</h1>
        </div>

        <div className="header-right">
          <span className="cinema-badge">18 景空间环游</span>
        </div>
      </header>

      {/* 4. 3D 圆柱旋转木马核心舞台 (所有控制统一集成于底部控制台) */}
      <CinematicRingStage />
    </main>
  );
}

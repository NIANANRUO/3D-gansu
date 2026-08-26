import { useEffect, useRef, useState } from "react";

export function CinematicAudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.45);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const isRunningRef = useRef(false);
  const phraseTimerRef = useRef<number | null>(null);
  const phraseIndexRef = useRef(0);

  // 经典丝路五声羽调式古琴/琵琶抒情旋律乐句 (Lyrical Classical Pentatonic Phrases: D, F, G, A, C)
  // 采用《阳关三叠》《陇上长歌》古韵音阶与乐句组织
  const MELODIC_PHRASES = [
    // 乐句 1：大漠初行 (起)
    [
      { freq: 220.0, dur: 0.8, rest: 0.3 }, // A3
      { freq: 261.63, dur: 0.6, rest: 0.2 }, // C4
      { freq: 293.66, dur: 1.4, rest: 0.6 }, // D4
      { freq: 349.23, dur: 0.9, rest: 0.3 }, // F4
      { freq: 293.66, dur: 2.2, rest: 1.2 }, // D4
    ],
    // 乐句 2：雄关远眺 (承)
    [
      { freq: 392.0, dur: 0.7, rest: 0.2 }, // G4
      { freq: 440.0, dur: 0.8, rest: 0.2 }, // A4
      { freq: 523.25, dur: 1.2, rest: 0.4 }, // C5
      { freq: 440.0, dur: 0.7, rest: 0.2 }, // A4
      { freq: 392.0, dur: 0.8, rest: 0.2 }, // G4
      { freq: 293.66, dur: 2.6, rest: 1.5 }, // D4
    ],
    // 乐句 3：古刹梵音 (转)
    [
      { freq: 174.61, dur: 1.0, rest: 0.4 }, // F3
      { freq: 220.0, dur: 0.9, rest: 0.3 }, // A3
      { freq: 261.63, dur: 0.7, rest: 0.2 }, // C4
      { freq: 220.0, dur: 0.6, rest: 0.2 }, // A3
      { freq: 196.0, dur: 1.1, rest: 0.4 }, // G3
      { freq: 146.83, dur: 3.0, rest: 1.8 }, // D3
    ],
    // 乐句 4：万马奔腾与大漠斜阳 (合)
    [
      { freq: 293.66, dur: 0.5, rest: 0.15 }, // D4
      { freq: 349.23, dur: 0.5, rest: 0.15 }, // F4
      { freq: 392.0, dur: 0.6, rest: 0.2 },  // G4
      { freq: 440.0, dur: 1.2, rest: 0.5 },  // A4
      { freq: 349.23, dur: 0.8, rest: 0.3 },  // F4
      { freq: 293.66, dur: 0.7, rest: 0.2 },  // D4
      { freq: 220.0, dur: 3.2, rest: 2.2 },  // A3
    ],
  ];

  const startAudioEngine = () => {
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
      setIsPlaying(true);
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const masterGain = ctx.createGain();
      masterGain.gain.value = volume;
      masterGain.connect(ctx.destination);
      gainNodeRef.current = masterGain;

      isRunningRef.current = true;
      setIsPlaying(true);

      // 1. 柔和温暖的大漠旷野微风
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const windFilter = ctx.createBiquadFilter();
      windFilter.type = "lowpass";
      windFilter.frequency.value = 240;
      windFilter.Q.value = 1.8;

      const windGain = ctx.createGain();
      windGain.gain.value = 0.08;

      whiteNoise.connect(windFilter);
      windFilter.connect(windGain);
      windGain.connect(masterGain);
      whiteNoise.start();

      // 2. 苍茫沉静的古琴低音持续音 (D2 73.4Hz)
      const droneOsc1 = ctx.createOscillator();
      droneOsc1.type = "sine";
      droneOsc1.frequency.value = 73.42;

      const droneGain1 = ctx.createGain();
      droneGain1.gain.value = 0.09;

      droneOsc1.connect(droneGain1);
      droneGain1.connect(masterGain);
      droneOsc1.start();

      // 3. 弹奏古琴/琵琶单音
      const playNote = (freq: number, duration: number) => {
        if (!isRunningRef.current || !audioCtxRef.current) return;
        const now = ctx.currentTime;

        const osc1 = ctx.createOscillator();
        osc1.type = "triangle";
        osc1.frequency.setValueAtTime(freq, now);

        const osc2 = ctx.createOscillator();
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(freq * 2, now);

        const osc3 = ctx.createOscillator();
        osc3.type = "sine";
        osc3.frequency.setValueAtTime(freq * 3, now);

        const noteGain = ctx.createGain();
        noteGain.gain.setValueAtTime(0, now);
        noteGain.gain.linearRampToValueAtTime(0.22, now + 0.025);
        noteGain.gain.exponentialRampToValueAtTime(0.06, now + 0.35);
        noteGain.gain.exponentialRampToValueAtTime(0.0008, now + duration + 1.8);

        osc1.connect(noteGain);
        osc2.connect(noteGain);
        osc3.connect(noteGain);
        noteGain.connect(masterGain);

        osc1.start(now);
        osc2.start(now);
        osc3.start(now);
        osc1.stop(now + duration + 2.0);
        osc2.stop(now + duration + 2.0);
        osc3.stop(now + duration + 2.0);
      };

      // 4. 连续优雅的乐句旋律轮播系统
      const playPhrase = () => {
        if (!isRunningRef.current || !audioCtxRef.current) return;

        const currentPhrase = MELODIC_PHRASES[phraseIndexRef.current];
        phraseIndexRef.current = (phraseIndexRef.current + 1) % MELODIC_PHRASES.length;

        let accumulatedTime = 0;
        for (const note of currentPhrase) {
          setTimeout(() => {
            if (isRunningRef.current) {
              playNote(note.freq, note.dur);
            }
          }, accumulatedTime);
          accumulatedTime += (note.dur + note.rest) * 1000;
        }

        const phraseTotalTime = accumulatedTime + 3000;
        phraseTimerRef.current = window.setTimeout(playPhrase, phraseTotalTime);
      };

      playPhrase();
    } catch (e) {
      console.warn("Audio Context init error:", e);
    }
  };

  const toggleAudio = () => {
    if (!audioCtxRef.current) {
      startAudioEngine();
      return;
    }

    if (audioCtxRef.current.state === "running") {
      audioCtxRef.current.suspend();
      setIsPlaying(false);
    } else {
      audioCtxRef.current.resume();
      setIsPlaying(true);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setTargetAtTime(newVol, audioCtxRef.current.currentTime, 0.1);
    }
  };

  useEffect(() => {
    return () => {
      isRunningRef.current = false;
      if (phraseTimerRef.current) clearTimeout(phraseTimerRef.current);
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  return (
    <div className="bottom-hud-audio-box no-drag">
      <button
        type="button"
        className={`classical-pill-btn btn-audio-toggle${isPlaying ? " is-active" : ""}`}
        onClick={toggleAudio}
        title={isPlaying ? "点击静音古典背景配乐" : "点击开启《阳关长歌》古琴琵琶苍茫配乐"}
        aria-label="切换古典配乐"
      >
        <span className="classical-seal-dot">{isPlaying ? "琴" : "默"}</span>
        <span className="btn-text-songti">{isPlaying ? "陇上长歌" : "古韵配乐"}</span>
        {isPlaying && (
          <span className="classical-audio-threads">
            <span className="thread t-1" />
            <span className="thread t-2" />
            <span className="thread t-3" />
          </span>
        )}
      </button>

      {isPlaying && (
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
          className="classical-volume-slider"
          title={`音量: ${Math.round(volume * 100)}%`}
        />
      )}
    </div>
  );
}

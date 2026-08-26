import React, { useEffect, useState } from "react";
import type { PhotoData } from "../data/photo-manifest";

interface Props {
  photo: PhotoData | null;
  onClose: () => void;
}

export const FloatingPoeticParchment: React.FC<Props> = ({ photo, onClose }) => {
  const [writtenCharCount, setWrittenCharCount] = useState(0);

  // 拆分诗句为上联（右列）与下联（左列）
  const rawLines = photo?.poem.split(/[,，]/).filter(Boolean) || [];
  const line1 = (rawLines[0] || "").trim();
  const line2 = (rawLines[1] || "").trim();
  const totalChars = line1.length + line2.length;

  useEffect(() => {
    if (!photo) {
      setWrittenCharCount(0);
      return;
    }

    setWrittenCharCount(0);
    let count = 0;

    // 优美流畅的书法挥毫节奏（每字 220ms，右列写完紧接着写左列，整体约 3 秒气韵贯通）
    const timer = setInterval(() => {
      count++;
      setWrittenCharCount(count);
      if (count >= totalChars) {
        clearInterval(timer);
      }
    }, 220);

    return () => clearInterval(timer);
  }, [photo, totalChars]);

  if (!photo) return null;

  // 上联已写出的字数与字符
  const line1VisibleCount = Math.min(writtenCharCount, line1.length);
  const line1Chars = line1.slice(0, line1VisibleCount).split("");

  // 下联已写出的字数与字符
  const line2VisibleCount = Math.max(0, writtenCharCount - line1.length);
  const line2Chars = line2.slice(0, line2VisibleCount).split("");

  return (
    <div
      className="pure-vertical-poetry-canvas no-drag"
      onClick={onClose}
      title="点击任意处归卷还原"
      role="region"
      aria-label="竖排书法题诗"
    >
      <div className="vertical-poetry-columns">
        {/* 第一列（右列·上联，如：斑斓流转如虹练） */}
        <div className="poetry-vertical-column col-first">
          {line1Chars.map((char, idx) => {
            const isLatestWriting = idx === line1Chars.length - 1 && writtenCharCount <= line1.length;
            return (
              <span
                key={`l1-${idx}`}
                className={`vertical-calligraphy-char${isLatestWriting ? " is-writing" : ""}`}
              >
                {char}
              </span>
            );
          })}
        </div>

        {/* 第二列（左列·下联，如：千里丹霞落九天） */}
        {line2VisibleCount > 0 && (
          <div className="poetry-vertical-column col-second">
            {line2Chars.map((char, idx) => {
              const isLatestWriting = idx === line2Chars.length - 1 && writtenCharCount > line1.length;
              return (
                <span
                  key={`l2-${idx}`}
                  className={`vertical-calligraphy-char${isLatestWriting ? " is-writing" : ""}`}
                >
                  {char}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

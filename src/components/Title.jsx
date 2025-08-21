import React, { useEffect, useRef } from "react";
import gsap from "gsap";

const ScrambleText = ({ title = "Chat", duration = 1.6, loop = false, className = "text-6xl font-bold", style = {} }) => {
  const elRef = useRef(null);
  const tweenRef = useRef(null);

  // Charset used for scrambling characters
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{};:,.<>/?";

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    // Proxy object to animate progress from 0 -> 1
    const proxy = { p: 0 };

    function randomChar() {
      return charset.charAt(Math.floor(Math.random() * charset.length));
    }

    function updateText(p) {
      const full = String(title || "");
      const len = full.length;
      const revealCount = Math.round(p * len);
      let out = "";
      for (let i = 0; i < len; i++) {
        if (i < revealCount) out += full[i];
        else out += randomChar();
      }
      // write directly to DOM for high-frequency updates
      el.textContent = out;
    }

    // initial render with all scrambled characters
    updateText(0);

    // kill any previous tween
    if (tweenRef.current) {
      try { tweenRef.current.kill(); } catch (e) {}
      tweenRef.current = null;
    }

    // Create tween
    tweenRef.current = gsap.to(proxy, {
      p: 1,
      duration: Number(duration) || 1.6,
      ease: "power2.out",
      repeat: loop ? -1 : 0,
      yoyo: !!loop,
      onUpdate() {
        updateText(proxy.p);
      },
      onComplete() {
        // ensure final exact title text
        try { el.textContent = title; } catch (e) {}
      }
    });

    return () => {
      if (tweenRef.current) {
        try { tweenRef.current.kill(); } catch (e) {}
        tweenRef.current = null;
      }
    };
  }, [title, duration, loop]);

  return (
    <h1
      ref={elRef}
      className={className}
      style={{ fontFamily: '"Qwitcher Grypen", "Brush Script MT", cursive', ...style }}
    >
      {title}
    </h1>
  );
};

export default ScrambleText;

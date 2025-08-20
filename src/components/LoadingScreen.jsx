import React, { useEffect, useRef } from "react";
import gsap from "gsap";

const LoadingScreen = ({ title = "Chat" }) => {
  const dotsRef = useRef([]);
  const headingRef = useRef(null);

  useEffect(() => {
    // animate heading subtle float
    const hTween = gsap.fromTo(
      headingRef.current,
      { y: -8, opacity: 0 },
      { y: 0, opacity: 100, duration: 0.6, ease: "power2.out", repeat: -1, yoyo: true, repeatDelay: 0.6 }
    );

    // animate dots with staggered pulse
    const dots = dotsRef.current.filter(Boolean);
    const dTween = gsap.timeline({ repeat: -1 });
    dTween.to(dots, {
      opacity: 100,
      y: -4,
      duration: 0.35,
      stagger: 0.12,
      ease: "power1.out",
      yoyo: true,
      repeat: 1,
    });

    return () => {
      hTween.kill();
      dTween.kill();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/90">
      <div className="text-center select-none">
        <h1
          ref={headingRef}
          className="text-4xl md:text-5xl font-bold text-white mb-3"
          aria-live="polite"
        >
          {title}
        </h1>
        <div className="flex items-center justify-center space-x-2 mt-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              ref={(el) => (dotsRef.current[i] = el)}
              className="w-3 h-3 bg-white/80 rounded-full opacity-30"
              style={{ display: "inline-block" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;

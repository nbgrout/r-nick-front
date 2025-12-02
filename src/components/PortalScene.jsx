// PortalMan.jsx
import React, { useEffect } from "react";
import { motion, useAnimation } from "framer-motion";
import portalImg from "../assets/Portal.png";
import manImg from "../assets/man.png";

export default function PortalMan({
  // optional props to tweak quickly
  leftOffset = 40,       // px to shift whole block right (so its left aligns with your other column)
  wrapperSize = 300,     // px (portal circle size)
  manWidth = 220,        // px (width of man image)
  spinDuration = 6       // seconds for one full rotation
}) {
  const controls = useAnimation();

  useEffect(() => {
    // continuous rotation
    controls.start({
      rotate: 360,
      transition: {
        rotate: {
          repeat: Infinity,
          ease: "linear",
          duration: spinDuration,
        },
      },
    });
  }, [controls, spinDuration]);

  // exact pixel sizes (avoid percentage rounding/centering problems)
  const bigSize = wrapperSize; // 300
  const mediumSize = Math.round(wrapperSize / 13 * 1.1); // ~1/13 * 1.1
  const tinySize = Math.max(1, Math.round(wrapperSize * 0.0846 * 0.0846)); // avoid zero

  // helper to compute top/left so each image is centered within wrapper
  const centerPos = (size) => {
    const offset = Math.round((wrapperSize - size) / 2);
    return { top: `${offset}px`, left: `${offset}px` };
  };

  return (
    <div
      style={{
        width: "100%",
        background: "white",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        marginLeft: `${leftOffset}px`,
        paddingTop: "10px",
        paddingBottom: "10px",
      }}
    >
      {/* Portal wrapper (fixed pixel size) */}
      <div
        style={{
          position: "relative",
          width: `${wrapperSize}px`,
          height: `${wrapperSize}px`,
          flex: "0 0 auto",
        }}
        aria-hidden
      >
        {/* smallest first (drawn underneath) */}
        <motion.img
          src={portalImg}
          alt="portal-tiny"
          animate={controls}
          style={{
            position: "absolute",
            width: `${tinySize}px`,
            height: `${tinySize}px`,
            objectFit: "contain",
            ...centerPos(tinySize),
            transformOrigin: "50% 50%",
            zIndex: 5,
            pointerEvents: "none",
          }}
        />

        {/* medium */}
        <motion.img
          src={portalImg}
          alt="portal-medium"
          animate={controls}
          style={{
            position: "absolute",
            width: `${mediumSize}px`,
            height: `${mediumSize}px`,
            objectFit: "contain",
            ...centerPos(mediumSize),
            transformOrigin: "50% 50%",
            zIndex: 10,
            pointerEvents: "none",
          }}
        />

        {/* large (drawn last so it visually sits on top) */}
        <motion.img
          src={portalImg}
          alt="portal-large"
          animate={controls}
          style={{
            position: "absolute",
            width: `${bigSize}px`,
            height: `${bigSize}px`,
            objectFit: "contain",
            ...centerPos(bigSize),
            transformOrigin: "50% 50%",
            zIndex: 20,
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Man on the right, no bending */}
      <img
        src={manImg}
        alt="man"
        style={{
          width: `${manWidth}px`,
          height: "auto",
          objectFit: "contain",
          display: "block",
          // small negative margin if you want him "almost touching" the portal:
          marginLeft: "-18px",
          zIndex: 30,
        }}
      />
    </div>
  );
}
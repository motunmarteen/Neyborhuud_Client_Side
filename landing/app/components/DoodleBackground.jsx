"use client";

import React from 'react';
import { 
  MapPin, ShieldCheck, Home, Camera, Users, Megaphone, 
  Bell, Flag, Wifi, MessageSquare, TreePine, Smartphone, 
  Wrench, Bike, Mail, Star, Lock 
} from "lucide-react";

export function DoodleBackground() {
  const iconProps = {
    color: "var(--doodle-stroke)",
    strokeWidth: 1.5,
    size: 32,
  };

  const textProps = {
    fill: "var(--doodle-fill)",
    fontFamily: "Plus Jakarta Sans, sans-serif",
    fontWeight: 800,
    fontSize: "18px",
    opacity: 0.8
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -2, /* Behind blobs (-1) */
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="neyborhuud-doodle" x="0" y="0" width="400" height="300" patternUnits="userSpaceOnUse">
            <g opacity="0.8" transform="scale(0.5)">
              {/* Top Section */}
              <TreePine {...iconProps} x="40" y="50" transform="rotate(-15 56 66)" />
              <Smartphone {...iconProps} x="140" y="30" transform="rotate(10 156 46)" />
              <Wrench {...iconProps} x="240" y="40" transform="rotate(-20 256 56)" />
              <Bike {...iconProps} x="380" y="60" />
              <Mail {...iconProps} x="500" y="40" transform="rotate(15 516 56)" />
              <Star {...iconProps} x="620" y="50" transform="rotate(-10 636 66)" />
              <Lock {...iconProps} x="720" y="30" />

              {/* Text: Help & Help Pulse */}
              <text {...textProps} x="320" y="100" transform="rotate(-5 320 100)">Help</text>
              <path d="M 320 80 L 330 80 L 340 60 L 350 100 L 360 80 L 370 80" stroke="var(--doodle-stroke)" strokeWidth="2" fill="none" />
              
              <text {...textProps} x="700" y="120">Help</text>
              <path d="M 700 100 L 710 100 L 720 80 L 730 120 L 740 100 L 750 100" stroke="var(--doodle-stroke)" strokeWidth="2" fill="none" />

              {/* Text: Trust */}
              <text {...textProps} x="500" y="150" transform="rotate(5 500 150)">Trust</text>

              {/* Middle Section */}
              <MessageSquare {...iconProps} x="60" y="180" transform="rotate(-10 76 196)" />
              <Flag {...iconProps} x="200" y="160" transform="rotate(15 216 176)" />
              <Home {...iconProps} x="400" y="180" />
              <ShieldCheck {...iconProps} x="600" y="160" transform="rotate(-5 616 176)" />
              <MessageSquare {...iconProps} x="720" y="200" transform="rotate(10 736 216)" />
              
              {/* Map Pin / Location */}
              <MapPin {...iconProps} x="480" y="220" />
              
              {/* Text: Market & Wifi */}
              <text {...textProps} x="280" y="280" transform="rotate(-15 280 280)">Market</text>
              <Wifi {...iconProps} x="290" y="230" />

              {/* Text: NeyburH */}
              <text {...textProps} x="580" y="300" transform="rotate(10 580 300)">NeyburH</text>
              <circle cx="670" cy="285" r="3" fill="var(--doodle-fill)" />
              
              <text {...textProps} x="80" y="320" transform="rotate(-5 80 320)">NeyburH</text>
              <circle cx="165" cy="315" r="3" fill="var(--doodle-fill)" />

              {/* Bottom Middle Section */}
              <Megaphone {...iconProps} x="120" y="360" transform="rotate(20 136 376)" />
              <text {...textProps} x="220" y="380" fontSize="24px">₦</text>
              <Bell {...iconProps} x="340" y="350" transform="rotate(-15 356 366)" />
              
              <Camera {...iconProps} x="450" y="380" transform="rotate(5 466 396)" />
              <Users {...iconProps} x="560" y="340" />
              <Megaphone {...iconProps} x="680" y="380" transform="rotate(-20 696 396)" />

              {/* Text: Safety */}
              <text {...textProps} x="280" y="440" transform="rotate(5 280 440)">Safety</text>
              <text {...textProps} x="740" y="460" transform="rotate(-10 740 460)">Safety</text>

              {/* Text: Local */}
              <text {...textProps} x="400" y="520" transform="rotate(-5 400 520)">Local</text>

              {/* Text: Report */}
              <text {...textProps} x="140" y="540" transform="rotate(10 140 540)">Report</text>
              <text {...textProps} x="540" y="520" transform="rotate(-15 540 520)">Report</text>
              
              {/* Extra Fillers */}
              <text {...textProps} x="640" y="540" fontSize="24px">₦</text>
              <Bell {...iconProps} x="50" y="480" transform="rotate(20 66 496)" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#neyborhuud-doodle)" />
      </svg>
    </div>
  );
}

import React from 'react';

export const YouthUnionLogo: React.FC<{ className?: string; size?: number }> = ({ 
  className = "w-10 h-10", 
  size 
}) => {
  return (
    <div 
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={size ? { width: size, height: size } : undefined}
      title="Huy hiệu Đoàn Thanh niên Cộng sản Hồ Chí Minh"
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm select-none"
      >
        {/* Outer green circle */}
        <circle cx="50" cy="50" r="48" fill="#008837" stroke="#FFCC00" strokeWidth="2.5" />
        
        {/* Inner white background ring */}
        <circle cx="50" cy="50" r="42" fill="#FFFFFF" />

        {/* Decorative inner pattern */}
        <circle cx="50" cy="50" r="39" fill="#009639" />

        {/* Red Flag */}
        <path
          d="M32 24 C 42 21, 55 28, 68 22 C 76 18, 82 25, 78 40 C 70 45, 58 38, 48 42 L 34 44 Z"
          fill="#DA251D"
        />

        {/* Yellow Star on Red Flag */}
        <polygon
          points="54,27 56,32 61,32 57,35 59,40 54,37 50,40 52,35 48,32 53,32"
          fill="#FFFF00"
        />

        {/* Hand holding the flag pole */}
        <path
          d="M 28 66 L 36 34 L 40 35 L 34 68 Z"
          fill="#D97706"
        />
        {/* Powerful Arm grasping forward */}
        <path
          d="M 20 72 C 24 64, 30 60, 42 58 C 45 61, 46 66, 42 70 C 34 74, 26 78, 20 72 Z"
          fill="#FDE68A"
          stroke="#B45309"
          strokeWidth="1.2"
        />

        {/* Banner with SẴN SÀNG */}
        <path
          d="M 18 78 Q 50 88 82 78 L 84 86 Q 50 96 16 86 Z"
          fill="#DA251D"
          stroke="#FFCC00"
          strokeWidth="1"
        />
        <text
          x="50"
          y="85"
          fill="#FFFF00"
          fontSize="7.5"
          fontWeight="bold"
          textAnchor="middle"
          letterSpacing="1"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          SẴN SÀNG
        </text>
      </svg>
    </div>
  );
};

export const KGCLogoBadge: React.FC<{ className?: string }> = ({ className = "h-8" }) => {
  return (
    <div className={`inline-flex items-center gap-2 font-bold tracking-tight text-blue-900 ${className}`}>
      <div className="w-8 h-8 rounded-lg bg-blue-900 text-amber-400 flex items-center justify-center font-extrabold text-xs shadow-sm">
        KGC
      </div>
      <div className="flex flex-col leading-none text-left">
        <span className="text-[11px] font-extrabold tracking-wider text-blue-950 uppercase">ĐOÀN KHOA CƠ KHÍ</span>
        <span className="text-[9px] font-semibold text-slate-500">CĐ Kiên Giang</span>
      </div>
    </div>
  );
};

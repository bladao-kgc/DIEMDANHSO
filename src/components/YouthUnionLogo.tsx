import React from 'react';

export const YouthUnionLogo: React.FC<{ className?: string; size?: number }> = ({ 
  className = "w-10 h-10", 
  size 
}) => {
  return (
    <div 
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={size ? { width: size, height: size } : undefined}
      title="Huy hiệu Đoàn Thanh niên Cộng sản Hồ Chí Minh chính thức"
    >
      <img
        src="/assets/aistudio/Logo-Doan-Thanh-NIen-Cong-San-Ho-Chi-Minh-1_5ec938fa.webp"
        alt="Logo Đoàn TNCS Hồ Chí Minh"
        className="w-full h-full object-contain drop-shadow-sm select-none"
        referrerPolicy="no-referrer"
      />
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

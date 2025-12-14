import React, { useEffect, useRef } from 'react';
import { Toast } from '@/types';
import { gsap } from 'gsap';
import { Check, Info, AlertTriangle, X } from 'lucide-react';

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed top-24 right-8 z-[100] flex flex-col gap-4 pointer-events-none">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: Toast, onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!elRef.current) return;

    const ctx = gsap.context(() => {
      // Slide in
      gsap.fromTo(elRef.current,
        { x: 50, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.4, ease: 'power3.out' }
      );
    }, elRef);

    // Auto dismiss
    const timer = setTimeout(() => {
      dismiss();
    }, 4000);

    return () => {
      clearTimeout(timer);
      ctx.revert();
    };
  }, []);

  const dismiss = () => {
    if (!elRef.current) return;

    gsap.to(elRef.current, {
      x: 20,
      opacity: 0,
      duration: 0.3,
      onComplete: () => onRemove(toast.id)
    });
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'SUCCESS': return <Check size={16} className="text-accent-phosphor" />;
      case 'WARNING': return <AlertTriangle size={16} className="text-accent-orange" />;
      default: return <Info size={16} className="text-accent-cyan" />;
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case 'SUCCESS': return 'border-accent-phosphor/50';
      case 'WARNING': return 'border-accent-orange/50';
      default: return 'border-accent-cyan/50';
    }
  };

  return (
    <div
      ref={elRef}
      className={`pointer-events-auto min-w-[300px] bg-space-navy/90 backdrop-blur-md border ${getBorderColor()} p-4 rounded shadow-2xl flex items-center gap-3 relative overflow-hidden`}
    >
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
      <div className="p-2 bg-space-black rounded-full border border-ui-border">
        {getIcon()}
      </div>
      <div className="flex-1">
        <div className="font-mono text-xs font-bold text-white tracking-wide uppercase mb-0.5">{toast.type}</div>
        <div className="font-mono text-[10px] text-ui-dim">{toast.message}</div>
      </div>
      <button onClick={dismiss} className="text-ui-dim hover:text-white transition-colors">
        <X size={14} />
      </button>
    </div>
  );
};
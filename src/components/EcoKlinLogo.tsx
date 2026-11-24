import { useState } from 'react';
import { Leaf } from 'lucide-react';

interface EcoKlinLogoProps {
  size?: 'sm' | 'md' | 'lg';
}

export function EcoKlinLogo({ size = 'md' }: EcoKlinLogoProps) {
  const [failed, setFailed] = useState(false);

  const dim =
    size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-12 h-12' : 'w-9 h-9';

  if (failed) {
    return (
      <div
        className={`${dim} rounded-full bg-white text-[#1E7332] flex items-center justify-center shrink-0 border border-[#8CC63F]/60`}
        aria-label="EcoKlin"
      >
        <Leaf className="w-5 h-5" />
      </div>
    );
  }

  return (
    <div
      className={`${dim} rounded-full overflow-hidden bg-white shrink-0 ring-1 ring-white/25`}
    >
      <img
        src="/assets/aistudio/images__6__e963f284.jpg"
        alt="Logo de EcoKlin"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className="w-full h-full object-cover scale-[1.08]"
      />
    </div>
  );
}

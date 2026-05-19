import { cn } from '@/lib/utils';

interface Props {
  count: number;
  max?: number;
}

export function ShidoCards({ count, max = 3 }: Props) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'w-5 h-7 md:w-6 md:h-8 rounded-sm border border-black/20 transition-all',
            i < count ? 'bg-shido shadow-md' : 'bg-transparent border-dashed opacity-30',
          )}
          aria-label={`Shido ${i + 1}${i < count ? ' active' : ''}`}
        />
      ))}
    </div>
  );
}

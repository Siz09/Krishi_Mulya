export default function Loading() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8 animate-pulse">
      {/* Title Skeleton */}
      <div className="h-10 w-2/3 sm:w-1/2 bg-leaf-100/40 rounded-xl" />

      {/* Notice Skeleton */}
      <div className="h-12 w-full bg-soil-50/50 border border-leaf-100/30 rounded-xl" />

      {/* Control Bar Skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="h-10 w-full md:w-96 bg-soil-50/50 border border-leaf-100/30 rounded-lg" />
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
          <div className="h-8 w-16 bg-soil-50/50 border border-leaf-100/30 rounded-full shrink-0" />
          <div className="h-8 w-24 bg-soil-50/50 border border-leaf-100/30 rounded-full shrink-0" />
          <div className="h-8 w-20 bg-soil-50/50 border border-leaf-100/30 rounded-full shrink-0" />
          <div className="h-8 w-16 bg-soil-50/50 border border-leaf-100/30 rounded-full shrink-0" />
        </div>
      </div>

      {/* Desktop Table Skeleton (Hidden on mobile) */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-leaf-100/30 bg-white">
        <div className="h-12 bg-leaf-600/10 border-b border-leaf-100/30" />
        <div className="divide-y divide-leaf-100/20">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-4 flex justify-between items-center gap-4">
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/3 bg-soil-50/50 rounded" />
                <div className="h-3 w-1/4 bg-soil-50/30 rounded" />
              </div>
              <div className="w-24 h-4 bg-soil-50/50 rounded" />
              <div className="w-20 h-4 bg-soil-50/50 rounded text-right" />
              <div className="w-20 h-4 bg-soil-50/50 rounded text-right" />
              <div className="w-20 h-4 bg-soil-50/50 rounded text-right" />
              <div className="w-28 h-6 bg-soil-50/50 rounded-md" />
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Card List Skeleton (Hidden on desktop) */}
      <div className="flex flex-col gap-4 md:hidden">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white border border-leaf-100/30 rounded-xl p-4 space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-2 flex-1">
                <div className="h-4 w-1/2 bg-soil-50/50 rounded" />
                <div className="h-3 w-1/3 bg-soil-50/30 rounded" />
              </div>
              <div className="space-y-1 text-right">
                <div className="h-5 w-16 bg-soil-50/50 rounded ml-auto" />
                <div className="h-6 w-20 bg-soil-50/50 rounded ml-auto" />
              </div>
            </div>
            <div className="h-px bg-leaf-50/50" />
            <div className="flex justify-between">
              <div className="h-3 w-1/3 bg-soil-50/50 rounded" />
              <div className="h-3 w-1/3 bg-soil-50/50 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

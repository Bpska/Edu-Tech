import React from 'react';

export const Skeleton = ({ className = '', variant = 'text' }) => {
  const baseClasses = 'animate-pulse bg-white/10 rounded';
  
  let variantClasses = '';
  if (variant === 'circle') {
    variantClasses = 'rounded-full';
  } else if (variant === 'card') {
    variantClasses = 'h-48 rounded-2xl w-full';
  } else if (variant === 'title') {
    variantClasses = 'h-8 w-2/3';
  } else if (variant === 'text') {
    variantClasses = 'h-4 w-full';
  }

  return <div className={`${baseClasses} ${variantClasses} ${className}`} />;
};

export const DashboardSkeleton = () => {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Banner Skeleton */}
      <div className="h-40 bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-end space-y-3">
        <Skeleton className="w-1/3 h-8" />
        <Skeleton className="w-1/2 h-4" />
      </div>
      
      {/* 3-Column Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-60 bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <Skeleton className="w-1/2 h-6" />
          <div className="flex justify-center items-center h-32">
            <Skeleton variant="circle" className="w-24 h-24" />
          </div>
        </div>
        <div className="h-60 bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <Skeleton className="w-1/2 h-6" />
          <div className="space-y-2 pt-4">
            <Skeleton className="w-full h-8" />
            <Skeleton className="w-full h-8" />
            <Skeleton className="w-full h-8" />
          </div>
        </div>
        <div className="h-60 bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <Skeleton className="w-1/2 h-6" />
          <div className="flex gap-4 pt-4">
            <Skeleton variant="circle" className="w-12 h-12" />
            <div className="flex-1 space-y-2">
              <Skeleton className="w-3/4 h-4" />
              <Skeleton className="w-1/2 h-3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ExamSelectionSkeleton = () => {
  return (
    <div className="space-y-6">
      <Skeleton className="w-1/4 h-8" />
      <div className="flex space-x-6 overflow-x-hidden pb-4">
        {[1, 2, 3].map((n) => (
          <div key={n} className="min-w-[280px] w-[280px] h-48 bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 flex-shrink-0">
            <div className="flex justify-between">
              <Skeleton className="w-12 h-4" />
              <Skeleton className="w-16 h-4" />
            </div>
            <Skeleton className="w-3/4 h-6" />
            <Skeleton className="w-full h-4" />
            <div className="flex justify-between items-center pt-2">
              <Skeleton className="w-1/3 h-4" />
              <Skeleton className="w-10 h-10" variant="circle" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

import React from "react";

type SkeletonVariant = "shell" | "centered" | "dashboard" | "table" | "detail" | "form";

type SkeletonProps = {
  className?: string;
};

type PageSkeletonProps = {
  variant?: SkeletonVariant;
  rows?: number;
};

const base = "animate-pulse rounded-2xl bg-slate-200/80 dark:bg-slate-700/50";

export const SkeletonBlock = ({ className = "" }: SkeletonProps) => (
  <div className={`${base} ${className}`.trim()} />
);

export const AppShellSkeleton = () => (
  <div className="min-h-screen bg-slate-50 px-4 py-4 dark:bg-boxdark-2 sm:px-6 lg:px-8">
    <div className="grid min-h-[calc(100vh-2rem)] gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
      <div className="hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-strokedark dark:bg-boxdark lg:block">
        <SkeletonBlock className="h-10 w-36" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-11 w-full rounded-2xl" />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-strokedark dark:bg-boxdark">
          <div className="flex items-center justify-between gap-4">
            <SkeletonBlock className="h-4 w-40" />
            <SkeletonBlock className="h-10 w-32 rounded-2xl" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-strokedark dark:bg-boxdark">
              <SkeletonBlock className="h-4 w-28" />
              <SkeletonBlock className="mt-4 h-9 w-24 rounded-2xl" />
              <SkeletonBlock className="mt-3 h-3 w-36 rounded-full" />
            </div>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-strokedark dark:bg-boxdark xl:col-span-2">
            <SkeletonBlock className="h-5 w-44" />
            <SkeletonBlock className="mt-5 h-[320px] w-full rounded-[28px]" />
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-strokedark dark:bg-boxdark">
            <SkeletonBlock className="h-5 w-32" />
            <div className="mt-5 space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <SkeletonBlock key={index} className="h-16 w-full rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const CenteredSkeleton = () => (
  <div className="flex min-h-[60vh] items-center justify-center p-6">
    <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-strokedark dark:bg-boxdark">
      <SkeletonBlock className="h-6 w-52" />
      <SkeletonBlock className="mt-4 h-3 w-3/4 rounded-full" />
      <SkeletonBlock className="mt-2 h-3 w-2/3 rounded-full" />
      <div className="mt-6 space-y-3">
        <SkeletonBlock className="h-12 w-full rounded-2xl" />
        <SkeletonBlock className="h-12 w-full rounded-2xl" />
        <SkeletonBlock className="h-12 w-2/3 rounded-2xl" />
      </div>
    </div>
  </div>
);

export const CardGridSkeleton = ({ rows = 6 }: { rows?: number }) => (
  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    {Array.from({ length: rows }).map((_, index) => (
      <div key={index} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-strokedark dark:bg-boxdark">
        <SkeletonBlock className="h-4 w-32" />
        <SkeletonBlock className="mt-4 h-8 w-24 rounded-2xl" />
        <SkeletonBlock className="mt-3 h-3 w-40 rounded-full" />
      </div>
    ))}
  </div>
);

export const TableSkeleton = ({ rows = 6 }: { rows?: number }) => (
  <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-strokedark dark:bg-boxdark">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <SkeletonBlock className="h-11 w-full max-w-sm rounded-2xl" />
      <SkeletonBlock className="h-11 w-32 rounded-2xl" />
    </div>
    <div className="overflow-hidden rounded-2xl border border-slate-100 dark:border-strokedark">
      <div className="grid grid-cols-4 gap-4 border-b border-slate-100 bg-slate-50 p-4 dark:border-strokedark dark:bg-slate-900/40">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-4 w-full rounded-full" />
        ))}
      </div>
      <div className="space-y-3 p-4">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((__, colIndex) => (
              <SkeletonBlock key={colIndex} className="h-5 w-full rounded-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const DetailSkeleton = () => (
  <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-strokedark dark:bg-boxdark">
    <SkeletonBlock className="h-8 w-56" />
    <SkeletonBlock className="h-4 w-72 rounded-full" />
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <SkeletonBlock key={index} className="h-28 w-full rounded-3xl" />
      ))}
    </div>
    <SkeletonBlock className="h-56 w-full rounded-[28px]" />
  </div>
);

export const FormSkeleton = ({ rows = 6 }: { rows?: number }) => (
  <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-strokedark dark:bg-boxdark">
    <SkeletonBlock className="h-8 w-48" />
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="space-y-2">
          <SkeletonBlock className="h-4 w-32 rounded-full" />
          <SkeletonBlock className="h-12 w-full rounded-2xl" />
        </div>
      ))}
    </div>
  </div>
);

export const PageSkeleton = ({ variant = "centered", rows = 6 }: PageSkeletonProps) => {
  switch (variant) {
    case "shell":
      return <AppShellSkeleton />;
    case "dashboard":
      return (
        <div className="space-y-4 p-6">
          <CardGridSkeleton rows={4} />
          <div className="grid gap-4 xl:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-strokedark dark:bg-boxdark xl:col-span-2">
              <SkeletonBlock className="h-5 w-44" />
              <SkeletonBlock className="mt-5 h-[300px] w-full rounded-[28px]" />
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-strokedark dark:bg-boxdark">
              <SkeletonBlock className="h-5 w-32" />
              <div className="mt-4 space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <SkeletonBlock key={index} className="h-14 w-full rounded-2xl" />
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    case "table":
      return <TableSkeleton rows={rows} />;
    case "detail":
      return <DetailSkeleton />;
    case "form":
      return <FormSkeleton rows={rows} />;
    default:
      return <CenteredSkeleton />;
  }
};


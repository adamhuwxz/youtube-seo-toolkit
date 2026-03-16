export default function WorkflowProgress({
  progress,
}: {
  progress: number;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-6">
      <p className="text-sm text-white/60">Processing video...</p>

      <div className="mt-4 h-2 w-full rounded-full bg-white/10">
        <div
          style={{ width: `${progress}%` }}
          className="h-full rounded-full bg-cyan-400 transition-all duration-500"
        />
      </div>

      <p className="mt-2 text-xs text-white/40">{progress}% complete</p>
    </div>
  );
}
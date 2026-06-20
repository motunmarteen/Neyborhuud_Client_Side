type PostCardFollowButtonProps = {
  visible: boolean;
  isFollowing: boolean;
  isPending: boolean;
  onToggle: () => void;
};

export function PostCardFollowButton({
  visible,
  isFollowing,
  isPending,
  onToggle,
}: PostCardFollowButtonProps) {
  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      disabled={isPending}
      className={`shrink-0 rounded-none px-3 py-1 text-[10px] font-black uppercase tracking-wide transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        isFollowing
          ? 'bg-black/[0.04] text-primary dark:bg-white/10 dark:text-primary hover:bg-brand-red/10 hover:text-brand-red'
          : 'bg-primary text-white hover:bg-brand-green-dark'
      }`}
      aria-label={isFollowing ? 'Unfollow' : 'Follow'}
    >
      {isPending ? '…' : isFollowing ? 'Unfollow' : 'Follow'}
    </button>
  );
}

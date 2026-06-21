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
      className={`shrink-0 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-[13px] font-bold tracking-wide hover:underline cursor-pointer ${
        isFollowing
          ? 'text-primary dark:text-primary hover:text-brand-red'
          : 'text-primary dark:text-primary hover:text-brand-green-dark'
      }`}
      aria-label={isFollowing ? 'Unfollow' : 'Follow'}
    >
      {isPending ? '…' : isFollowing ? 'Unfollow' : 'Follow'}
    </button>
  );
}

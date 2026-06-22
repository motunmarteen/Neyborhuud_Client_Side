import { UserPlus, UserCheck, Loader2 } from 'lucide-react';

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
      className={`post-card-header__icon-btn disabled:opacity-50 disabled:cursor-not-allowed ${
        isFollowing ? 'text-primary dark:text-primary hover:text-brand-red' : ''
      }`}
      aria-label={isFollowing ? 'Unfollow' : 'Follow'}
      title={isFollowing ? 'Unfollow' : 'Follow'}
    >
      <span className="flex items-center justify-center">
        {isPending ? (
          <Loader2 className="w-[18px] h-[18px] animate-spin" strokeWidth={1.5} />
        ) : isFollowing ? (
          <UserCheck className="w-[18px] h-[18px]" strokeWidth={1.5} />
        ) : (
          <UserPlus className="w-[18px] h-[18px]" strokeWidth={1.5} />
        )}
      </span>
    </button>
  );
}

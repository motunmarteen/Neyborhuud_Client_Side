import type { LucideIcon } from 'lucide-react';
import {
  Ban,
  EyeOff,
  Flag,
  Link,
  MessageCircle,
  Phone,
  Pin,
  ShieldUser,
  SquarePen,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  User,
  UserMinus,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  thumb_up: ThumbsUp,
  thumb_down: ThumbsDown,
  visibility_off: EyeOff,
  link: Link,
  chat: MessageCircle,
  call: Phone,
  shield_person: ShieldUser,
  person_remove: UserMinus,
  flag: Flag,
  block: Ban,
  edit: SquarePen,
  push_pin: Pin,
  delete: Trash2,
  person: User,
};

type PostCardMenuActionIconProps = {
  name: string;
  className?: string;
  danger?: boolean;
};

export function PostCardMenuActionIcon({ name, className = '', danger = false }: PostCardMenuActionIconProps) {
  const Icon = ICON_MAP[name] ?? User;
  return (
    <Icon
      size={20}
      strokeWidth={2}
      className={`post-card-actions-sheet__item-icon shrink-0 ${danger ? 'text-brand-red' : 'text-neu-text-secondary dark:text-white/60'} ${className}`}
      aria-hidden
    />
  );
}

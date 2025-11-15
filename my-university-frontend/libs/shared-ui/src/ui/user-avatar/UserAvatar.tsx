import { Avatar } from '@maxhub/max-ui';

import { ProfileIcon } from '@shared/icons';
import { cn } from '@shared/utils/className';

import styles from './UserAvatar.module.scss';

type UserAvatarProps = {
  size?: number;
  initials?: string | null;
  photoUrl?: string | null;
  className?: string;
};

export function UserAvatar({ size = 72, initials, photoUrl, className }: UserAvatarProps) {
  const hasInitials = initials && initials !== '••';
  const showIcon = !photoUrl && !hasInitials;

  return (
    <Avatar.Container
      size={size}
      form="circle"
      className={cn(showIcon && styles.iconContainer, className)}
    >
      {photoUrl ? (
        <Avatar.Image src={photoUrl} alt="Аватар пользователя" />
      ) : hasInitials ? (
        <Avatar.Text gradient="purple">{initials}</Avatar.Text>
      ) : (
        <div className={styles.iconWrapper}>
          <ProfileIcon className={styles.icon} size={size * 0.5} />
        </div>
      )}
    </Avatar.Container>
  );
}


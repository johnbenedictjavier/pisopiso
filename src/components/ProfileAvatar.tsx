import type { Profile } from '../types'
import { imageTransform } from '../lib/images'

interface ProfileAvatarProps {
  profile: Profile
  size?: 'small' | 'medium' | 'large'
}

export default function ProfileAvatar({ profile, size = 'medium' }: ProfileAvatarProps) {
  return (
    <span className={`profile-avatar profile-avatar-${size}`} aria-label={`${profile.displayName} profile picture`}>
      {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" style={{ transform: imageTransform(profile.avatarScale, profile.avatarPositionX, profile.avatarPositionY) }} /> : profile.displayName.slice(0, 1).toUpperCase()}
    </span>
  )
}

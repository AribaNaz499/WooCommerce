
export function getAuthAvatar(user: any): string {
  return (
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    user?.identities?.[0]?.identity_data?.avatar_url ||
    user?.identities?.[0]?.identity_data?.picture ||
    ""
  );
}

export function getUserAvatar(user: any, profile: any): string {
  const fromDb =
    profile?.profileUrl ||
    profile?.profile_url ||
    profile?.avatar_url ||
    profile?.photoUrl ||
    profile?.photo_url ||
    "";

  const fromAuth = getAuthAvatar(user);
  return fromDb || fromAuth || "/assets/icons/administrater.png";
}

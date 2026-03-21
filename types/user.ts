export type User = {
  id: string;
  fullName: string;
  username: string;
  avatarUrl: string | null;
  createdAt: string;
};

export type PublicUser = Omit<User, 'id'>;

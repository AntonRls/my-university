export type Skill = {
  id: string;
  name: string;
};

export type TeamRole = {
  id: string;
  name: string;
  description: string | null;
};

export type Participant = {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  roleId: string | null;
  roleName: string | null;
  roles: ReadonlyArray<TeamRole>;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
};

export type StudentProjectEvent = {
  id: string;
  title: string;
  startDateTime: string;
  endDateTime: string;
};

export type StudentProject = {
  id: string;
  title: string;
  description: string | null;
  ownerId: string;
  ownerName: string | null;
  skills: ReadonlyArray<Skill>;
  participants: ReadonlyArray<Participant>;
  event: StudentProjectEvent | null;
  createdAt: string;
  updatedAt: string;
};


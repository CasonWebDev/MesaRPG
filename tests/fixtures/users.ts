export const mockUsers = {
  player: {
    id: 'test-player-id',
    name: 'Test Player',
    email: 'player@example.com',
    role: 'PLAYER',
  },
  gm: {
    id: 'test-gm-id',
    name: 'Test GM',
    email: 'gm@example.com',
    role: 'GM',
  },
  admin: {
    id: 'test-admin-id',
    name: 'Test Admin',
    email: 'admin@example.com',
    role: 'ADMIN',
  },
}

export const mockSessions = {
  player: {
    user: mockUsers.player,
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  gm: {
    user: mockUsers.gm,
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  admin: {
    user: mockUsers.admin,
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
}
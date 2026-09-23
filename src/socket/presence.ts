const userSockets = new Map<number, Set<string>>();
export const addUserSocket = (userId: number, socketId: string): boolean => {
  let sockets = userSockets.get(userId);
  if (!sockets) {
    sockets = new Set<string>();
    userSockets.set(userId, sockets);
  }
  const wasOffline = sockets.size === 0;
  sockets.add(socketId);
  return wasOffline;
};
export const removeUserSocket = (userId: number, socketId: string): boolean => {
  const sockets = userSockets.get(userId);
  if (!sockets) {
    return false;
  }
  sockets.delete(socketId);
  if (sockets.size === 0) {
    userSockets.delete(userId);
    return true;
  }
  return false;
};
export const isUserOnline = (userId: number): boolean => {
  const sockets = userSockets.get(userId);
  return Boolean(sockets && sockets.size > 0);
};
export const getOnlineUserIds = (): number[] => {
  return Array.from(userSockets.keys());
};

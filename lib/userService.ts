import * as api from './api';
import type { Role } from '../types';

export const getUsers = api.getUsers;
export const createUser = (data: { name: string; email: string; password: string; role: Role }) => api.createUser(data);
export const updateUser = (id: string, data: Partial<{ name: string; email: string; role: Role; password: string }>) => api.updateUser(id, data);
export const deleteUser = (id: string) => api.deleteUser(id);

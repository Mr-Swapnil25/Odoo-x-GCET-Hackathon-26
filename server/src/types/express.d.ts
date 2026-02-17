declare global {
  namespace Express {
    interface User {
      id: string;
      role: 'ADMIN' | 'USER';
    }

    interface Request {
      user?: User;
    }
  }
}

export {};

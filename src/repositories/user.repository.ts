import pool from "../config/database.js";

export type CreateUserData = {
  name: string;
  email: string;
  password: string;
};

export const findUserByEmail = async (email: string) => {
  const [rows] = await pool.execute(
    "SELECT id, name, email, password FROM users WHERE email = ? LIMIT 1",
    [email],
  );

  const users = rows as Array<{
    id: number;
    name: string;
    email: string;
    password: string;
  }>;

  return users[0] ?? null;
};

export const findUserById = async (userId: number) => {
  const [rows] = await pool.execute(
    "SELECT id, name, email FROM users WHERE id = ? LIMIT 1",
    [userId],
  );

  const users = rows as Array<{
    id: number;
    name: string;
    email: string;
  }>;

  return users[0] ?? null;
};

export const findAllUsers = async (excludeUserId?: number) => {
  let query = `
    SELECT id, name, email
    FROM users
  `;

  const params: number[] = [];

  if (excludeUserId !== undefined) {
    query += " WHERE id != ?";
    params.push(excludeUserId);
  }

  query += " ORDER BY name ASC";

  const [rows] = await pool.execute(query, params);

  return rows as Array<{
    id: number;
    name: string;
    email: string;
  }>;
};

export const createUser = async (userData: CreateUserData) => {
  const [result] = await pool.execute(
    "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
    [userData.name, userData.email, userData.password],
  );

  const insertResult = result as { insertId: number };

  return insertResult.insertId;
};

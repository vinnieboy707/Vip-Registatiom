import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import db from '../config/database';
import logger from '../config/logger';
import { User } from '../types';

class AuthService {
  /**
   * Hash password
   */
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
  }

  /**
   * Compare password with hash
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT token
   */
  generateToken(userId: number, email: string, role: string): string {
    return jwt.sign({ id: userId, email, role }, config.jwt.secret, {
      expiresIn: config.jwt.expire,
    } as jwt.SignOptions);
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(userId: number): string {
    return jwt.sign({ id: userId }, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpire,
    } as jwt.SignOptions);
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): any {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch (error) {
      logger.error('Token verification failed:', error);
      throw new Error('Invalid token');
    }
  }

  /**
   * Register new user
   */
  async register(
    email: string,
    password: string,
    fullName: string,
    role: string = 'agent',
    phone?: string
  ): Promise<{ user: Omit<User, 'password'>; token: string }> {
    return new Promise(async (resolve, reject) => {
      try {
        // Check if user already exists
        db.get('SELECT id FROM users WHERE email = ?', [email], async (_err, row) => {
          if (row) {
            return reject(new Error('User already exists'));
          }

          const hashedPassword = await this.hashPassword(password);

          db.run(
            `INSERT INTO users (email, password, full_name, role, phone) 
             VALUES (?, ?, ?, ?, ?)`,
            [email, hashedPassword, fullName, role, phone],
            function (err) {
              if (err) {
                logger.error('Error registering user:', err);
                return reject(new Error('Failed to register user'));
              }

              const userId = this.lastID;
              const token = jwt.sign(
                { id: userId, email, role },
                config.jwt.secret,
                { expiresIn: config.jwt.expire } as jwt.SignOptions
              );

              const user = {
                id: userId,
                email,
                full_name: fullName,
                role: role as 'admin' | 'agent' | 'customer',
                phone,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };

              logger.info(`User registered: ${email}`);
              resolve({ user, token });
            }
          );
        });
      } catch (error) {
        logger.error('Error in register:', error);
        reject(error);
      }
    });
  }

  /**
   * Login user
   */
  async login(
    email: string,
    password: string
  ): Promise<{ user: Omit<User, 'password'>; token: string; refreshToken: string }> {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [email], async (err, row: User) => {
        if (err || !row) {
          logger.warn(`Failed login attempt for: ${email}`);
          return reject(new Error('Invalid credentials'));
        }

        const isValid = await this.comparePassword(password, row.password);
        if (!isValid) {
          logger.warn(`Invalid password for: ${email}`);
          return reject(new Error('Invalid credentials'));
        }

        // Update last login
        db.run('UPDATE users SET last_login = ? WHERE id = ?', [
          new Date().toISOString(),
          row.id,
        ]);

        const token = this.generateToken(row.id, row.email, row.role);
        const refreshToken = this.generateRefreshToken(row.id);

        const user = {
          id: row.id,
          email: row.email,
          full_name: row.full_name,
          role: row.role,
          phone: row.phone,
          created_at: row.created_at,
          updated_at: row.updated_at,
          last_login: new Date().toISOString(),
        };

        logger.info(`User logged in: ${email}`);
        resolve({ user, token, refreshToken });
      });
    });
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: number): Promise<Omit<User, 'password'> | null> {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT id, email, full_name, role, phone, created_at, updated_at FROM users WHERE id = ?',
        [userId],
        (err, row: any) => {
          if (err) {
            logger.error('Error fetching user:', err);
            return reject(err);
          }
          resolve(row ? row as Omit<User, 'password'> : null);
        }
      );
    });
  }
}

export default new AuthService();

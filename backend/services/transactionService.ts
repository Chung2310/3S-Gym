import mongoose, { type ClientSession } from 'mongoose';

export async function supportsTransactions(): Promise<boolean> {
  try {
    const hello = await mongoose.connection.db?.command({ hello: 1 });
    return Boolean(hello?.setName || hello?.msg === 'isdbgrid');
  } catch {
    return false;
  }
}

export async function withTransaction<T>(work: (session: ClientSession) => Promise<T>): Promise<T> {
  const supported = await supportsTransactions();
  const session = await mongoose.startSession();

  if (!supported) {
    try {
      return await work(session);
    } finally {
      await session.endSession();
    }
  }

  try {
    let result!: T;
    try {
      await session.withTransaction(async () => {
        result = await work(session);
      });
      return result;
    } catch (error: any) {
      if (
        error?.name === 'MongoServerError' &&
        (error?.code === 20 ||
          error?.code === 263 ||
          String(error?.message).includes('Transaction numbers are only allowed') ||
          String(error?.message).includes('replica set'))
      ) {
        return await work(session);
      }
      throw error;
    }
  } finally {
    try {
      await session.endSession();
    } catch {
      // Ignored
    }
  }
}

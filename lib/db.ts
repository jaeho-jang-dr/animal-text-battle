// Mock DB implementation to allow build to pass when SQL DB is missing
// This allows the app to run in "Firebase Mode" or "Repair Mode"

const mockStmt = {
    get: (...params: any[]) => { console.warn('Mock DB get called', params); return null; },
    all: (...params: any[]) => { console.warn('Mock DB all called', params); return []; },
    run: (...params: any[]) => { console.warn('Mock DB run called', params); return { changes: 0, lastInsertRowid: 0 }; },
    iterate: function* (...args: any[]) { yield* []; }
};

export const db = {
    prepare: (sql: string) => mockStmt,
    transaction: (fn: any) => (...args: any[]) => fn(...args),
    exec: (sql: string) => { console.warn('Mock DB exec called', sql); },
    pragma: (sql: string) => { console.warn('Mock DB pragma called', sql); },
    close: () => { console.warn('Mock DB closed'); }
};

export const initializeDatabase = () => {
    console.warn('Mock DB initialized (Missing actual SQLite DB)');
};

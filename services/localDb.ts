
export class LocalDB {
  private dbName = 'eltrixa_local_db';
  private version = 1;

  private async getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      request.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('customers')) {
          const store = db.createObjectStore('customers', { keyPath: 'idpel' });
          store.createIndex('nama', 'nama', { unique: false });
          store.createIndex('petugas', 'petugas', { unique: false });
        }
        if (!db.objectStoreNames.contains('arrears')) db.createObjectStore('arrears', { keyPath: 'idpel' });
        if (!db.objectStoreNames.contains('whitelist')) db.createObjectStore('whitelist', { keyPath: 'idpel' });
        if (!db.objectStoreNames.contains('entries')) db.createObjectStore('entries', { keyPath: 'idpel' });
        if (!db.objectStoreNames.contains('users')) db.createObjectStore('users', { keyPath: 'username' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveBatch(storeName: string, data: any[]) {
    const db = await this.getDB();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    data.forEach(item => store.put(item));
    return new Promise((resolve) => { tx.oncomplete = () => resolve(true); });
  }

  async getAll(storeName: string): Promise<any[]> {
    const db = await this.getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
    });
  }

  async clearStore(storeName: string) {
    const db = await this.getDB();
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).clear();
  }

  async getCount(storeName: string): Promise<number> {
    const db = await this.getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(storeName, 'readonly');
      const request = tx.objectStore(storeName).count();
      request.onsuccess = () => resolve(request.result);
    });
  }

  async search(storeName: string, query: (item: any) => boolean): Promise<any[]> {
    const all = await this.getAll(storeName);
    return all.filter(query);
  }
}

export const localDB = new LocalDB();

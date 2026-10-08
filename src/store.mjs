import fs from 'node:fs/promises';
import path from 'node:path';

export class JsonStore {
  constructor(dir) {
    this.dir = dir;
  }
  async init() {
    await fs.mkdir(this.dir, { recursive: true });
  }
  async read(name, fallback = []) {
    const file = path.join(this.dir, name);
    try { return JSON.parse(await fs.readFile(file, 'utf8')); }
    catch { await this.write(name, fallback); return fallback; }
  }
  async write(name, value) {
    const file = path.join(this.dir, name);
    const temp = `${file}.tmp`;
    await fs.writeFile(temp, JSON.stringify(value, null, 2));
    await fs.rename(temp, file);
  }
  async push(name, item, limit = 200) {
    const list = await this.read(name, []);
    list.unshift(item);
    await this.write(name, list.slice(0, limit));
    return item;
  }
}

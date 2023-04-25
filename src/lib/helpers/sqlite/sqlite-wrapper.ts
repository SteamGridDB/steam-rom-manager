import { fork } from 'child_process';

const worker = 'src/lib/helpers/sqlite/sqlite-worker.js';

export class SqliteWrapper {
  private dbPath;
  private task;

  constructor(task: string, dbPath: string) {
    this.dbPath = dbPath;
    this.task = task;
  }

  callWorker() {
    return new Promise((resolve, reject) => {
      const sqliteWorker = fork(worker)
      sqliteWorker.on('message', (data: {[k: string]: any}) => {
        if (data.type === 'error') {
          reject(data.error);
        }
        else if (data.type === 'result') {
          resolve(data.result);
        }
      })
      sqliteWorker.send({task: this.task, dbPath: this.dbPath})
    })
  }
}

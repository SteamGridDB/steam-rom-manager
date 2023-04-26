import { fork } from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path';


export class SqliteWrapper {
  private dbPath;
  private task;

  constructor(task: string, dbPath: string) {
    this.dbPath = dbPath;
    this.task = task;
  }

  // Work-around for calling fork inside a packed application
  // https://github.com/electron/electron/issues/2708#issuecomment-137764698
  callWorker() {
    return new Promise((resolve, reject) => {
      let cwd = path.join(__dirname, "../../..");
      let workerPath;
      if(fs.existsSync(path.join(cwd,'app.asar'))) {
        workerPath = 'app.asar/workers/sqlite-worker.js';
      } else {
        workerPath = 'workers/sqlite-worker.js'
        cwd = null;
      }
      const sqliteWorker = fork(workerPath, [], {
        cwd: cwd
      })
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

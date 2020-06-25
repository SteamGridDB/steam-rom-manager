import * as Glob from 'glob';

export function globPromise(pattern: string, options?: Glob.IOptions) {
  return new Promise<string[]>((resolve, reject) => {
    try {
      Glob(pattern, options||{}, (error, files) => {
        if (error)
          reject(error);
        else
          resolve(files);
      });
    } catch (error) {
      reject(error);
    }
  })
}

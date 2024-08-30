import { Injectable } from "@angular/core";
import MarkdownIt from "markdown-it";
const markdownIt = require("markdown-it")();

@Injectable()
export class MarkdownService {
  private instanceMap: Map<string, MarkdownIt> = new Map<string, MarkdownIt>();
  private defaultId: string = undefined;

  createInstance(id: string, instance: MarkdownIt) {
    if (this.instanceMap.has(id)) return this.instanceMap.get(id);
    else {
      if (this.defaultId === undefined) this.defaultId = id;
      return this.instanceMap.set(id, instance).get(id);
    }
  }

  getInstance(id: string) {
    return this.instanceMap.get(id);
  }

  deleteInstance(id: string) {
    if (this.instanceMap.has(id)) {
      if (this.defaultId === id) this.defaultId = undefined;
      this.instanceMap.delete(id);
    }
  }

  compile(text: string, id?: string, env?: any) {
    let instance =
      id != undefined
        ? this.instanceMap.get(id)
        : this.defaultId
          ? this.instanceMap.get(this.defaultId)
          : undefined;
    if (instance !== undefined) return instance.render(text, env);
    else return markdownIt.render(text, env);
  }
}

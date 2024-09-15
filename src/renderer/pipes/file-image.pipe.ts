import { PipeTransform, Pipe } from "@angular/core";
import * as url from "../../lib/helpers/url";

@Pipe({ name: "fileImage" })
export class FileImage implements PipeTransform {
  transform(filePath: string) {
    return url.encodeFile(filePath);
  }
}

import { PipeTransform, Pipe } from "@angular/core";
import { encodeFile } from "../../lib/helpers/url/file-url";

@Pipe({ name: "fileImage" })
export class FileImage implements PipeTransform {
  transform(filePath: string) {
    return encodeFile(filePath);
  }
}

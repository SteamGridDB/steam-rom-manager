import { Injectable } from "@angular/core";
import { LoggerService } from "./logger.service";
import { Subject, BehaviorSubject } from "rxjs";
import { takeWhile } from "rxjs/operators";
import * as json from "../../lib/helpers/json";
import * as paths from "../../paths";
import * as schemas from "../schemas";
import * as modifiers from "../modifiers";
import * as _ from "lodash";
import { ParserFolders, ParserFoldersMap } from "../../models/parser-folders.model";

@Injectable()
export class ParserFoldersService {
  private changeSubject: Subject<ParserFolders> = new Subject();
  private loadedSubject: BehaviorSubject<boolean> = new BehaviorSubject(
    false,
  );
  private savingIsDisabled: boolean = false;
  private validator: json.Validator = new json.Validator(
    schemas.parserFolders,
    modifiers.parserFolders,
  );
  private parserFolders: ParserFolders;
    
  constructor(private loggerService: LoggerService) {
    this.parserFolders = <ParserFolders>this.validator.getDefaultValues();
    json.read<ParserFolders>(paths.parserFolders, this.parserFolders)
    .then((parserFolders)=>{
        if(!this.validator.validate(parserFolders).isValid()) {
            this.loggerService.error("Error reading parser folders json.")
            this.savingIsDisabled = true;
        } else {
            this.parserFolders = parserFolders;
        }
    }).catch((error)=>{
        this.loggerService.error("Error reading parser folders json.")
        this.loggerService.error(error);
        this.savingIsDisabled = true;
    })
    .then(() => {
        this.loadedSubject.next(true);
    })
  }

  get folders(): ParserFolders {
    return this.parserFolders;
  }

  foldersChanged() {
    this.changeSubject.next(this.parserFolders);
  }

  getChangeObservable() {
    return this.changeSubject.asObservable();
  }

  saveParserFolders() {
        if(!this.savingIsDisabled) {
            json
            .write(paths.parserFolders, this.parserFolders)
            .then()
            .catch((error) => {
            this.loggerService.error("Error writing parser folders json")
            this.loggerService.error(error);
            });
        }
    }

    onLoad(callback: (parserFolders: ParserFolders) => void) {
        this.loadedSubject
        .asObservable()
        .pipe(
        takeWhile((loaded: boolean) => {
            if (loaded) callback(this.parserFolders);
            return !loaded;
        }),
        )
        .subscribe();
    }
}



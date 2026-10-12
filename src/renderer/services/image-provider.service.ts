import { Injectable } from "@angular/core";
import { ArtworkProviders } from "../../core/artwork-providers";
import { getDefaultFetch } from "../../core/http";

// Angular wrapper around the core's online artwork providers.
@Injectable()
export class ImageProviderService {
  private providers = new ArtworkProviders(getDefaultFetch());

  get instance() {
    return this.providers;
  }
}

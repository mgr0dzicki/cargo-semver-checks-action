import * as cache from "@actions/cache";
import * as core from "@actions/core";
import * as rustCore from "@actions-rs/core";

export class RustdocCache {
    private readonly cachePath: string;
    private readonly cacheKey: string;

    constructor() {
        this.cachePath = core.toPlatformPath(
            (rustCore.input.getInput("manifest-path") || ".") + "/target/semver-checks/cache"
        );
        this.cacheKey = rustCore.input.getInput("cache-key") + "-semver-checks-rustdoc";
    }

    async restore(): Promise<boolean> {
        const key = await cache.restoreCache([this.cachePath], this.cacheKey);
        if (key) {
            core.info(`Restored rustdoc cache from key: ${key}.`);
            return true;
        } else {
            core.info("Rustdoc cache not found.");
            return false;
        }
    }

    async save(): Promise<void> {
        core.info(`Saving rustdoc cache using key: ${this.cacheKey}...`);
        await cache.saveCache([this.cachePath], this.cacheKey);
    }
}

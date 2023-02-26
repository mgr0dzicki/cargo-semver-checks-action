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
        if (await cache.restoreCache([this.cachePath], this.cacheKey)) {
            core.info(`Restored rustdoc cache successfully.`);
            return true;
        } else {
            core.info("Rustdoc cache not found.");
            return false;
        }
    }

    async save(): Promise<void> {
        core.info(`Saving rustdoc cache...`);
        await cache.saveCache([this.cachePath], this.cacheKey);
    }
}

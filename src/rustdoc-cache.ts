import os = require("os");

import * as path from "path";
import * as cache from "@actions/cache";
import * as core from "@actions/core";
import * as rustCore from "@actions-rs/core";

export class RustdocCache {
    private readonly cachePath: string;
    private readonly cacheKey: string;

    constructor() {
        this.cachePath = path.join("target", "semver-checks", "cache");
        core.info(`Rustdoc cache path: ${this.cachePath}.`);

        this.cacheKey = [
            rustCore.input.getInput("cache-key"),
            os.platform() as string,
            "semver-checks-rustdoc",
        ].join("-");
        core.info(`Rustdoc cache key: ${this.cacheKey}.`);
    }

    async restore(): Promise<boolean> {
        const key = await cache.restoreCache([this.cachePath], this.cacheKey);
        if (key) {
            core.info(`Restored rustdoc cache.`);
            return true;
        } else {
            core.info(`Rustdoc cache not found.`);
            return false;
        }
    }

    async save(): Promise<void> {
        core.info("Saving rustdoc cache...");
        await cache.saveCache([this.cachePath], this.cacheKey);
    }
}

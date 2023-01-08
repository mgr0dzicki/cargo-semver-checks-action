import os = require('os');

import * as core from '@actions/core';
import * as github from '@actions/github';

const releaseEndpoint = 'https://api.github.com/repos/obi1kenobi/cargo-semver-checks/releases/latest'

function getPlatformMatchingTarget(): string {
    const platform = os.platform() as string;
    switch (platform) {
        case "linux":
            return "x86_64-unknown-linux-gnu"
        default:
            throw new Error("Unsupported runner");
    }
}

async function getDownloadURL(target: string): Promise<string> {
    const request = await fetch(releaseEndpoint);
    const releaseInfo = await request.json();
    const asset = releaseInfo["assets"].find((asset: { [x: string]: string; }) => {
        return asset['name'].endsWith(`${target}.tar.gz`)
    });

    if (!asset)
        throw new Error(`Couldn't find a release for target ${target}.`);

    return asset["browser_download_url"];
}

async function run(): Promise<void> {
    const octokit = github.getOctokit('');
    const url = await getDownloadURL(getPlatformMatchingTarget());
    console.log(url);
}

async function main() {
    try {
        await run();
    } catch (error: any) {
        core.setFailed(error.message);
    }
}

main();
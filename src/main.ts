import os = require('os');

import * as core from '@actions/core';
import * as io from '@actions/io';
import * as toolCache from '@actions/tool-cache';
import fetch from 'node-fetch';
import * as rustCore from '@actions-rs/core';

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

function optionIfValueProvided(option: string, value?: string): string {
    return value ? ` ${option} ${value}` : '';
}

function getCheckReleaseArguments(): string[] {
    return [
        optionIfValueProvided('--package', rustCore.input.getInput('crate-name')),
        optionIfValueProvided('--manifest-path', rustCore.input.getInput('manifest-path')),
        rustCore.input.getInputBool('verbose') ? ' --verbose' : ''
    ].filter(el => el != '');
}

async function getDownloadURL(target: string): Promise<string> {
    const request = await fetch(releaseEndpoint);
    const releaseInfo = await request.json();
    const asset = releaseInfo["assets"].find((asset: { [x: string]: string; }) => {
        return asset['name'].endsWith(`${target}.tar.gz`)
    });

    if (!asset) {
        throw new Error(`Couldn't find a release for target ${target}.`);
    }

    return asset["browser_download_url"];
}

async function installRustUp(): Promise<void> {
    const rustup = await rustCore.RustUp.getOrInstall();
    await rustup.call(['show']);
    await rustup.setProfile('minimal');
    await rustup.installToolchain('stable');
}

async function runCargoSemverChecks(cargo: rustCore.Cargo): Promise<void> {
    await cargo.call(['semver-checks', 'check-release'].concat(getCheckReleaseArguments()));
}

async function installCargoSemverChecksFromPrecompiledBinary(): Promise<void> {
    const url = await getDownloadURL(getPlatformMatchingTarget());
    
    const downloadDir = `${os.tmpdir()}/cargo-semver-checks`;
    await io.mkdirP(downloadDir);

    core.info(`downloading cargo-semver-checks from ${url}`);
    const tarballPath = await toolCache.downloadTool(url);
    core.info(`extracting ${tarballPath}`);
    const binPath = await toolCache.extractTar(tarballPath, undefined, ["xz"]);

    core.addPath(binPath);
}

async function installCargoSemverChecksUsingCargo(cargo: rustCore.Cargo): Promise<void> {
    await cargo.call(['install', 'cargo-semver-checks', '--locked']);
}

async function installCargoSemverChecks(cargo: rustCore.Cargo): Promise<void> {
    if (await io.which('cargo-semver-checks') != '') {
        return;
    }
    
    core.info('cargo-semver-checks is not installed, installing now...');

    try {
        await installCargoSemverChecksFromPrecompiledBinary();
    } catch (error: any) {
        core.info('Failed to download precompiled binary of cargo-semver-checks.');
        core.info(`Error: ${error.message}`);
        core.info('Installing using cargo install...');

        await installCargoSemverChecksUsingCargo(cargo);
    }
}

async function run(): Promise<void> {
    await installRustUp();

    const cargo = await rustCore.Cargo.get();

    await installCargoSemverChecks(cargo);
    await runCargoSemverChecks(cargo);
}

async function main() {
    try {
        await run();
    } catch (error: any) {
        core.setFailed(error.message);
    }
}

main();
import { execSync } from "child_process";

export class DockerControl {
  static runCommand(command: string): string {
    try {
      return execSync(command, { encoding: "utf-8", stdio: "pipe" });
    } catch (error: any) {
      return error.stdout || error.stderr || error.message || "";
    }
  }

  static isDockerAvailable(): boolean {
    try {
      const output = execSync("docker info", {
        encoding: "utf-8",
        stdio: "pipe",
      });
      return !output.includes("error") && !output.includes("Cannot connect");
    } catch (e) {
      return false;
    }
  }

  static stopContainer(containerName: string): void {
    if (!this.isDockerAvailable()) return;
    console.log(`[Chaos] Stopping container: ${containerName}...`);
    this.runCommand(`docker stop ${containerName}`);
  }

  static startContainer(containerName: string): void {
    if (!this.isDockerAvailable()) return;
    console.log(`[Chaos] Starting container: ${containerName}...`);
    this.runCommand(`docker start ${containerName}`);
  }

  static pauseContainer(containerName: string): void {
    if (!this.isDockerAvailable()) return;
    console.log(`[Chaos] Pausing container: ${containerName}...`);
    this.runCommand(`docker pause ${containerName}`);
  }

  static unpauseContainer(containerName: string): void {
    if (!this.isDockerAvailable()) return;
    console.log(`[Chaos] Unpausing container: ${containerName}...`);
    this.runCommand(`docker unpause ${containerName}`);
  }

  static restartContainer(containerName: string): void {
    if (!this.isDockerAvailable()) return;
    console.log(`[Chaos] Restarting container: ${containerName}...`);
    this.runCommand(`docker restart ${containerName}`);
  }

  static isContainerRunning(containerName: string): boolean {
    if (!this.isDockerAvailable()) return false;
    const output = this.runCommand(
      `docker inspect -f "{{.State.Running}}" ${containerName}`,
    ).trim();
    return output === "true";
  }
}

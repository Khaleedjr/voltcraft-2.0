#!/usr/bin/env node
/**
 * Make an admin account line for ADMIN_ACCOUNTS.
 *
 *   node scripts/admin-password.mjs owner@voltcraft.org.ng
 *
 * Asks for the password twice (nothing is echoed), then prints the line to
 * add to ADMIN_ACCOUNTS. For more than one account, join lines with commas.
 * Piping works too:  printf 'the password' | node scripts/admin-password.mjs you@x
 *
 *   node scripts/admin-password.mjs --secret
 *
 * prints a fresh random ADMIN_SESSION_SECRET.
 *
 * Keep the scrypt parameters in step with lib/admin/auth.ts.
 */
import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";
import readline from "node:readline";

const SCRYPT = { N: 1 << 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const scryptAsync = promisify(scrypt);

async function hash(password) {
  const salt = randomBytes(16);
  const key = await scryptAsync(password.normalize("NFKC"), salt, 32, SCRYPT);
  return `s1.${salt.toString("base64url")}.${key.toString("base64url")}`;
}

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (s) => {
      if (s.includes(question)) rl.output.write(s);
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
  });
}

async function readPiped() {
  let data = "";
  for await (const chunk of process.stdin) data += chunk;
  return data.replace(/\r?\n$/, "");
}

const arg = process.argv[2];

if (arg === "--secret") {
  console.log(`ADMIN_SESSION_SECRET=${randomBytes(32).toString("base64url")}`);
  process.exit(0);
}

if (!arg || !/^[^\s@:,]+@[^\s@:,]+\.[^\s@:,]+$/.test(arg)) {
  console.error("usage: node scripts/admin-password.mjs <email>   |   --secret");
  process.exit(1);
}

let password;
if (process.stdin.isTTY) {
  password = await askHidden(`Password for ${arg}: `);
  const again = await askHidden("Again: ");
  if (password !== again) {
    console.error("Those did not match.");
    process.exit(1);
  }
} else {
  password = await readPiped();
}

if (password.length < 10) {
  console.error("Use at least 10 characters.");
  process.exit(1);
}

const line = `${arg.toLowerCase()}:${await hash(password)}`;
console.log("\nAdd this to ADMIN_ACCOUNTS (comma-separate several accounts):\n");
console.log(`ADMIN_ACCOUNTS=${line}`);

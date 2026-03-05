#!/usr/bin/env node
/**
 * encodeMongoPassword.js
 *
 * Utility that URL-encodes a MongoDB Atlas password and prints a
 * ready-to-use connection string template.
 *
 * Usage (interactive prompt):
 *   node backend/utils/encodeMongoPassword.js
 *
 * Usage (password as CLI argument):
 *   node backend/utils/encodeMongoPassword.js 'your-raw-password'
 *
 * The encoded value can then be pasted directly into the MONGODB_URI
 * environment variable (e.g. in Railway's Variables dashboard).
 */

'use strict';

const readline = require('readline');

/**
 * Percent-encode a string so it is safe to embed inside a URI component
 * (e.g. the password segment of a MongoDB connection string).
 *
 * @param {string} raw - The plain-text password.
 * @returns {string} URL-encoded password.
 */
function encodePassword(raw) {
    return encodeURIComponent(raw);
}

/**
 * Print the encoded password and a connection-string template to stdout.
 *
 * @param {string} raw - The plain-text password supplied by the user.
 */
function printResult(raw) {
    const encoded = encodePassword(raw);
    console.log('\nEncoded password:');
    console.log(`  ${encoded}`);
    console.log('\nConnection string template (replace placeholders):');
    console.log(
        `  mongodb+srv://<username>:${encoded}@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority`
    );
    console.log(
        '\nSet this as the MONGODB_URI environment variable in Railway (or your hosting provider).\n'
    );
}

// ── Main ─────────────────────────────────────────────────────────────────────

const arg = process.argv[2];

if (arg !== undefined) {
    // Password supplied directly as a command-line argument.
    printResult(arg);
} else {
    // Interactive mode: prompt the user for the password.
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    rl.question('Enter your MongoDB Atlas password: ', (answer) => {
        rl.close();
        if (!answer) {
            console.error('No password provided. Exiting.');
            process.exitCode = 1;
            return;
        }
        printResult(answer);
    });
}

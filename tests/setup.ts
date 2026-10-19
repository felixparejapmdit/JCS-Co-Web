import os from 'node:os';
import path from 'node:path';

// Each test file gets its own settings file, so tests never touch this server's .cloudaos/settings.json.
process.env.CLOUDAOS_SETTINGS_FILE = path.join(os.tmpdir(), `cloudaos-test-${process.pid}-${Math.random().toString(36).slice(2)}.json`);

// The suites cover the business rules of JCS Chemical and Chemag Trading, so both stay active in tests
// (the built-in default switches JCS off for now). APF, dissolved, stays off.
process.env.COMPANIES_DISABLED ??= '8200';

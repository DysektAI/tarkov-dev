import { URL } from "url";
import { readFile } from "fs/promises";

/**
 * This function forces .js files to be loades as ES modules
 * so the default export is a string containing the CSS stylesheet.
 */     
export async function load(url, context, defaultLoad) {
    if (context.format !== 'commonjs') {
        return defaultLoad(url, context, defaultLoad);
    }

    const forceConvert = [
        'do-fetch-items.js',
        'do-fetch-barters.js',
        'do-fetch-crafts.js',
        'do-fetch-hideout.js',
        'do-fetch-maps.js',
        'do-fetch-meta.js',
        'do-fetch-traders.js',
        'do-fetch-quests.js',
        'do-fetch-bosses.js',
        'flea-market-fee.js',
        'camelcase-to-dashes.js',
        'graphql-request.js',
        'api-query.js',
    ];

    for (const fileName of forceConvert) {
        if (url.endsWith(fileName)) {
            const content = await readFile(new URL(url));
            return {
                format: "module",
                source: content,
                shortCircuit: true
            }
        }
    }
    return defaultLoad(url, context, defaultLoad);
}

import { createDirectus, graphql, rest, staticToken } from '@directus/sdk';
import { DIRECTUS_API, DIRECTUS_STATIC_TOKEN } from '../envConfig.js';

let clientSetup = null;

if (DIRECTUS_API) {
    clientSetup = createDirectus(DIRECTUS_API)
        .with(graphql())
        .with(rest())
        .with(staticToken(DIRECTUS_STATIC_TOKEN));
}

const client = clientSetup;
export default client;
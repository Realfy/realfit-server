import { createDirectus, graphql, rest } from '@directus/sdk';
import { DIRECTUS_API } from '../envConfig.js';

let clientSetup = null;

if (DIRECTUS_API) {
    clientSetup = createDirectus(DIRECTUS_API)
        .with(graphql())
        .with(rest())
}

const client = clientSetup;
export default client;
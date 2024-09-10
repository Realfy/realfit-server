import { createDirectus, authentication, graphql, rest } from '@directus/sdk';
import { DIRECTUS_API, DIRECTUS_ADMIN_EMAIL, DIRECTUS_ADMIN_PASSWORD } from '../envConfig.js';

let clientSetup = null;

if (DIRECTUS_API) {
    clientSetup = createDirectus(DIRECTUS_API)
        .with(authentication())
        .with(graphql())
        .with(rest());
    await clientSetup.login(DIRECTUS_ADMIN_EMAIL, DIRECTUS_ADMIN_PASSWORD);
}

const client = clientSetup;

export default client;
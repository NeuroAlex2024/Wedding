import PocketBase from 'pocketbase';

const baseUrl = import.meta.env.VITE_PB_URL ?? '/api';

const pb = new PocketBase(baseUrl);
pb.autoCancellation(false);

export default pb;

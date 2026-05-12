import { initializeFridaySession } from './session.js';
import { initializeChat } from './chat.js';
import { initializeDrawer } from './drawer.js';

document.addEventListener('DOMContentLoaded', async () => {

    const sessionReady = await initializeFridaySession();

    if (!sessionReady) return;

    console.log("FRIDAY systems online ✨");

    initializeDrawer();
    initializeChat();
});
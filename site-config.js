// Choose local API on localhost; otherwise use production API.
(() => {
    const hostname = String(window.location.hostname || '').toLowerCase();
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';

    window.HOLIDAY_API_URL = isLocal
        ? 'http://localhost:8080/api'
        : 'https://guildholiday.discloud.app/api';
})();

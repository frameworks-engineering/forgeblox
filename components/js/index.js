const forgeblox = (() => {

    const PLACEHOLDER = 'components/images/thumb-placeholder.png';

    async function login() {
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;

        if (!username || !password) {
            alert('Please enter your username and password.');
            return;
        }

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            if (res.ok) {
                const { returnUrl } = getQueryParams();
                window.location.href = returnUrl || '/User.html';
            } else {
                const { error } = await res.json().catch(() => ({ error: 'Login failed.' }));
                alert(error || 'Invalid username or password.');
            }
        } catch {
            alert('A network error occurred. Please try again.');
        }
    }

    async function requestThumbnail(assetVersionId, width, height, imageFormat, onSuccess, onFailed) {
        try {
            const params = new URLSearchParams({ assetVersionId, width, height, imageFormat });
            const res = await fetch(`/api/thumbs?${params}`);

            if (res.ok) {
                const data = await res.json();
                if (typeof onSuccess === 'function') onSuccess(data);
            } else {
                const err = new Error(`Thumbnail request failed: ${res.status}`);
                if (typeof onFailed === 'function') onFailed(err);
            }
        } catch (err) {
            if (typeof onFailed === 'function') onFailed(err);
        }
    }

    async function resolveThumb(img) {
        const assetVersionId = img.dataset.assetVersionId;
        if (!assetVersionId) return;

        requestThumbnail(
            assetVersionId,
            img.dataset.width  || 110,
            img.dataset.height || 110,
            img.dataset.format || 'png',
            ({ imageUrl }) => { img.src = imageUrl || PLACEHOLDER; },
            ()            => { img.src = PLACEHOLDER; }
        );
    }

    async function loadCoolPlaces() {
        const row = document.getElementById('cool-places-row');
        if (!row) return;

        try {
            const res = await fetch('/api/cool-places');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const places = await res.json();

            row.innerHTML = places.map(place => `
                <td class="UserPlace">
                    <a title="${escapeHtml(place.title)}" href="${escapeHtml(place.url)}" style="display:inline-block;cursor:pointer;">
                        <img
                            src="${escapeHtml(PLACEHOLDER)}"
                            data-asset-version-id="${escapeHtml(String(place.assetVersionId || place.id))}"
                            data-width="110"
                            data-height="110"
                            data-format="png"
                            border="0"
                            alt="${escapeHtml(place.title)}"
                            class="fbx-thumb"
                        />
                    </a>
                </td>
            `).join('');

            row.querySelectorAll('img.fbx-thumb').forEach(resolveThumb);
        } catch {
        }
    }

    function getQueryParams() {
        return Object.fromEntries(new URLSearchParams(window.location.search));
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function init() {
        loadCoolPlaces();

        ['login-username', 'login-password'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter') login(); });
        });

        document.querySelectorAll('img.fbx-thumb').forEach(resolveThumb);
    }

    document.addEventListener('DOMContentLoaded', init);

    return { login, requestThumbnail };

})();

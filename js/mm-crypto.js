/**
 * MM Crypto - 站点唯一的密码数据加解密实现
 *
 * 算法：PBKDF2(SHA-256, 100000 次) 派生 AES-256-CBC 密钥
 * 格式：base64( salt[16] || iv[16] || ciphertext )
 *
 * 说明：本文件是 js/manager-common.js 中 ManagerCommon.AES 与
 * index/MM-secure.html 中 AESUtil 的合并结果，算法与输出保持逐字节一致，
 * 因此已有的 data/MM.json 无需重新加密即可继续解密。
 */
(function() {
    const SALT_LENGTH = 16;
    const IV_LENGTH = 16;
    const ITERATIONS = 100000;
    const KEY_LENGTH = 256;
    const PASSWORD_LENGTH = 32;

    const normalizePassword = (password) => String(password == null ? '' : password).padEnd(PASSWORD_LENGTH, ' ');

    // 分块编码，避免大payload 触发 String.fromCharCode 的调用栈溢出
    const toBase64 = (bytes) => {
        let binary = '';
        const chunkSize = 0x8000;
        for (let i = 0; i < bytes.length; i += chunkSize) {
            binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
        }
        return btoa(binary);
    };

    const fromBase64 = (base64) => Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

    const deriveKey = async (password, salt, usage) => {
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(normalizePassword(password)),
            { name: 'PBKDF2' },
            false,
            ['deriveKey']
        );
        return crypto.subtle.deriveKey(
            { name: 'PBKDF2', salt: salt, iterations: ITERATIONS, hash: 'SHA-256' },
            keyMaterial,
            { name: 'AES-CBC', length: KEY_LENGTH },
            false,
            [usage]
        );
    };

    const MMCrypto = {
        async encrypt(text, password) {
            const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
            const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
            const key = await deriveKey(password, salt, 'encrypt');
            const encrypted = new Uint8Array(
                await crypto.subtle.encrypt({ name: 'AES-CBC', iv }, key, new TextEncoder().encode(text))
            );

            const combined = new Uint8Array(salt.length + iv.length + encrypted.length);
            combined.set(salt, 0);
            combined.set(iv, salt.length);
            combined.set(encrypted, salt.length + iv.length);

            return toBase64(combined);
        },

        async decrypt(encryptedData, password) {
            const combined = fromBase64(encryptedData);
            const salt = combined.slice(0, SALT_LENGTH);
            const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
            const key = await deriveKey(password, salt, 'decrypt');
            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-CBC', iv },
                key,
                combined.slice(SALT_LENGTH + IV_LENGTH)
            );
            return new TextDecoder().decode(decrypted);
        }
    };

    window.MMCrypto = MMCrypto;
})();

// WebAuthn (Fingerprint/Biometric) Authentication
// Provides fast, secure biometric login on supported devices

export interface WebAuthnCredential {
  id: string;
  publicKey: string;
  credentialName: string;
  createdAt: string;
  lastUsedAt?: string;
}

const WEBAUTHN_CREDENTIALS_KEY = "webauthn_credentials";
const WEBAUTHN_REGISTERED_KEY = "webauthn_registered";

/**
 * Check if WebAuthn is supported on this device
 */
export function isWebAuthnSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    !!(
      window.PublicKeyCredential ||
      (window as any).webkitPublicKeyCredential
    )
  );
}

/**
 * Register a new biometric credential for this user
 */
export async function registerBiometric(
  userId: string,
  userName: string
): Promise<WebAuthnCredential | null> {
  if (!isWebAuthnSupported()) {
    throw new Error("WebAuthn is not supported on this device");
  }

  try {
    const PublicKeyCredential =
      window.PublicKeyCredential || (window as any).webkitPublicKeyCredential;
    const isUserVerifyingPlatformAuthenticatorAvailable =
      PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable;

    if (isUserVerifyingPlatformAuthenticatorAvailable) {
      const available =
        await isUserVerifyingPlatformAuthenticatorAvailable();
      if (!available) {
        throw new Error("Biometric authentication not available on this device");
      }
    }

    // Create credential options
    const options: PublicKeyCredentialCreationOptions = {
      challenge: new Uint8Array(32),
      rp: {
        name: "Candid",
        id: window.location.hostname,
      },
      user: {
        id: new Uint8Array(Buffer.from(userId)),
        name: userName,
        displayName: userName,
      },
      pubKeyCredParams: [
        { alg: -7, type: "public-key" }, // ES256
        { alg: -257, type: "public-key" }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "preferred",
        residentKey: "preferred",
      },
      timeout: 60000,
      attestation: "none",
    };

    const credential = await PublicKeyCredential.create({
      publicKey: options,
    });

    if (!credential) return null;

    const credentialData: WebAuthnCredential = {
      id: credential.id,
      publicKey: btoa(JSON.stringify(credential.response)),
      credentialName: `${new Date().toLocaleDateString()} - ${navigator.platform}`,
      createdAt: new Date().toISOString(),
    };

    // Store in local storage
    const stored = localStorage.getItem(WEBAUTHN_CREDENTIALS_KEY);
    const credentials: WebAuthnCredential[] = stored ? JSON.parse(stored) : [];
    credentials.push(credentialData);
    localStorage.setItem(WEBAUTHN_CREDENTIALS_KEY, JSON.stringify(credentials));
    localStorage.setItem(WEBAUTHN_REGISTERED_KEY, "true");

    return credentialData;
  } catch (error) {
    console.error("[biometrics] Registration failed:", error);
    return null;
  }
}

/**
 * Authenticate using registered biometric
 */
export async function authenticateWithBiometric(
  userId: string
): Promise<boolean> {
  if (!isWebAuthnSupported()) {
    return false;
  }

  try {
    const stored = localStorage.getItem(WEBAUTHN_CREDENTIALS_KEY);
    if (!stored) return false;

    const credentials: WebAuthnCredential[] = JSON.parse(stored);
    if (credentials.length === 0) return false;

    const PublicKeyCredential =
      window.PublicKeyCredential || (window as any).webkitPublicKeyCredential;

    const options: PublicKeyCredentialRequestOptions = {
      challenge: new Uint8Array(32),
      timeout: 60000,
      userVerification: "preferred",
    };

    const assertion = await PublicKeyCredential.get({
      publicKey: options,
    });

    if (!assertion) return false;

    // Mark as recently used
    const cred = credentials.find((c) => c.id === assertion.id);
    if (cred) {
      cred.lastUsedAt = new Date().toISOString();
      localStorage.setItem(WEBAUTHN_CREDENTIALS_KEY, JSON.stringify(credentials));
    }

    return true;
  } catch (error) {
    console.error("[biometrics] Authentication failed:", error);
    return false;
  }
}

/**
 * Check if user has biometric credentials registered
 */
export function hasBiometricCredentials(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(WEBAUTHN_REGISTERED_KEY) === "true";
}

/**
 * Get all registered biometric credentials
 */
export function getBiometricCredentials(): WebAuthnCredential[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(WEBAUTHN_CREDENTIALS_KEY);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Remove a biometric credential
 */
export function removeBiometricCredential(credentialId: string): void {
  if (typeof window === "undefined") return;
  const stored = localStorage.getItem(WEBAUTHN_CREDENTIALS_KEY);
  if (!stored) return;

  const credentials: WebAuthnCredential[] = JSON.parse(stored).filter(
    (c: WebAuthnCredential) => c.id !== credentialId
  );

  if (credentials.length === 0) {
    localStorage.removeItem(WEBAUTHN_REGISTERED_KEY);
    localStorage.removeItem(WEBAUTHN_CREDENTIALS_KEY);
  } else {
    localStorage.setItem(WEBAUTHN_CREDENTIALS_KEY, JSON.stringify(credentials));
  }
}

/**
 * Clear all biometric credentials
 */
export function clearBiometricCredentials(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(WEBAUTHN_REGISTERED_KEY);
  localStorage.removeItem(WEBAUTHN_CREDENTIALS_KEY);
}

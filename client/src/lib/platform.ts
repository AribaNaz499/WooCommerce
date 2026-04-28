// Your existing functions (jo already hain) - UNCHANGED
export const isIosTouchDevice = () => {
  if (typeof navigator === "undefined") return false;

  const ua = navigator.userAgent || "";
  const platform = navigator.platform || "";
  const maxTouchPoints = navigator.maxTouchPoints || 0;

  return /iPad|iPhone|iPod/i.test(ua) || (platform === "MacIntel" && maxTouchPoints > 1);
};

export const isSafariBrowser = () => {
  if (typeof navigator === "undefined") return false;

  const ua = navigator.userAgent || "";
  return /Safari/i.test(ua) && !/Chrome|CriOS|Chromium|FxiOS|Firefox|EdgiOS|EdgA|OPiOS|OPR|Android/i.test(ua);
};

// ============ ONLY ADD THESE IF THEY DON'T EXIST ============
// Agar yeh functions already hain toh mat add karo

export const isIOSDevice = () => {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /iPad|iPhone|iPod/i.test(ua);
};

export const getBrowserInfo = () => {
  if (typeof navigator === "undefined") return { name: "unknown", version: 0, isSafari: false, isIOS: false };
  
  const ua = navigator.userAgent || "";
  const isSafari = isSafariBrowser();
  const isIOS = isIOSDevice();
  
  let name = "unknown";
  let version = 0;
  
  if (isSafari) {
    name = "Safari";
    const match = ua.match(/Version\/(\d+)\./);
    version = match ? parseInt(match[1]) : 0;
  } else if (ua.includes("Chrome")) {
    name = "Chrome";
    const match = ua.match(/Chrome\/(\d+)\./);
    version = match ? parseInt(match[1]) : 0;
  } else if (ua.includes("Firefox")) {
    name = "Firefox";
    const match = ua.match(/Firefox\/(\d+)\./);
    version = match ? parseInt(match[1]) : 0;
  }
  
  return { name, version, isSafari, isIOS };
};
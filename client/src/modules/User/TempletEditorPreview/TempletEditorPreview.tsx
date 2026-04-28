import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DecalGeometry } from "three/examples/jsm/geometries/DecalGeometry.js";
import { useLocation, useNavigate } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import { ArrowBackIos } from "@mui/icons-material";
import { toPng } from "html-to-image";
import LandingButton from "../../../components/LandingButton/LandingButton";
import { USER_ROUTES } from "../../../constant/route";
import { resolveSlidesScopeCandidates, saveSlidesToScopes } from "../../../lib/slidesScope";
import { isIosTouchDevice } from "../../../lib/platform";
import { saveSubscriptionPreviewPayload } from "../../../lib/subscriptionPreview";
import toast from "react-hot-toast";
import {
  collectTemplateSlideFonts,
  renderTemplateSlideToCanvas,
  type TemplateSlide,
} from "../../../lib/templateSlideCanvas";
import {
  buildGoogleFontsUrls,
  ensureGoogleFontsLoaded,
  getGoogleFontEmbedCss,
  loadGoogleFontsOnce,
} from "../../../constant/googleFonts";

const MUG_URL = "/assets/modals/tea_cup.glb";
const MUG_TEXTURE_VERTICAL_OFFSET_PX = -10;
const MUG_TEXT_VERTICAL_OFFSET_PX = -20;

let container: HTMLDivElement | null;
let camera: THREE.PerspectiveCamera;
let scene: THREE.Scene;
let renderer: THREE.WebGLRenderer;
let orbitControls: OrbitControls;
let colorSelector: HTMLInputElement | null;
let mesh: THREE.Mesh | undefined;
let decalGeometry: DecalGeometry | undefined;
let material:
  | THREE.MeshStandardMaterial
  | THREE.MeshPhysicalMaterial
  | THREE.MeshBasicMaterial
  | null = null;

let currentTextureUrl: string | null = null;
let currentTextureCanvas: HTMLCanvasElement | null = null;

const PREVIEW_SLIDES_STORAGE_KEY = "templ_preview_slides";
const PREVIEW_MUG_IMAGE_STORAGE_KEY = "templ_preview_mug_image";

const SRGB = (THREE as any).SRGBColorSpace ?? "srgb";

const createTextureFromCanvas = (canvas: HTMLCanvasElement) => {
  const texture = new THREE.CanvasTexture(canvas);
  if ((texture as any).encoding !== undefined) {
    (texture as any).encoding = SRGB;
  } else if ((texture as any).colorSpace !== undefined) {
    (texture as any).colorSpace = SRGB;
  }
  texture.wrapS = THREE.RepeatWrapping;
  texture.repeat.x = -1;
  texture.offset.x = 1;
  texture.flipY = true;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
};

const onWindowResize = () => {
  if (!container || !camera || !renderer) return;
  camera.aspect = container.offsetWidth / container.offsetHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.offsetWidth, container.offsetHeight);
};

const convertImageToTexture = (image: string): THREE.Texture => {
  const loader = new THREE.TextureLoader();
  const texture = loader.load(image, (tex) => {
    const img = tex.image as HTMLImageElement;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = img.width;
    canvas.height = img.height;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(img, 0, MUG_TEXTURE_VERTICAL_OFFSET_PX);
    ctx.restore();

    (tex as any).image = canvas;
    tex.needsUpdate = true;
    if ((tex as any).encoding !== undefined) {
      (tex as any).encoding = SRGB;
    } else if ((tex as any).colorSpace !== undefined) {
      (tex as any).colorSpace = SRGB;
    }
  });


  if ((texture as any).encoding !== undefined) {
    (texture as any).encoding = SRGB;
  } else if ((texture as any).colorSpace !== undefined) {
    (texture as any).colorSpace = SRGB;
  }

  return texture;
};

const mirrorCanvasForMug = (source: HTMLCanvasElement) => {
  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return source;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(source, 0, MUG_TEXTURE_VERTICAL_OFFSET_PX);
  ctx.restore();
  return canvas;
};

const init = () => {
  if (!container) return;

  scene = new THREE.Scene();

  console.log(mesh,)
  console.log(decalGeometry,)
  console.log(material,)

  camera = new THREE.PerspectiveCamera(
    20,
    container.offsetWidth / container.offsetHeight,
    1e-5,
    1e10
  );
  scene.add(camera);

  const hemi = new THREE.HemisphereLight(0xffffff, 0x222222, 0.5);
  scene.add(hemi);

  // RIGHT side light
  const rightLight = new THREE.DirectionalLight(0xffffff, 2);
  rightLight.position.set(5, 3, 5); // x > 0 → from the right
  scene.add(rightLight);

  // LEFT side light
  const leftLight = new THREE.DirectionalLight(0xffffff, 1);
  leftLight.position.set(-5, 3, 5); // x < 0 → from the left
  scene.add(leftLight);

  // TOP light
  const topLight = new THREE.DirectionalLight(0xffffff, 1);
  topLight.position.set(0, 8, 0); // y > 0 → from above
  scene.add(topLight);

  const hemispheric = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
  scene.add(hemispheric);

  [rightLight, leftLight, topLight].forEach((l) => {
    l.castShadow = true;
  });


  const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
  scene.add(directionalLight);

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    logarithmicDepthBuffer: true,
    alpha: false,
  });
  renderer.setClearColor(0xffffff, 1);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(container.offsetWidth, container.offsetHeight);
  if ((renderer as any).outputEncoding !== undefined) {
    (renderer as any).outputEncoding = SRGB;
  } else if ((renderer as any).outputColorSpace !== undefined) {
    (renderer as any).outputColorSpace = SRGB;
  }

  container.appendChild(renderer.domElement);

  const loader = new GLTFLoader();
  const cameraPos = new THREE.Vector3(-0.2, 0.4, 1.4);

  orbitControls = new OrbitControls(camera, renderer.domElement);
  orbitControls.enableDamping = true;
  orbitControls.dampingFactor = 0.07;
  orbitControls.rotateSpeed = 1.25;
  orbitControls.panSpeed = 1.25;
  orbitControls.screenSpacePanning = true;
  orbitControls.autoRotate = true;

  loader.load(
    MUG_URL,
    (gltf) => {
      const object = gltf.scene;

      const pmremGenerator = new THREE.PMREMGenerator(renderer as any);
      pmremGenerator.compileEquirectangularShader();

      object.updateMatrixWorld();
      const boundingBox = new THREE.Box3().setFromObject(object);
      const modelSizeVec3 = new THREE.Vector3();
      boundingBox.getSize(modelSizeVec3);
      const modelSize = modelSizeVec3.length();
      const modelCenter = new THREE.Vector3();
      boundingBox.getCenter(modelCenter);

      orbitControls.reset();
      orbitControls.maxDistance = modelSize * 50;

      object.position.x = -modelCenter.x;
      object.position.y = -modelCenter.y;
      object.position.z = -modelCenter.z;

      camera.position.copy(modelCenter);
      camera.position.x += modelSize * cameraPos.x;
      camera.position.y += modelSize * cameraPos.y;
      camera.position.z += modelSize * cameraPos.z;
      camera.near = modelSize / 100;
      camera.far = modelSize * 100;
      camera.updateProjectionMatrix();
      camera.lookAt(modelCenter);

      object.traverse((obj) => {
        if (!(obj instanceof THREE.Mesh)) return;

        if (obj.name === "Mug_Porcelain_PBR001_0") {
          const baseMaterial =
            obj.material as
            | THREE.MeshStandardMaterial
            | THREE.MeshPhysicalMaterial
            | THREE.MeshBasicMaterial;

          material = baseMaterial;
          mesh = obj;

          const tex = currentTextureCanvas
            ? createTextureFromCanvas(currentTextureCanvas)
            : currentTextureUrl
            ? convertImageToTexture(currentTextureUrl)
            : null;

          if (tex) {
            tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
            baseMaterial.map = tex;

            if ("color" in baseMaterial && baseMaterial.color instanceof THREE.Color) {
              baseMaterial.color.set(0xffffff);
            }

            baseMaterial.transparent = false;
            baseMaterial.alphaTest = 0;
            baseMaterial.opacity = 1;

            if (
              baseMaterial instanceof THREE.MeshStandardMaterial ||
              baseMaterial instanceof THREE.MeshPhysicalMaterial
            ) {
              baseMaterial.metalness = 0;
              baseMaterial.roughness = Math.min(
                1,
                Math.max(0, baseMaterial.roughness)
              );
            }

            baseMaterial.needsUpdate = true;
          }
        } else if (obj.name === "Mug_Porcelain_PBR002_0") {
          const mat = obj.material as THREE.MeshStandardMaterial;
          mat.color.set("white");
          mat.needsUpdate = true;

          if (colorSelector) {
            colorSelector.addEventListener("input", (event) => {
              const target = event.target as HTMLInputElement;
              mat.color.set(target.value);
              mat.needsUpdate = true;
            });
          }
        }
      });

      scene.add(object);
      onWindowResize();
    },
    undefined,
    (error) => {
      console.error("Error loading mug GLB:", error);
    }
  );
};

// captured image 
function captureMugPreviewJpg(): string | null {
  if (!renderer) return null;

  // ensure latest frame rendered
  renderer.render(scene, camera);

  const canvas = renderer.domElement as HTMLCanvasElement;
  return canvas.toDataURL("image/jpeg", 0.95);
}

const normalizeFontFamily = (value?: string | null) => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const quoted = raw.match(/['"]([^'"]+)['"]/);
  if (quoted?.[1]) return quoted[1].trim();
  const first = raw.split(",")[0]?.trim() ?? "";
  return first.replace(/^['"]|['"]$/g, "").trim();
};

const firstDefinedValue = (...values: any[]) => {
  for (const value of values) {
    if (value === 0 || value === false) return value;
    if (typeof value === "string") {
      if (value.trim()) return value;
      continue;
    }
    if (value != null) return value;
  }
  return undefined;
};

const resolveTextFontFamily = (entry: any) =>
  normalizeFontFamily(
    entry?.fontFamily ??
      entry?.font_family ??
      entry?.["font-family"] ??
      entry?.fontFamily1 ??
      entry?.fontFamily2 ??
      entry?.fontFamily3 ??
      entry?.fontFamily4 ??
      entry?.style?.fontFamily ??
      entry?.style?.font_family ??
      entry?.style?.["font-family"] ??
      "",
  );

const resolveTextWeight = (entry: any): string | number => {
  const raw = firstDefinedValue(
    entry?.fontWeight,
    entry?.font_weight,
    entry?.["font-weight"],
    entry?.style?.fontWeight,
    entry?.style?.font_weight,
    entry?.style?.["font-weight"],
  );
  if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) return raw;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return entry?.bold ? 700 : 400;
    const weight = Number(trimmed);
    if (Number.isFinite(weight) && weight > 0) return weight;
    return trimmed;
  }
  return entry?.bold ? 700 : 400;
};

const resolveTextStyle = (entry: any): string => {
  const raw = firstDefinedValue(
    entry?.fontStyle,
    entry?.font_style,
    entry?.["font-style"],
    entry?.style?.fontStyle,
    entry?.style?.font_style,
    entry?.style?.["font-style"],
  );
  if (typeof raw === "string") return raw.trim() || (entry?.italic ? "italic" : "normal");
  return entry?.italic ? "italic" : "normal";
};

const resolveTextDecoration = (entry: any): string => {
  const raw = firstDefinedValue(
    entry?.textDecoration,
    entry?.text_decoration,
    entry?.["text-decoration"],
    entry?.style?.textDecoration,
    entry?.style?.text_decoration,
    entry?.style?.["text-decoration"],
  );
  if (typeof raw === "string") return raw.trim() || "none";
  if (entry?.underline) return "underline";
  return "none";
};

const resolveTextColor = (entry: any): string =>
  String(firstDefinedValue(entry?.color, entry?.fill, entry?.style?.color, entry?.style?.fill, "#111111"));

const resolveTextRotation = (entry: any): number =>
  Number(firstDefinedValue(entry?.rotation, entry?.rotate, entry?.style?.rotation, entry?.style?.rotate, 0)) || 0;

const resolveTextCurve = (entry: any): number =>
  Number(firstDefinedValue(entry?.curve, entry?.arc, entry?.style?.curve, entry?.style?.arc, 0)) || 0;

const TRANSPARENT_PIXEL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result || ""));
    fr.onerror = reject;
    fr.readAsDataURL(blob);
  });

const toDataUrlSafe = async (src: string): Promise<string> => {
  if (!src || src.startsWith("data:")) return src;
  try {
    const absolute = src.startsWith("/") ? `${window.location.origin}${src}` : src;
    const resp = await fetch(absolute, { mode: "cors" });
    if (!resp.ok) return src;
    const blob = await resp.blob();
    return await blobToDataUrl(blob);
  } catch {
    return src;
  }
};

const dataUrlToCanvas = (dataUrl: string) =>
  new Promise<HTMLCanvasElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, img.naturalWidth || img.width);
      canvas.height = Math.max(1, img.naturalHeight || img.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context not available"));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas);
    };
    img.onerror = () => reject(new Error("Failed to decode captured slide image"));
    img.src = dataUrl;
  });

const waitForNodeAssets = async (node: HTMLElement) => {
  const images = Array.from(node.querySelectorAll("img"));
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          const element = img as HTMLImageElement;
          if (element.complete) {
            resolve();
            return;
          }
          const done = () => resolve();
          element.addEventListener("load", done, { once: true });
          element.addEventListener("error", done, { once: true });
        }),
    ),
  );
  if ((document as any)?.fonts?.ready) {
    try {
      await (document as any).fonts.ready;
    } catch {}
  }
};

const waitForFontsReady = async (families: string[]) => {
  const fontApi: any = (document as any)?.fonts;
  if (!fontApi) return;
  if (families.length) {
    await Promise.all(
      families.flatMap((family) => [
        fontApi.load(`400 24px "${family}"`).catch(() => null),
        fontApi.load(`700 24px "${family}"`).catch(() => null),
        fontApi.load(`italic 400 24px "${family}"`).catch(() => null),
        fontApi.load(`italic 700 24px "${family}"`).catch(() => null),
      ]),
    );
  }
  await fontApi.ready?.catch(() => null);
};

const collectTemplateFontLoadSpecs = (slides: TemplateSlide[]) => {
  const specs = new Set<string>();
  (slides ?? []).forEach((slide) => {
    (slide?.elements ?? []).forEach((element) => {
      if (element?.type !== "text") return;
      const text = element as any;
      const family = resolveTextFontFamily(text);
      if (!family) return;
      const size = Math.max(12, Number(text?.fontSize ?? 24));
      const weight = resolveTextWeight(text);
      const style = resolveTextStyle(text);
      specs.add(`${style} ${weight} ${size}px "${family.replace(/"/g, '\\"')}"`);
    });
  });
  return Array.from(specs);
};

const waitForFontSpecsReady = async (fontSpecs: string[]) => {
  const fontApi: any = (document as any)?.fonts;
  if (!fontApi || !fontSpecs.length) return;
  await Promise.all(fontSpecs.map((spec) => fontApi.load(spec).catch(() => null)));
  await fontApi.ready?.catch(() => null);
};

const prepareSlideAssetsForCanvas = async (slide?: TemplateSlide | null): Promise<TemplateSlide | null> => {
  if (!slide) return null;
  const elements = await Promise.all(
    (slide.elements ?? []).map(async (element) => {
      if (element.type !== "image" && element.type !== "sticker") return element;
      const src = String((element as any).src ?? "");
      return {
        ...element,
        src: (await toDataUrlSafe(src)) || src || TRANSPARENT_PIXEL,
      };
    }),
  );

  return {
    ...slide,
    elements,
  };
};

const captureNodeToCanvas = async (
  node: HTMLElement,
  opts: { width: number; height: number; pixelRatio?: number; fontFamilies?: string[] },
) => {
  const width = Math.max(1, Math.round(opts.width));
  const height = Math.max(1, Math.round(opts.height));
  const pixelRatio = Math.max(1, Number(opts.pixelRatio ?? 3));
  const fontFamilies = Array.from(new Set((opts.fontFamilies ?? []).filter(Boolean)));

  const clone = node.cloneNode(true) as HTMLElement;
  clone.style.width = `${width}px`;
  clone.style.height = `${height}px`;

  const sandbox = document.createElement("div");
  sandbox.style.position = "fixed";
  sandbox.style.left = "-10000px";
  sandbox.style.top = "-10000px";
  sandbox.style.zIndex = "-1";
  sandbox.style.pointerEvents = "none";
  sandbox.appendChild(clone);
  document.body.appendChild(sandbox);

  try {
    const imgs = Array.from(clone.querySelectorAll("img")) as HTMLImageElement[];
    await Promise.all(
      imgs.map(async (img) => {
        const src = img.getAttribute("src") || "";
        const safeSrc = await toDataUrlSafe(src);
        img.setAttribute("src", safeSrc || src || TRANSPARENT_PIXEL);
        img.setAttribute("crossorigin", "anonymous");
      }),
    );

    if (fontFamilies.length) {
      loadGoogleFontsOnce(buildGoogleFontsUrls(fontFamilies));
    }
    await waitForFontsReady(fontFamilies);
    await waitForNodeAssets(clone);
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

    const fontEmbedCSS =
      fontFamilies.length > 0 ? await getGoogleFontEmbedCss(fontFamilies).catch(() => "") : "";

    const dataUrl = await toPng(clone, {
      pixelRatio,
      backgroundColor: "#ffffff",
      cacheBust: true,
      imagePlaceholder: TRANSPARENT_PIXEL,
      width,
      height,
      style: { transform: "none" },
      fontEmbedCSS: fontEmbedCSS || undefined,
      skipFonts: false,
    });

    return await dataUrlToCanvas(dataUrl);
  } finally {
    sandbox.remove();
  }
};

const readPreviewSlidesFromSessionStorage = (): TemplateSlide[] => {
  if (typeof sessionStorage === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(PREVIEW_SLIDES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as TemplateSlide[]) : [];
  } catch {
    return [];
  }
};

const readPreviewMugImageFromSessionStorage = (): string | null => {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PREVIEW_MUG_IMAGE_STORAGE_KEY);
    return raw && typeof raw === "string" ? raw : null;
  } catch {
    return null;
  }
};

const offsetSlideTextY = (slide: TemplateSlide, offsetPx: number): TemplateSlide => {
  if (!offsetPx) return slide;
  return {
    ...slide,
    elements: (slide.elements ?? []).map((el: any) => {
      if (el?.type !== "text") return el;
      return {
        ...el,
        y: Number(el?.y ?? 0) + offsetPx,
      };
    }),
  };
};


const TempletEditorPreview: React.FC = () => {
  const { state } = useLocation() as {
    state?: {
      slides?: TemplateSlide[];
      mugImage?: string;
      config?: { mmWidth?: number; mmHeight?: number };
      canvasPx?: { w?: number; h?: number };
    };
  };
  const flatSlideRef = useRef<HTMLDivElement | null>(null);
  const isSafariTextureCapture = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    const ua = navigator.userAgent || "";
    const isSafari =
      /Safari/i.test(ua) && !/Chrome|CriOS|Chromium|FxiOS|Firefox|EdgiOS|EdgA|OPiOS|OPR|Android/i.test(ua);
    return isSafari && isIosTouchDevice();
  }, []);
  const routeSlides = useMemo(() => (Array.isArray(state?.slides) ? (state?.slides as TemplateSlide[]) : []), [state?.slides]);
  const storedSlides = useMemo(() => readPreviewSlidesFromSessionStorage(), []);
  const previewSlides = useMemo(
    () => (isSafariTextureCapture && storedSlides.length ? storedSlides : routeSlides.length ? routeSlides : storedSlides),
    [isSafariTextureCapture, routeSlides, storedSlides],
  );
  const textureSlide = useMemo(() => {
    const first = previewSlides[0];
    if (!first) return null;
    return isSafariTextureCapture
      ? offsetSlideTextY(first, MUG_TEXT_VERTICAL_OFFSET_PX)
      : first;
  }, [isSafariTextureCapture, previewSlides]);
  const routeMugImage = useMemo(
    () => (typeof state?.mugImage === "string" && state.mugImage ? state.mugImage : null),
    [state?.mugImage],
  );
  const storedMugImage = useMemo(() => readPreviewMugImageFromSessionStorage(), []);
  const mugImageSrc = useMemo(
    () => routeMugImage || storedMugImage || null,
    [routeMugImage, storedMugImage],
  );
  const [flatDesignImage, setFlatDesignImage] = useState<string | null>(mugImageSrc ?? null);
  const shouldUseProvidedMugImage = useMemo(
    // On Safari/iOS, prefer rendering from slide JSON when available.
    // `mugImage` is kept as fallback when slide payload is missing.
    () => Boolean(mugImageSrc) && isSafariTextureCapture && previewSlides.length === 0,
    [isSafariTextureCapture, mugImageSrc, previewSlides.length],
  );

  const baseWidth = useMemo(
    () => Math.max(1, Number(state?.canvasPx?.w ?? state?.config?.mmWidth ?? 228)),
    [state?.canvasPx?.w, state?.config?.mmWidth],
  );
  const baseHeight = useMemo(
    () => Math.max(1, Number(state?.canvasPx?.h ?? state?.config?.mmHeight ?? 88.9)),
    [state?.canvasPx?.h, state?.config?.mmHeight],
  );

  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const containerRef = useRef<HTMLDivElement | null>(null);
  const colorRef = useRef<HTMLInputElement | null>(null);
  const animationFrameId = useRef<number | null>(null);

  const animate = useCallback(() => {
    animationFrameId.current = requestAnimationFrame(animate);
    if (orbitControls && renderer && scene && camera) {
      orbitControls.update();
      renderer.render(scene, camera);
    }
  }, []);

  const renderFlatSlide = useCallback((slide?: TemplateSlide) => {
    if (!slide) return null;
    const ordered = [...(slide.elements || [])].sort((a, b) => {
      const zA = Number(a?.zIndex ?? 1) + (a?.type === "text" ? 100000 : 0);
      const zB = Number(b?.zIndex ?? 1) + (b?.type === "text" ? 100000 : 0);
      return zA - zB;
    });

    return (
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          bgcolor: slide.bgColor ?? "#ffffff",
        }}
      >
        {ordered.map((el: any) => {
          const baseStyle: any = {
            position: "absolute",
            left: el.x,
            top: el.y,
            width: el.width,
            height: el.height,
            zIndex: el.zIndex ?? 1,
          };

          if (el.type === "image") {
            return (
              <Box
                key={el.id}
                component="img"
                src={el.src}
                alt=""
                crossOrigin="anonymous"
                sx={{
                  ...baseStyle,
                  objectFit: "cover",
                  objectPosition: "center",
                  display: "block",
                  bgcolor: "transparent",
                }}
              />
            );
          }

          if (el.type === "sticker") {
            return (
              <Box
                key={el.id}
                component="img"
                src={el.src}
                alt=""
                crossOrigin="anonymous"
                sx={{
                  ...baseStyle,
                  objectFit: "contain",
                  objectPosition: "center",
                  display: "block",
                  bgcolor: "transparent",
                }}
              />
            );
          }

          if (el.type === "text") {
            const align = el.align ?? "center";
            const justify =
              align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center";
            const rotation = resolveTextRotation(el);
            const safeRotation = Number.isFinite(rotation) ? rotation : 0;
            const curveRaw = resolveTextCurve(el);
            const curve = Number.isFinite(curveRaw)
              ? Math.max(-200, Math.min(200, curveRaw))
              : 0;
            const hasCurve = Math.abs(curve) > 0.5;
            const safeW = Math.max(1, Number(el?.width ?? 1));
            const safeH = Math.max(1, Number(el?.height ?? 1));
            const curvePx = (curve / 100) * (safeH / 2);
            const midY = safeH / 2;
            const textAnchor = align === "left" ? "start" : align === "right" ? "end" : "middle";
            const startOffset = align === "left" ? "0%" : align === "right" ? "100%" : "50%";
            const curveId = `mug-preview-curve-${slide?.id ?? "s"}-${el?.id ?? "t"}`;
            const lineHeight = Math.max(1, Number(el?.lineHeight ?? el?.line_height ?? 1.16));
            const fontFamily = resolveTextFontFamily(el) || "Arial";
            const fontWeight = resolveTextWeight(el);
            const fontStyle = resolveTextStyle(el);
            const textDecoration = resolveTextDecoration(el);
            const textColor = resolveTextColor(el);

            return (
              <Box
                key={el.id}
                sx={{
                  ...baseStyle,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: justify,
                  textAlign: align,
                  transform: safeRotation ? `rotate(${safeRotation}deg)` : "none",
                  transformOrigin: "center",
                  fontWeight,
                  fontStyle,
                  fontSize: el.fontSize,
                  fontFamily,
                  color: textColor,
                  textDecoration,
                  whiteSpace: "pre-wrap",
                  overflowWrap: "break-word",
                  wordBreak: "break-word",
                  lineHeight: String(lineHeight),
                  overflow: "visible",
                }}
              >
                {hasCurve ? (
                  <Box
                    component="svg"
                    viewBox={`0 0 ${safeW} ${safeH}`}
                    sx={{ width: "100%", height: "100%", overflow: "visible", display: "block" }}
                  >
                    <defs>
                      <path
                        id={curveId}
                        d={`M 0 ${midY} Q ${safeW / 2} ${midY - curvePx} ${safeW} ${midY}`}
                      />
                    </defs>
                    <text
                      fill={textColor}
                      fontFamily={fontFamily}
                      fontSize={Number(el?.fontSize ?? 20)}
                      fontWeight={fontWeight}
                      fontStyle={fontStyle}
                      textDecoration={textDecoration}
                      textAnchor={textAnchor}
                      dominantBaseline="middle"
                      direction="ltr"
                      unicodeBidi="plaintext"
                    >
                      <textPath
                        href={`#${curveId}`}
                        startOffset={startOffset}
                        style={{
                          fill: textColor,
                          fontFamily,
                          fontSize: Number(el?.fontSize ?? 20),
                          fontWeight,
                          fontStyle,
                          textDecoration,
                        }}
                      >
                        {String(el?.text ?? "")}
                      </textPath>
                    </text>
                  </Box>
                ) : (
                  String(el?.text ?? "")
                )}
              </Box>
            );
          }

          return null;
        })}
      </Box>
    );
  }, []);

  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      container = containerRef.current;
      colorSelector = colorRef.current;

      currentTextureUrl = mugImageSrc;
      currentTextureCanvas = null;

      try {
        if (shouldUseProvidedMugImage && mugImageSrc) {
          try {
            const safeSrc = (await toDataUrlSafe(String(mugImageSrc))) || String(mugImageSrc);
            if (cancelled) return;
            setFlatDesignImage(safeSrc);
            currentTextureUrl = safeSrc;
            const sourceCanvas = await dataUrlToCanvas(safeSrc);
            if (cancelled) return;
            currentTextureCanvas = mirrorCanvasForMug(sourceCanvas);
          } catch {
            // If provided image cannot be decoded, continue with slide-based render path.
          }
        }

        if (!currentTextureCanvas && textureSlide) {
          const slidesForTextMetrics = [textureSlide];
          const fonts = collectTemplateSlideFonts(slidesForTextMetrics);
          const fontSpecs = collectTemplateFontLoadSpecs(slidesForTextMetrics);
          if (fonts.length) {
            const urls = buildGoogleFontsUrls(fonts);
            loadGoogleFontsOnce(urls);
            await ensureGoogleFontsLoaded(urls);
          }
          await waitForFontSpecsReady(fontSpecs);
          if ((document as any)?.fonts?.ready) {
            try {
              await (document as any).fonts.ready;
            } catch {}
          }

          await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

          let flatCanvas: HTMLCanvasElement | null = null;
          if (!isSafariTextureCapture) {
            const slideNode = flatSlideRef.current;
            if (slideNode) {
              try {
                flatCanvas = await captureNodeToCanvas(slideNode, {
                  width: baseWidth,
                  height: baseHeight,
                  pixelRatio: 3,
                  fontFamilies: fonts,
                });
              } catch (error) {
                console.error("Mug DOM capture failed, falling back to canvas renderer:", error);
              }
            }
          }

          if (!flatCanvas) {
            const preparedSlide = (await prepareSlideAssetsForCanvas(textureSlide)) ?? textureSlide;
            flatCanvas = await renderTemplateSlideToCanvas(preparedSlide, {
              width: baseWidth,
              height: baseHeight,
              pixelRatio: 3,
              backgroundColor: "#ffffff",
            });
          }

          if (cancelled) return;
          currentTextureCanvas = mirrorCanvasForMug(flatCanvas);

          try {
            const flatDataUrl = flatCanvas.toDataURL("image/png");
            setFlatDesignImage(flatDataUrl);
            currentTextureUrl = flatDataUrl;
          } catch {
            // Cross-origin assets can taint the canvas on Safari.
            // Keep canvas texture rendering alive even when exporting a data URL is blocked.
            setFlatDesignImage((prev) => prev || mugImageSrc || null);
            currentTextureUrl = mugImageSrc || currentTextureUrl;
          }
        }
      } catch (error) {
        // Never let preview bootstrap fail to a blank screen on Safari.
        console.error("Mug preview bootstrap failed; using direct texture fallback:", error);
        if (!cancelled && mugImageSrc && !currentTextureCanvas) {
          const fallbackSrc = String(mugImageSrc);
          setFlatDesignImage(fallbackSrc);
          currentTextureUrl = fallbackSrc;
        }
      }

      if (cancelled) return;
      try {
        init();
        animate();
      } catch (error) {
        console.error("Mug preview init failed:", error);
      }

      const resizeHandler = () => onWindowResize();
      window.addEventListener("resize", resizeHandler);

      return () => {
        window.removeEventListener("resize", resizeHandler);
      };
    };

    let detachResize: (() => void) | undefined;
    void boot().then((cleanup) => {
      detachResize = cleanup;
    });

    return () => {
      cancelled = true;
      detachResize?.();
      if (animationFrameId.current !== null)
        cancelAnimationFrame(animationFrameId.current);
      if (renderer) renderer.dispose();
      if (orbitControls) orbitControls.dispose();

      container = null;
      colorSelector = null;
      mesh = undefined;
      material = null;
      currentTextureCanvas = null;
    };
  }, [animate, baseHeight, baseWidth, isSafariTextureCapture, mugImageSrc, previewSlides, shouldUseProvidedMugImage, textureSlide]);


  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 3 }}>
        <Typography sx={{ p: 2, display: "flex", alignItems: "center", color: "blue", "&:hover": { textDecoration: "underline", cursor: "pointer" } }} onClick={() => navigate(-1)}>
          <ArrowBackIos fontSize="small" /> exit
        </Typography>

        <Box sx={{ display: "flex", gap: 2 }}>
          <LandingButton
            title="Download"
            loading={loading}
            onClick={async () => {
              setLoading(true);
              try {
                if (!renderer) throw new Error("Renderer not ready");

                // Capture current 3D preview as JPEG
                const mugPreview = captureMugPreviewJpg();
                if (!mugPreview && !flatDesignImage) throw new Error("Failed to capture mug preview");
                const slide1 = flatDesignImage || mugPreview || "";
                const payload = { slide1 };
                const slidesScopeKeys = (() => {
                  try {
                    const storedProduct = JSON.parse(localStorage.getItem("selectedProduct") || "{}");
                    return resolveSlidesScopeCandidates({
                      includeStoredDraft: false,
                      productKey:
                        storedProduct?.id && storedProduct?.type
                          ? `${storedProduct.type}:${storedProduct.id}`
                          : "",
                      category:
                        localStorage.getItem("selectedCategory") ||
                        storedProduct?.category ||
                        "",
                      cardSize: localStorage.getItem("selectedSize") || "",
                    });
                  } catch {
                    return resolveSlidesScopeCandidates({ includeStoredDraft: false });
                  }
                })();
                sessionStorage.removeItem("slides");
                // Keep checkout preview normal; PDF flow will mirror for mug category.
                sessionStorage.removeItem("slides_mirrored");
                sessionStorage.removeItem("slides_mirrored_category");
                void saveSlidesToScopes(slidesScopeKeys, payload);
                try {
                  localStorage.setItem("slides_backup", JSON.stringify(payload));
                } catch {}
                try {
                  (globalThis as any).__slidesCache = payload;
                } catch {}
                const previewKey = sessionStorage.getItem("templ_preview_key") || "";
                saveSubscriptionPreviewPayload(payload, previewKey);
                toast.success("Preview saved successfully!");
                navigate(USER_ROUTES.SUBSCRIPTION, {
                  state: {
                    slides: payload,
                    previewKey,
                  },
                });
              } catch (err) {
                console.error("Download failed:", err);
                toast.error("Failed to prepare download. Try again.");
              } finally {
                setLoading(false);
              }
            }}
          />
        </Box>
      </Box>
      <div ref={containerRef} style={{ width: "100%", height: "90vh" }} />
      {textureSlide && (
        <Box sx={{ position: "fixed", left: -10000, top: 0, opacity: 0, pointerEvents: "none" }}>
          <Box
            ref={flatSlideRef}
            sx={{ width: baseWidth, height: baseHeight, position: "relative" }}
          >
            {renderFlatSlide(textureSlide)}
          </Box>
        </Box>
      )}
      {/* <input
        type="color"
        ref={colorRef}
        defaultValue="white"
        style={{ position: "absolute", top: 20, right: 20 }}
      /> */}
    </>

  );
};

export default TempletEditorPreview;

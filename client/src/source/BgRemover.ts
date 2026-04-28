export {}; 
// import { preload, removeBackground } from "@imgly/background-removal";


// type RemoveBgConfig = Parameters<typeof removeBackground>[1];

// const blobToDataUrl = (blob: Blob): Promise<string> =>
//   new Promise((resolve, reject) => {
//     const reader = new FileReader();
//     reader.onerror = () => reject(new Error("Failed to read BG-removed image blob."));
//     reader.onload = () => resolve(String(reader.result));
//     reader.readAsDataURL(blob);
//   });

// export const warmupBgRemover = async (config?: RemoveBgConfig) => {
//   await preload(config);
// };

// export const removeBgToDataUrl = async (
//   src: string,
//   config?: RemoveBgConfig,
// ): Promise<string> => {
//   const blob = await removeBackground(src, {
//     output: { format: "image/png" },
//     ...config,
//   } as RemoveBgConfig);

//   return blobToDataUrl(blob);
// };
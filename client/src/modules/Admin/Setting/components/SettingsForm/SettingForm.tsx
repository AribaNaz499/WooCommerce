import { Box } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { BorderColorRounded } from "@mui/icons-material";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useAdmin } from "../../../../../context/AdminContext";
import CustomInput from "../../../../../components/CustomInput/CustomInput";
import LandingButton from "../../../../../components/LandingButton/LandingButton";


type FormValue = {
  role?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  newpassword?: string;
  confirmpassword?: string;
};

const DEFAULT_AVATAR = "/assets/icons/administrater.png";

function isDataUrl(s?: string | null): boolean {
  return !!s && /^data:image\/(png|jpg|jpeg|webp);base64,/.test(s);
}

// Why: keep DB size reasonable without external storage
async function fileToSizedDataUrl(
  file: File,
  opts: { maxW?: number; maxH?: number; quality?: number } = {}
): Promise<string> {
  const maxW = opts.maxW ?? 512;
  const maxH = opts.maxH ?? 512;
  const quality = opts.quality ?? 0.85;

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });

  // Draw into canvas to resize/compress
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = dataUrl;
  });

  let { width, height } = img;
  const scale = Math.min(1, maxW / width, maxH / height);
  if (scale < 1) {
    width = Math.floor(width * scale);
    height = Math.floor(height * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(img, 0, 0, width, height);

  // Prefer JPEG/WebP for better size; fallback to PNG for transparency
  const hasAlpha = await new Promise<boolean>((resolve) => {
    try {
      const imgData = ctx.getImageData(0, 0, 1, 1).data;
      resolve(imgData[3] < 255);
    } catch {
      resolve(false);
    }
  });

  const mime = hasAlpha ? "image/png" : "image/jpeg";
  const finalUrl = canvas.toDataURL(mime, quality);

  // Soft size guard (~0.8–1.2 MB)
  const approxBytes = Math.ceil((finalUrl.length * 3) / 4);
  if (approxBytes > 1_200_000) {
    toast("Image is large; consider a smaller file.");
  }

  return finalUrl;
}

const SettingForm = () => {
  const { admin, updateAdmin } = useAdmin();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValue>({
    defaultValues: { role: "Admin" },
  });

  const [imagePreview, setImagePreview] = useState<string>(DEFAULT_AVATAR);

  useEffect(() => {
    if (!admin) return;
    reset({
      role: admin.role || "Admin",
      firstName: admin.first_name || "",
      lastName: admin.last_name || "",
      email: admin.email || "",
      newpassword: "",
      confirmpassword: "",
    });
    setImagePreview(admin.profile_image || DEFAULT_AVATAR);
  }, [admin, reset]);

  const newpass = watch("newpassword");
  const confirmpass = watch("confirmpassword");

  const passwordsMismatch = useMemo(
    () => Boolean(newpass || confirmpass) && newpass !== confirmpass,
    [newpass, confirmpass]
  );

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast.error("Unsupported image type");
      return;
    }
    try {
      const dataUrl = await fileToSizedDataUrl(file, { maxW: 512, maxH: 512, quality: 0.85 });
      setImagePreview(dataUrl);
    } catch (err) {
      console.error(err);
      toast.error("Failed to process image");
    }
  };

  const onSubmit = async (data: FormValue) => {
    if (!admin?.id) {
      toast.error("Admin not found");
      return;
    }
    console.log(data, '00')

    if (!data.email || !/^\S+@\S+\.\S+$/.test(data.email)) {
      toast.error("Valid email is required");
      return;
    }
    if (passwordsMismatch) {
      toast.error("Passwords do not match");
      return;
    }
    if ((data.newpassword || data.confirmpassword) && (data.newpassword?.length ?? 0) < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    const patch: Record<string, unknown> = {};
    if (data.role && data.role !== admin.role) patch.role = data.role || "Admin";
    if (typeof data.firstName !== "undefined" && data.firstName !== admin.first_name)
      patch.first_name = data.firstName;
    if (typeof data.lastName !== "undefined" && data.lastName !== admin.last_name)
      patch.last_name = data.lastName;
    if (typeof data.email !== "undefined" && data.email !== admin.email) patch.email = data.email;
    if (data.newpassword) patch.password = data.newpassword;

    // Only save when user actually picked a new image (data URL) and it's different
    if (isDataUrl(imagePreview) && imagePreview !== admin.profile_image) {
      patch.profile_image = imagePreview;
    }

    if (Object.keys(patch).length === 0) {
      toast("Nothing to update");
      return;
    }

    const updated = await updateAdmin(patch);
    if (!updated) {
      toast.error("Error updating admin data");
      return;
    }

    toast.success("Admin updated successfully!");
    reset({
      role: updated.role || "Admin",
      firstName: updated.first_name || "",
      lastName: updated.last_name || "",
      email: updated.email || "",
      newpassword: "",
      confirmpassword: "",
    });
    setImagePreview(updated.profile_image || DEFAULT_AVATAR);
  };

  return (
    <Box sx={{ p: { md: 5, sm: 5, xs: 2 } }}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Box sx={{ display: { md: "flex", sm: "flex", xs: "block" }, width: "100%" }}>
          {/* Left: Avatar */}
          <Box
            sx={{
              width: { md: "50%", sm: "50%", xs: "100%" },
              p: { md: 3, sm: 3, xs: 0 },
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              position: "relative",
              gap: 4,
            }}
          >
            <Box
              sx={{
                width: { md: 350, sm: 350, xs: 250 },
                height: { md: 350, sm: 350, xs: 250 },
                borderRadius: "50%",
                overflow: "hidden",
                border: "3px solid #ff4d00",
                position: "relative",
                cursor: "pointer",
              }}
            >
              <img
                src={imagePreview || DEFAULT_AVATAR}
                alt="Profile"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  bgcolor: "rgba(0, 0, 0, 0.45)",
                  opacity: 0,
                  transition: "0.3s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  "&:hover": { opacity: 1 },
                }}
                onClick={() => document.getElementById("imageUpload")?.click()}
              >
                <BorderColorRounded sx={{ fontSize: 40, color: "#fff" }} />
              </Box>
              <input
                type="file"
                id="imageUpload"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleImageChange}
              />
            </Box>

            <Box sx={{ width: "100%" }}>
              <CustomInput
                label="Admin Role"
                placeholder="Select role"
                type="select"
                register={register("role")}
                options={[
                  { label: "Admin", value: "Admin" },
                  { label: "Contributor", value: "Contributor" },
                  { label: "Guest", value: "Guest" },
                ]}
              />
            </Box>
          </Box>

          {/* Right: Fields */}
          <Box sx={{ width: { md: "50%", sm: "50%", xs: "100%" }, p: { md: 3, sm: 3, xs: 0 } }}>
            <CustomInput
              label="First Name"
              placeholder="Enter first name"
              register={register("firstName")}
            />
            <CustomInput
              label="Last Name"
              placeholder="Enter last name"
              register={register("lastName")}
            />
            <CustomInput
              label="Email"
              placeholder="Enter email"
              register={register("email", {
                required: "Email is required",
                pattern: { value: /^\S+@\S+\.\S+$/, message: "Invalid email" },
              })}
              error={errors.email?.message as string}
            />
            <CustomInput
              label="New Password"
              placeholder="Enter new password"
              type="password"
              register={register("newpassword")}
            />
            <CustomInput
              label="Confirm Password"
              type="password"
              placeholder="Confirm password"
              register={register("confirmpassword")}
              error={passwordsMismatch ? "Passwords do not match" : undefined}
            />

            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
              <LandingButton
                title="Update Setting"
                personal
                width="240px"
                variant="outlined"
                type="submit"
                loading={isSubmitting}
              />
            </Box>
          </Box>
        </Box>
      </form>
    </Box>
  );
};

export default SettingForm;

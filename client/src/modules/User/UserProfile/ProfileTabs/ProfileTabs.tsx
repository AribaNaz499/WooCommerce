import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box, IconButton, useMediaQuery, useTheme } from "@mui/material";
import { useForm } from "react-hook-form";
import { EditOutlined } from "@mui/icons-material";
import toast from "react-hot-toast";

import CustomInput from "../../../../components/CustomInput/CustomInput";
import LandingButton from "../../../../components/LandingButton/LandingButton";
import { useAuth } from "../../../../context/AuthContext";
import { supabase } from "../../../../supabase/supabase";

type FormValues = {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

const USER_TABLE = "Users";
const USER_AUTH_COL = "auth_id";
const STORAGE_BUCKET = "UserProfile";
const PROFILE_URL_COL = "profileUrl";

function isImageFile(file: File) {
  return file.type.startsWith("image/");
}

function extFromFile(file: File) {
  const raw = file.name.split(".").pop()?.toLowerCase();
  if (!raw) return "jpg";
  if (raw === "jpeg") return "jpg";
  return raw;
}

function getAuthMetaAvatar(user: any): string {
  return (
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    user?.user_metadata?.photoURL ||
    user?.identities?.[0]?.identity_data?.avatar_url ||
    user?.identities?.[0]?.identity_data?.picture ||
    user?.identities?.[0]?.identity_data?.photoURL ||
    ""
  );
}

function isMissingColumnError(err: any, colName: string) {
  const msg = String(err?.message ?? "");
  return msg.includes(`Could not find the '${colName}' column`);
}

async function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  let t: any;
  const timeout = new Promise<T>((_, rej) => {
    t = setTimeout(() => rej(new Error(`${label} timed out`)), ms);
  });
  try {
    return await Promise.race([p, timeout]);
  } finally {
    clearTimeout(t);
  }
}

async function uploadProfileImageToSupabase(userId: string, file: File) {
  const ext = extFromFile(file);
  const path = `${userId}/profile.${ext}`;

  console.log("Uploading to:", STORAGE_BUCKET, path, file.size, file.type);

  const uploadRes = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadRes.error) {
    console.error("Upload error:", uploadRes.error);
    throw uploadRes.error;
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  const publicUrl = data?.publicUrl;
  if (!publicUrl) throw new Error("Failed to get public URL (bucket public?)");
  return publicUrl;
}


async function saveUserRow(authId: string, payload: Record<string, any>) {
  const { data: updated, error: upErr } = await supabase
    .from(USER_TABLE)
    .update(payload)
    .eq(USER_AUTH_COL, authId)
    .select("id");

  if (upErr) throw upErr;

  if (Array.isArray(updated) && updated.length > 0) return;

  const { error: insErr } = await supabase
    .from(USER_TABLE)
    .insert([{ [USER_AUTH_COL]: authId, ...payload }]);

  if (insErr) throw insErr;
}

const ProfileTabs: React.FC = () => {
  const theme = useTheme();
  const isUpMd = useMediaQuery(theme.breakpoints.up("md"));

  const authCtx = useAuth() as any;
  const { user, profile } = authCtx;
  const authId: string | null = user?.id ?? null;

  const hydrated = useMemo<FormValues>(() => {
    const fullName =
      profile?.full_name ??
      profile?.fullName ??
      user?.user_metadata?.full_name ??
      user?.user_metadata?.name ??
      user?.user_metadata?.fullName ??
      "";

    const phone = profile?.phone ?? profile?.mobile ?? user?.phone ?? "";
    const email = profile?.email ?? user?.email ?? "";

    return {
      fullName: String(fullName || ""),
      phone: String(phone || ""),
      email: String(email || ""),
      password: "",
      confirmPassword: "",
    };
  }, [profile, user]);

  const baseAvatarSrc = useMemo(() => {
    const fromDb =
      profile?.[PROFILE_URL_COL] ||
      profile?.profileUrl ||
      profile?.photoUrl ||
      profile?.avatar_url ||
      "";
    const fromAuth = getAuthMetaAvatar(user);
    return fromDb || fromAuth || "/assets/icons/administrater.png";
  }, [profile, user]);

  const {
    register,
    handleSubmit,
    reset,
    // setValue,
    watch,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onChange",
  });

  // ✅ hydrate only when user changes / first load
  const didInitRef = useRef(false);
  const lastAuthIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!authId) return;
    const authChanged = lastAuthIdRef.current !== authId;

    if (!didInitRef.current || authChanged) {
      didInitRef.current = true;
      lastAuthIdRef.current = authId;
      reset(hydrated);
    }
  }, [authId, hydrated, reset]);

  const passwordValue = watch("password");

  const fileRef = useRef<HTMLInputElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string>(baseAvatarSrc);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (!selectedFile) setCurrentAvatarUrl(baseAvatarSrc);
  }, [baseAvatarSrc, selectedFile]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const displaySrc = previewUrl ?? currentAvatarUrl;

  const openPicker = () => fileRef.current?.click();

  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isImageFile(file)) {
      toast.error("Please select an image file (JPG/PNG).");
      e.target.value = "";
      return;
    }

    const maxBytes = 3 * 1024 * 1024;
    if (file.size > maxBytes) {
      toast.error("Image too large (max 5MB).");
      e.target.value = "";
      return;
    }

    setSelectedFile(file);

    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setPreviewUrl(url);

    e.target.value = "";
  };

  const clearPreview = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  const refreshAuthAndProfile = async () => {
    try {
      if (typeof authCtx?.refreshUser === "function") await authCtx.refreshUser();
      if (typeof authCtx?.refreshProfile === "function") await authCtx.refreshProfile();
    } catch (e) {
      console.warn("refreshAuthAndProfile failed:", e);
    }
  };

  const submit = async (values: FormValues, publish: boolean) => {
    if (!authId) {
      toast.error("User not authenticated.");
      return;
    }

    const nextFullName = values.fullName?.trim() || "";
    const nextPhone = values.phone?.trim() || "";
    const nextEmail = values.email?.trim().toLowerCase() || "";

    if (nextEmail && !EMAIL_REGEX.test(nextEmail)) {
      toast.error("Invalid email");
      return;
    }

    try {
      setPublishing(true);

   let uploadedProfileUrl: string | null = null;

if (selectedFile) {
  const tryUpload = () =>
    withTimeout(
      uploadProfileImageToSupabase(authId, selectedFile),
      90_000,
      "Image upload"
    );

  try {
    uploadedProfileUrl = await tryUpload();
  } catch (err1) {
    // ✅ retry once
    try {
      uploadedProfileUrl = await tryUpload();
    } catch (err2) {
      // ✅ if still fails, throw the real error
      throw err2 ?? err1;
    }
  }
}


      const payload: Record<string, any> = {
        full_name: nextFullName || null,
        phone: nextPhone || null,
        email: nextEmail || null,
      };

      if (uploadedProfileUrl) payload[PROFILE_URL_COL] = uploadedProfileUrl;
      if (publish) payload.published = true;

      try {
        await withTimeout(saveUserRow(authId, payload), 15_000, "Saving profile");
      } catch (err: any) {
        if (publish && isMissingColumnError(err, "published")) {
          delete payload.published;
          await withTimeout(saveUserRow(authId, payload), 15_000, "Saving profile");
        } else {
          throw err;
        }
      }

      const currentEmail = (user?.email || "").trim().toLowerCase();

      const authUpdate: any = { data: {} as Record<string, any> };
      if (nextFullName) {
        authUpdate.data.full_name = nextFullName;
        authUpdate.data.name = nextFullName;
      }
      if (uploadedProfileUrl) {
        authUpdate.data.avatar_url = uploadedProfileUrl;
        authUpdate.data.picture = uploadedProfileUrl;
      }
      if (nextEmail && nextEmail !== currentEmail) authUpdate.email = nextEmail;

      const newPwd = values.password?.trim();
      if (newPwd) authUpdate.password = newPwd;

      const shouldCallAuth =
        Object.keys(authUpdate.data).length > 0 ||
        !!authUpdate.email ||
        !!authUpdate.password;

      if (shouldCallAuth) {
        const authResult = (await withTimeout(
          supabase.auth.updateUser(authUpdate),
          15_000,
          "Auth update"
        )) as { error: Error | null };
        if (authResult.error) throw authResult.error;
      }

      // ✅ Keep form showing updated values (no empty reset)
      reset(
        {
          fullName: nextFullName,
          phone: nextPhone,
          email: nextEmail,
          password: "",
          confirmPassword: "",
        },
        { keepDirty: false, keepTouched: false }
      );
      clearErrors();

      if (uploadedProfileUrl) {
        setCurrentAvatarUrl(uploadedProfileUrl);
        clearPreview();
      }

      await refreshAuthAndProfile();

      toast.success(
        nextEmail && nextEmail !== currentEmail
          ? "Updated ✅ (If email confirmation is enabled, confirm email to login with new email)"
          : "Updated ✅"
      );
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        gap: 3,
        justifyContent: "space-between",
        p: { xs: 1.5, md: 2 },
        alignItems: { xs: "stretch", md: "center" },
      }}
    >
      {/* Left: Avatar */}
      <Box sx={{ display: "flex", width: { xs: "100%", md: "40%" } }}>
        <Box
          sx={{
            position: "relative",
            width: "100%",
            maxWidth: 520,
            aspectRatio: "1 / 1",
            borderRadius: "50%",
            boxShadow: 5,
            overflow: "hidden",
            cursor: "pointer",
            "&:hover .avatarOverlay": { opacity: 1 },
          }}
          onClick={openPicker}
          role="button"
          aria-label="Edit avatar"
        >
          <Box
            component="img"
            src={displaySrc}
            alt="user avatar"
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              borderRadius: "50%",
            }}
          />

          <Box
            className="avatarOverlay"
            sx={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              bgcolor: "rgba(0,0,0,0.45)",
              opacity: 0,
              transition: "opacity 180ms ease",
            }}
          >
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                openPicker();
              }}
              sx={{
                width: 54,
                height: 54,
                bgcolor: "rgba(255,255,255,0.18)",
                backdropFilter: "blur(2px)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.26)" },
              }}
              aria-label="Select new image"
            >
              <EditOutlined sx={{ color: "#fff" }} />
            </IconButton>
          </Box>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={onFileChange}
          />
        </Box>
      </Box>

      {/* Right: Form */}
      <Box sx={{ width: { xs: "100%", md: 520 } }}>
        <CustomInput
          label="Full Name"
          placeholder="Enter your full name"
          showRequiredAsterisk={false}
          register={register("fullName")}
          error={errors.fullName?.message}
        />

        <CustomInput
          label="Phone Number"
          placeholder="Enter mobile number"
          showRequiredAsterisk={false}
          register={register("phone")}
          error={errors.phone?.message}
        />

        <CustomInput
          label="Email"
          placeholder="example@email.com"
          type="email"
          showRequiredAsterisk={false}
          register={register("email", {
            validate: (v) =>
              v?.trim() === "" ? true : EMAIL_REGEX.test(v) || "Invalid email",
          })}
          error={errors.email?.message}
        />

        <CustomInput
          label="Password"
          placeholder="Enter Password"
          type="password"
          showRequiredAsterisk={false}
          register={register("password", {
            validate: (v) =>
              v?.trim() === "" ? true : v.length >= 6 || "Min 6 characters",
          })}
          error={errors.password?.message}
        />

        <CustomInput
          label="Confirm Password"
          placeholder="Confirm password"
          type="password"
          showRequiredAsterisk={false}
          register={register("confirmPassword", {
            validate: (v) => {
              if (!passwordValue) return true;
              return v === passwordValue || "Passwords do not match";
            },
          })}
          error={errors.confirmPassword?.message}
        />

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 4, mt: 1 }}>
          <LandingButton
            title={publishing ? "Updating..." : "Update & Publish"}
            width={isUpMd ? "250px" : "100%"}
            personal
            onClick={handleSubmit((v) => submit(v, true))}
            loading={publishing || isSubmitting}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default ProfileTabs;

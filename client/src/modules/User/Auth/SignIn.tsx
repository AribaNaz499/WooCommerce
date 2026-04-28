import { Box, IconButton, Typography } from "@mui/material";
import { useEffect } from "react";
import CustomInput from "../../../components/CustomInput/CustomInput";
import LandingButton from "../../../components/LandingButton/LandingButton";
import { useLocation, useNavigate } from "react-router-dom";
import { USER_ROUTES } from "../../../constant/route";
import { COLORS } from "../../../constant/color";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";
import {
  clearPendingAuthRedirect,
  normalizeAuthRedirectPath,
  readPendingAuthRedirect,
  readRootRedirectParam,
  savePendingAuthRedirect,
} from "../../../lib/authRedirect";

type SigninForm = {
  email: string;
  password: string;
};

const SignIn = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signInWithGoogle, loading } = useAuth();

  const redirectFromQuery =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("redirect")?.trim() || ""
      : "";
  const redirectFromRootCallback = readRootRedirectParam(location.search) ?? "";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SigninForm>();

  /**
   * Best path to send the user to after login.
   * Priority: explicit ?redirect param → root callback param
   *           → location.state.redirectTo → HOME
   */
  const resolvePendingPath = (): string => {
    const fromQuery = redirectFromQuery;
    const fromCallback = redirectFromRootCallback;
    const fromState =
      typeof (location.state as any)?.redirectTo === "string" &&
      (location.state as any).redirectTo.trim()
        ? (location.state as any).redirectTo.trim()
        : "";

    return normalizeAuthRedirectPath(
      fromQuery ||
      fromCallback ||
      fromState ||
      USER_ROUTES.HOME
    );
  };

  useEffect(() => {
    const nextPath = resolvePendingPath();
    const pending = readPendingAuthRedirect();
    const nextState =
      pending?.state ??
      (location.state as any)?.redirectState ??
      null;
    const shouldAutoResume =
      pending?.autoResume === true ||
      Boolean(redirectFromQuery) ||
      Boolean(redirectFromRootCallback);

    if (!nextPath || nextPath === USER_ROUTES.HOME || !shouldAutoResume) return;

    savePendingAuthRedirect({
      path: nextPath,
      autoResume: true,
      state: nextState,
    });
  }, [location.state, redirectFromQuery, redirectFromRootCallback]);

  const onSubmitForm = async (data: SigninForm) => {
    try {
      const authData = await signIn({ email: data.email, password: data.password });
      if (!authData?.user?.id) {
        throw new Error("Unable to complete sign-in. Please try again.");
      }
      const pending = readPendingAuthRedirect();
      const nextPath = pending?.path || resolvePendingPath();
      const nextState = pending?.state ?? (location.state as any)?.redirectState ?? null;
      clearPendingAuthRedirect();
      if (nextState) {
        try {
          sessionStorage.setItem("post_login_redirect_state_v1", JSON.stringify(nextState));
        } catch {}
      }
      navigate(nextPath, {
        replace: true,
        state: nextState ?? undefined,
      });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <Box
      sx={{
        position: "relative",
        height: "100vh",
        width: "100%",
        overflow: "hidden",
      }}
    >
      <Box
        component={"img"}
        src="/assets/images/signinbg.png"
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: 0,
          filter: "brightness(60%)",
        }}
      />

      <Box
        component={"form"}
        onSubmit={handleSubmit(onSubmitForm)}
        sx={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        <Box
          sx={{
            width: { md: 500, sm: 500, xs: "100%" },
            p: 3,
            borderRadius: 3,
            bgcolor: "rgba(255,255,255,0.9)",
            boxShadow: "0 4px 30px rgba(0,0,0,0.1)",
            textAlign: "center",
          }}
        >
          <Typography
            sx={{
              fontSize: { md: "35px", sm: "35px", xs: 22 },
              fontWeight: 700,
            }}
          >
            Sign In
          </Typography>

          <Box mt={5}>
            <CustomInput
              label="Email"
              placeholder="Enter your email"
              register={register("email", {
                required: "Email is required",
              })}
              error={errors.email?.message}
            />
            <CustomInput
              label="Password"
              placeholder="Enter your password"
              type="password"
              register={register("password", {
                required: "Password is required",
              })}
              error={errors.password?.message}
            />

            <LandingButton
              title="Sign in"
              width="450px"
              personal
              type="submit"
              loading={loading}
            />

            <Typography sx={{ fontSize: "13px", textAlign: "start", mt: 3 }}>
              I have no account{" "}
              <span
                onClick={() =>
                  navigate(
                    redirectFromQuery || redirectFromRootCallback
                      ? `${USER_ROUTES.SIGNUP}?redirect=${encodeURIComponent(
                          redirectFromQuery || redirectFromRootCallback,
                        )}`
                      : USER_ROUTES.SIGNUP,
                  )
                }
                style={{
                  fontWeight: "bold",
                  color: "rgba(44, 5, 44, 1)",
                  textDecoration: "underline",
                  cursor: "pointer",
                }}
              >
                Sign Up
              </span>
              .
            </Typography>

            {/* GOOGLE SIGN-IN BUTTON */}
            <IconButton
              onClick={() => {
                // Resolve the best return path BEFORE leaving the app
                const pendingPath = resolvePendingPath();
                const pendingState =
                  (location.state as any)?.redirectState ?? null;

                savePendingAuthRedirect({
                  path: pendingPath,
                  autoResume:
                    Boolean(redirectFromQuery) ||
                    Boolean(redirectFromRootCallback) ||
                    readPendingAuthRedirect()?.autoResume === true,
                  state: pendingState,
                });

                void signInWithGoogle(pendingPath);
              }}
              sx={{
                p: 1,
                bgcolor: "brown",
                color: COLORS.white,
                width: { md: 450, sm: 450, xs: "100%" },
                borderRadius: 1,
                fontSize: "15px",
                mt: 3,
                display: "flex",
                gap: 2,
                "&:hover": { bgcolor: COLORS.primary },
              }}
            >
              Continue with Google
              <Box
                component={"img"}
                src="/assets/images/google.png"
                sx={{ width: "30px", height: "30px" }}
              />
            </IconButton>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default SignIn;

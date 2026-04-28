import { Box, Typography } from "@mui/material";
import CustomInput from "../../../components/CustomInput/CustomInput";
import LandingButton from "../../../components/LandingButton/LandingButton";
import { USER_ROUTES } from "../../../constant/route";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";
import { buildSignInRedirectUrl } from "../../../lib/authRedirect";

type SignUpForm = {
  fullName: string;
  phoneNumber: string;
  email: string;
  password: string;
  confirmPassword?: string;
};

const SignUp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signUp } = useAuth();
  const redirectFromQuery =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("redirect")?.trim() || ""
      : "";

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignUpForm>();

  const passwordValue = watch("password");

  const onSubmitForm = async (data: SignUpForm) => {
    try {
      await signUp({
        fullName: data.fullName,
        phone: data.phoneNumber,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });

      toast.success("Account created successfully!");
      navigate(
        redirectFromQuery ? buildSignInRedirectUrl(redirectFromQuery) : USER_ROUTES.SIGNIN,
      );
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
      {/* Background image */}
      <Box
        component={"img"}
        src="/assets/images/animated-banner.jpg"
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

      {/* Centered form */}
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
            width: { md: 500, sm: 400, xs: "100%" },
            height: { md: 'auto', sm: '90vh', xs: '80vh' },
            overflow: { md: 'hidden', sm: 'scroll', xs: 'scroll' },
            p: 3,
            borderRadius: 3,
            bgcolor: "rgba(255,255,255,0.9)",
            boxShadow: "0 4px 30px rgba(0,0,0,0.1)",
            textAlign: "center",
          }}
        >
          <Typography sx={{ fontSize: { md: "35px", sm: "35px", xs: 22 }, fontWeight: 700 }}>
            Sign Up
          </Typography>
          {/* Your inputs & buttons go here */}
          <Box mt={{ md: 5, sm: 5, xs: 2 }}>
            <CustomInput
              label="Full Name"
              placeholder="Enter your Full Name"
              register={register("fullName", {
                required: "Full name is required",
              })}
              error={errors.fullName?.message}
            />
            <CustomInput
              label="Phone Number"
              placeholder="Enter your Phone Number"
              register={register("phoneNumber", {
                required: "Phone number is required",
              })}
              error={errors.phoneNumber?.message}
            />
            <CustomInput
              label="Email"
              placeholder="Enter your email"
              register={register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Invalid email address",
                },
              })}
              error={errors.email?.message}
            />
            <CustomInput
              label="Password"
              placeholder="Enter your password"
              type="password"
              register={register("password", {
                required: "Password is required",
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters",
                },
              })}
              error={errors.password?.message}
            />
            <CustomInput
              label="Confirm Password"
              placeholder="Enter your confirm password"
              type="password"
              register={register("confirmPassword", {
                required: "Confirm password is required",
                validate: (value) =>
                  value === passwordValue || "Passwords do not match",
              })}
              error={errors.confirmPassword?.message}
            />
            <LandingButton
              title="Sign up "
              width="450px"
              personal
              type="submit"
            />

            <Typography sx={{ fontSize: "13px", textAlign: "start", mt: 3 }}>
              Already have account{" "}
              <span
                onClick={() =>
                  navigate(
                    redirectFromQuery
                      ? buildSignInRedirectUrl(redirectFromQuery)
                      : USER_ROUTES.SIGNIN,
                  )
                }
                style={{
                  fontWeight: "bold",
                  color: "rgba(44, 5, 44, 1)",
                  textDecoration: "underline",
                  cursor: "pointer",
                }}
              >
                Sign In
              </span>
              .
            </Typography>

            {/* <IconButton>
              <Box
                component={"img"}
                src="/assets/images/google.png"
                sx={{ width: "40px", height: "40px" }}
              />
            </IconButton> */}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default SignUp;

import { Box, Typography } from "@mui/material";
import CustomInput from "../../../../components/CustomInput/CustomInput";
import LandingButton from "../../../../components/LandingButton/LandingButton";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import React from "react";
import { ADMINS_DASHBOARD } from "../../../../constant/route";
import { useAdmin } from "../../../../context/AdminContext";
import { COLORS } from "../../../../constant/color";

type FormValue = {
  email: string;
  password: string;
};

const AdminSigninForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValue>();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);

  const { login } = useAdmin();

  const onSubmit = async (data: FormValue) => {
    setLoading(true);
    const success = await login(data.email, data.password);
    if (success) {
      toast.success("Admin logged in successfully!");
      navigate(ADMINS_DASHBOARD.HOME);
    } else {
      toast.error("Invalid credentials");
    }
    setLoading(false);
  };


  return (
    <Box
      sx={{
        width: 500,
        p: 3,
        borderRadius: 3,
        textAlign: "center",
        bgcolor: COLORS.white,
      }}
    >
      <Typography sx={{ fontSize: "45px", fontWeight: 700 }}>
        Sign In
      </Typography>
      <Typography sx={{ fontSize: "15px", fontWeight: 400, color: "gray" }}>
        This is only working for admin email & password
      </Typography>

      <Box mt={5} component={"form"} onSubmit={handleSubmit(onSubmit)}>
        <CustomInput
          label="Email"
          placeholder="Enter your email"
          type="email"
          register={register("email", { required: "Email is required" })}
          error={errors.email?.message}
        />
        <CustomInput
          label="Password"
          placeholder="Enter your password"
          type="password"
          register={register("password", { required: "Password is required" })}
          error={errors.password?.message}
        />
        <Box sx={{ display: "flex", gap: 1, fontSize: "12px", color: "gray" }}>
          <Box component={"input"} type="checkbox" /> Remember me
        </Box>
        <br />
        <LandingButton
          title="Sign in"
          width="450px"
          personal
          type="submit"
          loading={loading}
        />
      </Box>
    </Box>
  );
};

export default AdminSigninForm;

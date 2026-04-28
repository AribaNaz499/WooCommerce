import { Visibility, VisibilityOff } from "@mui/icons-material";
import {
  Box,
  IconButton,
  InputBase,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import React, { useMemo, useState } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

type Option = { label: string; value: string | number };

type InputTypes = {
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  value?: string | number;
  type?: "text" | "number" | "password" | "select" | "email";
  label: string;
  placeholder?: string;
  icon?: string;
  register?: UseFormRegisterReturn;
  error?: any;
  options?: Option[];
  description?: boolean;
  defaultValue?: string | number;
  multiline?: boolean;
  showRequiredAsterisk?: boolean;
  showSelectPlaceholder?: boolean;

  // ✅ add these for number inputs
  step?: number | "any";
  min?: number;
  max?: number;
};

const CustomInput = (props: InputTypes) => {
  const {
    label,
    placeholder = "",
    icon,
    onChange,
    value,
    type = "text",
    register,
    error,
    description,
    defaultValue,
    multiline,
    options = [],
    showRequiredAsterisk = true,
    showSelectPlaceholder = true,
    step,
    min,
    max,
  } = props;

  const [showPassword, setShowPassword] = useState(false);
  const inputType = type === "password" && showPassword ? "text" : type;

  const isControlled = value !== undefined;

  const mergedOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    register?.onChange?.(e);
    onChange?.(e);
  };

  const numberInputProps = useMemo(() => {
    if (type !== "number") return undefined;
    return {
      step: step ?? "any", // ✅ allow floats like 2.5
      min,
      max,
      inputMode: "decimal",
    } as const;
  }, [type, step, min, max]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", textAlign: "left", mb: 1.5 }}>
      <Typography sx={{ fontWeight: 700, mb: "5px", fontSize: { md: "auto", sm: "auto", xs: "12px" } }}>
        {label}
        {showRequiredAsterisk && <span style={{ color: "red" }}> *</span>}
      </Typography>

      {type === "select" ? (
        <TextField
          select
          fullWidth
          variant="standard"
          value={value ?? ""}
          onChange={(e) => onChange?.(e as unknown as React.ChangeEvent<HTMLInputElement>)}
          error={Boolean(error)}
          helperText={error || " "}
          sx={{
            px: "12px",
            display: "flex",
            alignItems: "center",
            borderRadius: "12px",
            border: "1px solid",
            borderColor: error ? "red" : "#ccc",
            "& .MuiInputBase-root:before, & .MuiInputBase-root:after": { borderBottom: "none !important" },
            "& .MuiInput-underline:before, & .MuiInput-underline:after": { borderBottom: "none !important" },
            "&:hover": { borderColor: error ? "red" : "black" },
          }}
        >
          {showSelectPlaceholder && (
            <MenuItem disabled value="">
              {placeholder || "Select..."}
            </MenuItem>
          )}
          {options.map((option) => (
            <MenuItem key={String(option.value)} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      ) : (
        <Box
          sx={{
            display: "flex",
            alignItems: description ? "flex-start" : "center",
            border: "1px solid",
            borderColor: error ? "red" : "#ccc",
            borderRadius: "12px",
            px: 1,
            transition: "all 0.2s",
            "&:hover": { borderColor: error ? "red" : "black" },
          }}
        >
          {icon && <Box component="img" src={icon} alt="icon" sx={{ width: 24, height: 24, mr: 1 }} />}

          <InputBase
            fullWidth
            type={inputType}
            placeholder={placeholder}
            // ✅ avoid controlled/uncontrolled warning
            defaultValue={!isControlled ? defaultValue : undefined}
            value={isControlled ? (value as any) : undefined}
            onChange={mergedOnChange}
            rows={multiline ? 6 : 0}
            multiline={multiline}
            inputProps={numberInputProps}
            name={register?.name}
            inputRef={register?.ref}
            sx={{ py: "10px", px: "12px", "&:focus": { outline: "none" } }}
          />

          {type === "password" && !description && (
            <IconButton
              onClick={() => setShowPassword((s) => !s)}
              edge="end"
              size="small"
              sx={{ color: "grey.600" }}
            >
              {showPassword ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          )}
        </Box>
      )}

      {error && (
        <Typography sx={{ mt: 1, fontSize: "13px", color: "red" }}>
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default CustomInput;
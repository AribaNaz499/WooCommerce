import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";
import LandingButton from "../../../../components/LandingButton/LandingButton";
import { Alert, LinearProgress, Step, StepLabel, Stepper } from "@mui/material";
import { Close } from "@mui/icons-material";
import { COLORS } from "../../../../constant/color";
import { useEffect, useMemo, useState } from "react";

const style = {
  position: "absolute" as const,
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { md: 520, sm: 520, xs: "95%" },
  bgcolor: "background.paper",
  boxShadow: 24,
  borderRadius: "12px",
  p: 3,
  textAlign: "center",
};

type ModalType = {
  open: boolean;
  onCloseModal: () => void;

  zipLoading?: boolean;
  zipStep?: number;
  zipDone?: boolean;
  zipError?: string | null;

  userEmail?: string;

  zipPercent?: number;
};

function openGmailInbox() {
  window.open("https://mail.google.com/mail/u/0/#inbox", "_blank", "noopener,noreferrer");
}

const steps = ["Sending request", "Generating PDFs", "Building ZIP", "Emailing you"];

// helper: zipStep -> percent (fake but looks like download)
// function stepToPercent(step: number, totalSteps: number) {
//   if (totalSteps <= 1) return 0;
//   const clamped = Math.max(0, Math.min(step, totalSteps - 1));
//   return Math.round((clamped / (totalSteps - 1)) * 100);
// }

export default function ZIPModal(props: ModalType) {
  const {
    open,
    onCloseModal,
    zipLoading = false,
    zipStep = 0,
    zipDone = false,
    zipError = null,
    userEmail,
    // zipPercent,
  } = props;

  const showDone = !zipLoading && zipDone && !zipError;
  const showError = !zipLoading && !!zipError;

  const activeIdx = Math.min(zipStep, steps.length - 1);

  // ✅ use real percent if provided, else map step -> %
  // const percent = typeof zipPercent === "number"
  //   ? Math.max(0, Math.min(100, Math.round(zipPercent)))
  //   : stepToPercent(activeIdx, steps.length);

  // ...inside ZIPModal component
  const [displayPercent, setDisplayPercent] = useState(0);

  // target percent by step (feel free to tune these)
  const targetPercent = useMemo(() => {
    if (!zipLoading) return zipDone ? 100 : 0;

    // milestones (looks realistic)
    const milestones = [10, 55, 85, 95]; // step0..step3
    return milestones[activeIdx] ?? 95;
  }, [zipLoading, zipDone, activeIdx]);

  useEffect(() => {
    // reset when modal opens again
    if (!open) return;

    // if done, jump to 100 smoothly as well
    const finalTarget = zipDone ? 100 : targetPercent;

    const id = window.setInterval(() => {
      setDisplayPercent((p) => {
        if (p >= finalTarget) return p;
        return p + 1;
      });
    }, 40); 

    return () => window.clearInterval(id);
  }, [open, targetPercent, zipDone]);


  return (
    <Modal open={open} onClose={zipLoading ? undefined : onCloseModal} aria-labelledby="zip-modal-title">
      <Box sx={style}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
          <Box sx={{ textAlign: "left" }}>
            <Typography id="zip-modal-title" variant="h6" sx={{ fontWeight: 800 }}>
              {zipLoading ? "Preparing your ZIP…" : showDone ? "ZIP sent ✅" : showError ? "Failed ❌" : "Status"}
            </Typography>

            <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
              {zipLoading
                ? "Please don’t close this window."
                : showDone
                  ? userEmail
                    ? `Check your inbox: ${userEmail}`
                    : "Please check your inbox."
                  : showError
                    ? "Please try again."
                    : ""}
            </Typography>
          </Box>

          <IconButton onClick={onCloseModal} disabled={zipLoading} size="small">
            <Close />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Progress */}
        <Box sx={{ textAlign: "left" }}>
          <Stepper activeStep={activeIdx} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {zipLoading && (
            <Box sx={{ mt: 2 }}>
              {/* ✅ Download style progress */}
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.75 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
                  {steps[activeIdx]}…
                </Typography>
                {/* <Typography sx={{ fontWeight: 800, fontSize: 14 }}>
                  {percent}%
                </Typography> */}
              </Box>

              <LinearProgress
                variant="determinate"
                value={displayPercent}
                sx={{
                  height: 12,
                  borderRadius: 999,
                  bgcolor: "rgba(0,0,0,0.08)",
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 999,
                    backgroundColor: COLORS.seconday,
                  },
                }}
              />

              <Typography sx={{ fontWeight: 800, fontSize: 14 }}>
                {displayPercent}%
              </Typography>

            </Box>
          )}

          {showError && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="error">{zipError}</Alert>
            </Box>
          )}

          {showDone && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="success">
               Hurry! 🎉 Your ZIP has been emailed. If you don’t see it, check Spam/Promotions.
              </Alert>
            </Box>
          )}
        </Box>

        {/* Buttons */}
        <Box sx={{ display: "flex", gap: 1.5, mt: 3, justifyContent: "center" }}>
          <LandingButton title="Open Gmail" onClick={openGmailInbox} width="200px" loading={zipLoading} />
        </Box>
      </Box>
    </Modal>
  );
}

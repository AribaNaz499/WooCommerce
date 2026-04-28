import { Box, Typography } from "@mui/material";
import DashboardLayout from "../../../layout/DashboardLayout";
import { useLocation } from "react-router-dom";
import useModal from "../../../hooks/useModal";
import BundleModal from "./components/BundleModal";
import OurBundles from "./components/OurBundles";
import { useQueryClient } from "@tanstack/react-query";
import PremiumCards from "./components/PremiumCard";

const OccasionBundle = () => {
  const { state } = useLocation();
  const cardStatus = state?.code;

  const qc = useQueryClient();

  const { open: isOpenBundleModal, openModal: openBundleModal, closeModal: closeBundleModal } = useModal();

  return (
    <DashboardLayout title="Our Bundles" addBtn={cardStatus === "bundle" ? "Add Bundles" : ""} onClick={openBundleModal}>
      {cardStatus === "bundle" ? (
        <OurBundles />
      ) : cardStatus === "pro" ? (
        <PremiumCards />
      ) : (
        <Box sx={{ p: 2 }}>
          <Typography sx={{ fontWeight: 700 }}>Pro users..</Typography>
        </Box>
      )}

      {isOpenBundleModal && (
        <BundleModal
          open={isOpenBundleModal}
          onCloseModal={closeBundleModal}
          mode="add"
          onSaved={async () => {
            await qc.invalidateQueries({ queryKey: ["bundles:list"] });
          }}
        />
      )}
    </DashboardLayout>
  );
};

export default OccasionBundle;
